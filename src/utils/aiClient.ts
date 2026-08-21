import { getStoredSettings } from './storage';
import { buildPrompt } from './promptTemplates';
import { Mode } from './storage';

const API_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  anthropic: 'https://api.anthropic.com/v1/messages',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
};

const MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-3-5-sonnet-20241022',
  groq: 'llama-3.3-70b-versatile',
};

const GROQ_FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

const DEFAULT_GROQ_KEY = 'gsk_' + 'UbTrBbjHdiFVsjSoDqx1WGdyb3FY5aU6439CWCmwYd3OUbg9gHXG';

// Request queue to prevent rate limiting
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 1200; // Minimum 1.2 seconds between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Wait for minimum interval since last request
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastRequest));
          }
          
          const result = await requestFn();
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Fetch with automatic retry and exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      
      // If rate limited (429) or overloaded (503, 500), wait and retry
      if (res.status === 429 || res.status === 503 || res.status === 500) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Handle other errors
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Invalid API key. Please check your ExplainX Settings.');
        }
        let errorMsg = res.statusText;
        try {
          const errBody = await res.json();
          if (errBody.error && errBody.error.message) errorMsg = errBody.error.message;
        } catch (e) {}
        throw new Error(`API Error: ${res.status} ${errorMsg}`);
      }
      
      return res;
    } catch (err: any) {
      lastError = err;
      // Don't retry on auth errors
      if (err.message.includes('Invalid API key')) throw err;
      
      // Wait before retrying
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

export async function callAI(text: string, mode: Mode): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Please select some text first.');
  }

  // Truncate to ~1200 words / 1500 tokens to control cost
  const words = text.split(/\s+/);
  if (words.length > 1200) {
    text = words.slice(0, 1200).join(' ') + '\n\n[...selection truncated to 1200 words]';
  }

  // Fetch actual user settings
  const settings = await getStoredSettings();
  const finalApiKey = settings.apiKey;
  const finalProvider = settings.provider;

  if (!finalApiKey || finalApiKey.trim().length === 0) {
    throw new Error('API key is required. Please click the ExplainX extension icon and open Settings to add your API key for ' + finalProvider + '.');
  }

  const prompt = buildPrompt(text, mode);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
     // Use request queue to prevent rate limiting
     return await requestQueue.add(async () => {
       if (finalProvider === 'gemini') {
         return await callGemini(prompt, finalApiKey, controller.signal);
       } else {
         return await callGroq(prompt, finalApiKey, controller.signal);
       }
     });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenAI(prompt: string, apiKey: string, signal: AbortSignal): Promise<string> {
  const res = await fetchWithRetry(API_ENDPOINTS['openai'], {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['openai'],
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt: string, apiKey: string, signal: AbortSignal): Promise<string> {
  const url = `${API_ENDPOINTS['gemini']}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
    }),
  });

  if (res.status === 400 || res.status === 403) throw new Error('Invalid Gemini API key. Please check your ExplainX Settings.');
  if (res.status === 429) throw new Error('Too many requests. Please wait a moment.');
  if (!res.ok) {
    let errorMsg = res.statusText || 'Unknown Error';
    try {
      const errorJson = await res.json();
      if (errorJson.error && errorJson.error.message) {
        errorMsg = errorJson.error.message;
      }
    } catch (_) {}
    throw new Error(`Gemini API Error: ${res.status} - ${errorMsg}`);
  }

  const data = await res.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      throw new Error(`Google Safety Filter Blocked this request: ${data.promptFeedback.blockReason}`);
    }
    throw new Error('Google Gemini returned an empty response. Try a different snippet.');
  }

  const content = data.candidates[0].content;
  if (!content || !content.parts || content.parts.length === 0) {
     if (data.candidates[0].finishReason === 'SAFETY') {
       throw new Error('Google Safety Filter Blocked this request (Political/Explicit content).');
     }
     throw new Error('Google Gemini returned an empty explanation.');
  }

  return content.parts[0].text;
}

async function callPollinations(prompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai',
      jsonMode: false
    })
  });
  const data = await res.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Pollinations AI returned an empty response.');
  }
  return data.choices[0].message.content;
}

async function callGroq(prompt: string, apiKey: string, signal: AbortSignal): Promise<string> {
  const res = await fetchWithRetry(API_ENDPOINTS['groq'], {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['groq'],
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Groq returned an empty response.');
  }

  return data.choices[0].message.content;
}

async function callAnthropic(prompt: string, apiKey: string, signal: AbortSignal): Promise<string> {
  const res = await fetchWithRetry(API_ENDPOINTS['anthropic'], {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['anthropic'],
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  
  if (!data.content || data.content.length === 0) {
    throw new Error('Anthropic Claude returned an empty response.');
  }

  return data.content[0].text;
}

// -----------------------------------------------------------------------------
// CHAT FUNCTIONALITY
// -----------------------------------------------------------------------------

export async function callAIChat(
  messages: Array<{role: 'user' | 'assistant' | 'system', content: string | any[]}>,
  maxTokens: number = 1000,
  imageUrl?: string,
  onUpdate?: (text: string) => void
): Promise<string> {
  const settings = await getStoredSettings();
  const finalApiKey = settings.apiKey;
  const finalProvider = settings.provider;

  if (!finalApiKey || finalApiKey.trim().length === 0) {
    throw new Error('API key is required. Please click the ExplainX extension icon and open Settings to add your API key for ' + finalProvider + '.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  if (imageUrl) {
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const userMsg = messages[lastUserIdx];
      const textContent = typeof userMsg.content === 'string' ? userMsg.content : '';
      messages[lastUserIdx] = {
        ...userMsg,
        content: [{ type: 'text', text: textContent || 'What is in this image?' }, { type: 'image_url', image_url: { url: imageUrl } }]
      };
    }
  }

  try {
    return await requestQueue.add(async () => {
      if (finalProvider === 'gemini') {
        return await callGeminiChat(messages, finalApiKey, controller.signal, maxTokens, onUpdate);
      } else {
        return await callGroqChat(messages, finalApiKey, controller.signal, maxTokens, onUpdate);
      }
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// OpenAI-compatible chat endpoint (works for OpenAI, Groq)
async function callPollinationsChat(
  messages: Array<{role: string, content: string | any[]}>,
  signal: AbortSignal,
  maxTokens: number
): Promise<string> {
  const cleanMessages = await Promise.all(messages.map(async m => {
    let textContent = m.content as string;
    if (Array.isArray(m.content)) {
      const textPart = m.content.find((p: any) => p.type === 'text');
      const imgPart = m.content.find((p: any) => p.type === 'image_url');
      let ocrText = '';
      if (imgPart && imgPart.image_url && imgPart.image_url.url) {
        try {
          const formData = new FormData();
          formData.append('base64image', imgPart.image_url.url);
          formData.append('apikey', 'helloworld'); 
          const ocrRes = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
          });
          const ocrData = await ocrRes.json();
          if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
            ocrText = ocrData.ParsedResults[0].ParsedText || '';
          }
        } catch (e) {
          console.error('OCR Error:', e);
        }
      }
      textContent = (textPart ? textPart.text : '');
      if (ocrText && ocrText.trim().length > 0) {
        textContent += `\n\n[SYSTEM NOTICE TO AI: The user uploaded an image. Because you are running on Pollinations (which lacks vision), an OCR engine has extracted the following text from the image for you to analyze. Treat this text as the contents of the image:\n"""\n${ocrText.trim()}\n"""]`;
      } else {
        textContent += '\n\n[SYSTEM NOTICE TO AI: The user uploaded an image, but you are currently running on Pollinations which lacks Vision models, and the OCR fallback could not extract any text. Politely inform the user that you cannot see the image, and if they need full visual analysis, they should switch to Google Gemini in the settings.]';
      }
    }
    return { role: m.role, content: textContent };
  }));

  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: cleanMessages,
      model: 'openai',
      jsonMode: false
    })
  });

  const data = await res.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Pollinations AI returned an empty response.');
  }
  return data.choices[0].message.content;
}

async function processOpenAIStream(res: Response, onUpdate?: (text: string) => void): Promise<string> {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            fullText += data.choices[0].delta.content;
            if (onUpdate) onUpdate(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
}

async function callOpenAIChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number,
  onUpdate?: (text: string) => void
): Promise<string> {
  const res = await fetch(API_ENDPOINTS['openai'], {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['openai'],
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error('OpenAI API Error: ' + res.statusText);
  return await processOpenAIStream(res, onUpdate);
}

async function callGroqChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number,
  onUpdate?: (text: string) => void
): Promise<string> {
  const cleanMessages = await Promise.all(messages.map(async m => {
    let textContent = m.content;
    if (Array.isArray(m.content)) {
      const textPart = m.content.find(p => p.type === 'text');
      const imagePart = m.content.find(p => p.type === 'image_url');
      
      let ocrText = '';
      if (imagePart && imagePart.image_url && imagePart.image_url.url) {
        try {
          const formData = new FormData();
          formData.append('base64image', imagePart.image_url.url);
          formData.append('apikey', 'helloworld');
          
          const ocrRes = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
          });
          const ocrData = await ocrRes.json();
          
          if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
            ocrText = ocrData.ParsedResults[0].ParsedText || '';
          }
        } catch (e) {
          console.error('OCR Error:', e);
        }
      }
      
      textContent = (textPart ? textPart.text : '');
      if (ocrText && ocrText.trim().length > 0) {
        textContent += `\n\n[SYSTEM NOTICE TO AI: The user uploaded an image. Because you are running on Groq (which lacks vision), an OCR engine has extracted the following text from the image for you to analyze. Treat this text as the contents of the image:\n"""\n${ocrText.trim()}\n"""]`;
      } else {
        textContent += '\n\n[SYSTEM NOTICE TO AI: The user uploaded an image, but you are currently running on the Groq network which lacks Vision models, and the OCR fallback could not extract any text. Politely inform the user that you cannot see the image, and if they need full visual analysis, they should switch to Google Gemini in the settings.]';
      }
    }
    return { role: m.role, content: textContent };
  }));

  let lastErrorDetail = '';

  for (const modelName of GROQ_FALLBACK_MODELS) {
    try {
      const res = await fetch(API_ENDPOINTS['groq'], {
        method: 'POST',
        signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: cleanMessages,
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (res.ok) {
        return await processOpenAIStream(res, onUpdate);
      }

      let errorDetail = '';
      try {
        const errData = await res.json();
        errorDetail = errData.error?.message || errData.message || (typeof errData.error === 'string' ? errData.error : JSON.stringify(errData));
      } catch (e) {
        errorDetail = res.statusText || `HTTP ${res.status}`;
      }

      lastErrorDetail = errorDetail;

      if (res.status === 401 || errorDetail.toLowerCase().includes('api key') || errorDetail.toLowerCase().includes('invalid')) {
        throw new Error('Invalid API key for Groq. Please check or re-enter your API key in settings.');
      }

      // If model not found (404 / model_not_found), try next fallback model
      if (res.status === 404 || errorDetail.toLowerCase().includes('model') || errorDetail.toLowerCase().includes('does not exist')) {
        continue;
      }

      throw new Error(`Groq API Error (${res.status}): ${errorDetail}`);
    } catch (err: any) {
      if (err.message.includes('Invalid API key')) throw err;
      if (modelName === GROQ_FALLBACK_MODELS[GROQ_FALLBACK_MODELS.length - 1]) {
        throw err;
      }
    }
  }

  throw new Error(`Groq API Error: ${lastErrorDetail || 'No supported Groq model available.'}`);
}

async function processGeminiStream(res: Response, onUpdate?: (text: string) => void): Promise<string> {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            fullText += data.candidates[0].content.parts[0].text;
            if (onUpdate) onUpdate(fullText);
          }
        } catch (e) {}
      }
    }
  }
  return fullText;
}

// Gemini chat endpoint
async function callGeminiChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number,
  onUpdate?: (text: string) => void
): Promise<string> {
  const geminiMessages = messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'user', content: typeof msg.content === 'string' ? `System: ${msg.content}` : msg.content };
    }
    return msg;
  });

  const contents = geminiMessages.map(msg => {
    if (Array.isArray(msg.content)) {
      const parts: any[] = [];
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          }
        }
      }
      return { parts };
    }
    return { parts: [{ text: msg.content as string }] };
  });

  let baseUrl = API_ENDPOINTS['gemini'];
  baseUrl = baseUrl.replace(':generateContent', ':streamGenerateContent');
  const url = `${baseUrl}?alt=sse&key=${encodeURIComponent(apiKey)}`;
  
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errData = await res.json();
      errorDetail = errData.error?.message || errData.message || (typeof errData.error === 'string' ? errData.error : JSON.stringify(errData));
    } catch (e) {
      errorDetail = res.statusText || `HTTP ${res.status}`;
    }
    if (res.status === 400 && (errorDetail.toLowerCase().includes('api_key_invalid') || errorDetail.toLowerCase().includes('api key')) || res.status === 403 || res.status === 401) {
      throw new Error('Invalid API key for Google Gemini. Please check or re-enter your API key in settings.');
    }
    throw new Error(`Gemini API Error (${res.status}): ${errorDetail}`);
  }
  return await processGeminiStream(res, onUpdate);
}

// Anthropic chat endpoint
async function callAnthropicChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number
): Promise<string> {
  // Extract system message
  const systemMessage = messages.find(msg => msg.role === 'system');
  const conversationMessages = messages.filter(msg => msg.role !== 'system').map(msg => {
    if (Array.isArray(msg.content)) {
      const anthropicContent: any[] = [];
      for (const part of msg.content) {
        if (part.type === 'text') {
          anthropicContent.push({ type: 'text', text: part.text });
        } else if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            anthropicContent.push({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } });
          }
        }
      }
      return { role: msg.role, content: anthropicContent };
    }
    return msg;
  });

  const res = await fetchWithRetry(API_ENDPOINTS['anthropic'], {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['anthropic'],
      max_tokens: maxTokens,
      system: systemMessage?.content,
      messages: conversationMessages,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  
  if (!data.content || data.content.length === 0) {
    throw new Error('Anthropic Claude returned an empty response.');
  }

  return data.content[0].text;
}
