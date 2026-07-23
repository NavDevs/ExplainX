import { getStoredSettings } from './storage';
import { buildPrompt } from './promptTemplates';
import { Mode } from './storage';

const API_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  anthropic: 'https://api.anthropic.com/v1/messages',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
};

const MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-flash-latest',
  anthropic: 'claude-3-5-sonnet-20241022',
  groq: 'llama-3.2-11b-vision-preview',
};

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
      
      // If rate limited (429), wait and retry
      if (res.status === 429) {
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
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
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

  // Force hardcoded key and provider as requested
  let finalApiKey = DEFAULT_GROQ_KEY;
  let finalProvider = 'groq';

  // API key must be provided by user in extension settings or fallback to default
  if (!finalApiKey) {
    // throw new Error('API key is required. Please add your API key in ExplainX settings.');
  }

  const prompt = buildPrompt(text, mode);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
     // Use request queue to prevent rate limiting
     return await requestQueue.add(async () => {
       if (finalProvider === 'anthropic') {
         return await callAnthropic(prompt, finalApiKey, controller.signal);
       } else if (finalProvider === 'gemini') {
         return await callGemini(prompt, finalApiKey, controller.signal);
       } else if (finalProvider === 'groq') {
         return await callGroq(prompt, finalApiKey, controller.signal);
       } else {
         return await callOpenAI(prompt, finalApiKey, controller.signal);
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

// Chat-specific AI call with conversation history
export async function callAIChat(
  messages: Array<{role: 'user' | 'assistant' | 'system', content: string | any[]}>,
  maxTokens: number = 1000,
  imageUrl?: string
): Promise<string> {
  // Force hardcoded key and provider as requested
  let finalApiKey = DEFAULT_GROQ_KEY;
  let finalProvider = 'groq';

  // API key must be provided by user in extension settings or fallback to default
  if (!finalApiKey) {
    // throw new Error('API key is required. Please add your API key in ExplainX settings.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for chat

  // If imageUrl is provided, modify the last user message to include the image
  if (imageUrl) {
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const userMsg = messages[lastUserIdx];
      const textContent = typeof userMsg.content === 'string' ? userMsg.content : '';
      // Format depends on provider, but we prepare a generic structure here
      // Individual provider functions will handle their own format
      messages[lastUserIdx] = {
        ...userMsg,
        content: [{ type: 'text', text: textContent || 'What is in this image?' }, { type: 'image_url', image_url: { url: imageUrl } }]
      };
    }
  }

  try {
    return await requestQueue.add(async () => {
      if (finalProvider === 'anthropic') {
        return await callAnthropicChat(messages, finalApiKey, controller.signal, maxTokens);
      } else if (finalProvider === 'gemini') {
        return await callGeminiChat(messages, finalApiKey, controller.signal, maxTokens);
      } else if (finalProvider === 'groq') {
        return await callGroqChat(messages, finalApiKey, controller.signal, maxTokens);
      } else {
        return await callOpenAIChat(messages, finalApiKey, controller.signal, maxTokens);
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
async function callOpenAIChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number
): Promise<string> {
  const res = await fetchWithRetry(API_ENDPOINTS['openai'], {
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
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGroqChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number
): Promise<string> {
  const cleanMessages = messages.map(m => ({ role: m.role, content: m.content }));

  const res = await fetchWithRetry(API_ENDPOINTS['groq'], {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS['groq'],
      messages: cleanMessages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Groq returned an empty response.');
  }

  return data.choices[0].message.content;
}

// Gemini chat endpoint
async function callGeminiChat(
  messages: Array<{role: string, content: string | any[]}>,
  apiKey: string,
  signal: AbortSignal,
  maxTokens: number
): Promise<string> {
  // Gemini doesn't support system messages, convert to user message
  const geminiMessages = messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'user', content: typeof msg.content === 'string' ? `System: ${msg.content}` : msg.content };
    }
    return msg;
  });

  // Gemini expects different format - handle image content
  const contents = geminiMessages.map(msg => {
    if (Array.isArray(msg.content)) {
      const parts: any[] = [];
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url' && part.image_url?.url) {
          // Parse base64 data URL
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

  const url = `${API_ENDPOINTS['gemini']}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
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
