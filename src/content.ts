import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { isCode } from './utils/codeDetector';
import { ALL_MODES, MODE_LABELS } from './utils/promptTemplates';
import { Mode, ChatMessage, generateId, escapeHtml, saveChatMessage, getChatMessages, clearChatMessages } from './utils/storage';

// Base64 encoded icon48.png to bypass all website CSP restrictions on chrome-extension:// scheme
const LOGO_BASE64 = 'data:image/png;base64,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';

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

marked.setOptions({
  breaks: true,
  gfm: true
});

let currentSelectedText = '';
let currentMode: Mode = 'simple';
let sidebarVisible = false;
let chatMessages: ChatMessage[] = [];
let isLoading = false;
let isDarkMode = true;
let pendingImageUrl: string | null = null; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTION') {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    const anchorNode = selection?.anchorNode;
    const element = anchorNode instanceof Element
      ? anchorNode
      : anchorNode?.parentElement ?? null;
    const codeDetected = isCode(selectedText, element);

    currentSelectedText = selectedText;
    currentMode = codeDetected ? 'beginner-code' : 'simple';

    sendResponse({ selectedText, isCode: codeDetected });
    return true;
  }

  if (request.type === 'SHOW_LOADING') {
    currentMode = request.mode || currentMode;
    showChatSidebar().then(() => {
      // Show the highlighted text as a user message so they can see what was selected
      if (currentSelectedText) {
        const userMsg: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: currentSelectedText,
          timestamp: Date.now(),
          selectedText: currentSelectedText
        };
        appendChatMessage(userMsg, true);
      }
      showLoadingInChat();
    });
    return false;
  }

  if (request.type === 'SHOW_EXPLANATION') {
    currentMode = request.mode || currentMode;
    removeLoadingFromChat();
    
    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: request.explanation,
      timestamp: Date.now(),
      mode: request.mode,
      selectedText: currentSelectedText
    };
    
    appendChatMessage(assistantMsg, true, true);
    return false;
  }

  if (request.type === 'SHOW_ERROR') {
    removeLoadingFromChat();
    showErrorInChat(request.error);
    return false;
  }

  if (request.type === 'CHAT_RESPONSE') {
    removeLoadingFromChat();
    appendChatMessage(request.message);
    return false;
  }

  if (request.type === 'CHAT_ERROR') {
    removeLoadingFromChat();
    showErrorInChat(request.error);
    return false;
  }

  return false;
});

function getOrCreateToggle(): HTMLElement {
  let toggleBtn = document.getElementById('explainx-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'explainx-toggle-btn';
    toggleBtn.innerHTML = `<img src="${LOGO_BASE64}" alt="logo" class="explainx-toggle-logo" />`;
    toggleBtn.title = 'Open ExplainX Chat';
    document.body.appendChild(toggleBtn);
    
    if (isDarkMode) {
      toggleBtn.classList.add('dark-mode');
    }
    
    // Make the toggle button draggable
    let isDragging = false;
    let hasMoved = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.zIndex = '999999';
    toggleBtn.style.cursor = 'grab';
    
    const onDragStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      
      const point = 'touches' in e ? e.touches[0] : e as MouseEvent;
      startX = point.clientX;
      startY = point.clientY;
      
      const rect = toggleBtn.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      toggleBtn.style.cursor = 'grabbing';
    };
    
    const onDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const point = 'touches' in e ? e.touches[0] : e as MouseEvent;
      const deltaX = point.clientX - startX;
      const deltaY = point.clientY - startY;
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved = true;
      }
      
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;
      
      toggleBtn.style.left = newLeft + 'px';
      toggleBtn.style.top = newTop + 'px';
    };
    
    const onDragEnd = () => {
      isDragging = false;
      toggleBtn.style.cursor = 'grab';
    };
    
    const checkClick = (e: MouseEvent) => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      if (sidebarVisible) {
        hideSidebar();
      } else {
        showChatSidebar();
      }
    };
    
    toggleBtn.addEventListener('mousedown', onDragStart);
    toggleBtn.addEventListener('touchstart', onDragStart, { passive: false });
    
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
    
    toggleBtn.addEventListener('mouseup', () => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      if (sidebarVisible) {
        hideSidebar();
      } else {
        showChatSidebar();
      }
    });
  }
  return toggleBtn;
}

function getOrCreateOverlay(): HTMLElement {
  let overlay = document.getElementById('explainx-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'explainx-overlay';
    document.body.appendChild(overlay);
  }
  return overlay;
}

async function showChatSidebar() {
  sidebarVisible = true;
  
  // Guarantee we know the latest user preference every time we open!
  // Safely wrap in a Promise to support all Chrome versions
  const settings: any = await new Promise((resolve) => {
    chrome.storage.local.get(['isDarkMode'], (localRes) => {
      chrome.storage.sync.get(['explainx_api_key', 'explainx_provider'], (syncRes) => {
        resolve({
          isDarkMode: !!localRes?.isDarkMode,
          apiKey: syncRes?.explainx_api_key,
          provider: syncRes?.explainx_provider || 'groq'
        });
      });
    });
  });
  isDarkMode = settings.isDarkMode;

  const overlay = getOrCreateOverlay();
  const toggleBtn = getOrCreateToggle();
  
  if (isDarkMode) {
    overlay.classList.add('dark-mode');
  } else {
    overlay.classList.remove('dark-mode');
  }

  toggleBtn.classList.add('hidden');
  
  chatMessages = await getChatMessages();

  let missingKeyHtml = '';
  if (!settings.apiKey || settings.apiKey.trim().length === 0) {
    if (settings.provider !== 'pollinations') {
      missingKeyHtml = `
        <div class="explainx-setup-container" style="padding: 20px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); margin: 15px;">
          <h3 style="margin-top:0; color: var(--text-primary); font-size: 16px;">👋 Welcome to ExplainX</h3>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 15px;">To get started, please select your AI provider.</p>
          
          <label style="display:block; margin-bottom:5px; font-size: 12px; font-weight: bold; color: var(--text-secondary);">Provider:</label>
          <select id="inline-provider-select" style="width:100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-focus); margin-bottom: 15px; background: var(--bg-primary); color: var(--text-primary);">
            <option value="pollinations" ${settings.provider === 'pollinations' ? 'selected' : ''}>Free AI (No API Key Needed)</option>
            <option value="groq" ${settings.provider === 'groq' ? 'selected' : ''}>Groq (Requires API Key)</option>
            <option value="gemini" ${settings.provider === 'gemini' ? 'selected' : ''}>Google Gemini (Requires API Key)</option>
            <option value="openai" ${settings.provider === 'openai' ? 'selected' : ''}>OpenAI (Requires API Key)</option>
            <option value="anthropic" ${settings.provider === 'anthropic' ? 'selected' : ''}>Anthropic (Requires API Key)</option>
          </select>

          <div id="inline-apikey-container">
            <label style="display:block; margin-bottom:5px; font-size: 12px; font-weight: bold; color: var(--text-secondary);">API Key:</label>
            <input type="password" id="inline-apikey-input" placeholder="Paste your API key here..." style="width:100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-focus); margin-bottom: 15px; box-sizing: border-box; background: var(--bg-primary); color: var(--text-primary);" />
          </div>
          
          <button id="inline-apikey-save" style="width:100%; padding: 10px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;">Connect & Start Chatting</button>
        </div>
      `;
    }
  }

  pendingImageUrl = null;

  overlay.innerHTML = `
    <div id="explainx-popup">
      <div class="explainx-header">
        <span class="explainx-logo">
          <img src="${LOGO_BASE64}" alt="logo" class="explainx-chat-logo" /> 
          ExplainX
        </span>
        <div class="header-actions">
          <button class="header-btn" id="export-chat-btn" title="Export Conversation">Export</button>
          <button class="header-btn" id="clear-chat-btn" title="Clear Chat">Clear</button>
          <button class="explainx-close" id="explainx-close-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="explainx-chat-body" id="chat-body">
        ${missingKeyHtml}
        ${chatMessages.map(msg => renderChatMessage(msg)).join('')}
      </div>
      <div id="image-preview-container" class="explainx-image-preview" style="display:none;"></div>
      <div class="explainx-chat-input">
        <input type="file" id="image-file-input" accept="image/*" style="display:none;" />
        <button id="image-upload-btn" class="explainx-image-btn" title="Upload image">📷</button>
        <textarea id="chat-input" placeholder="Ask anything..." rows="1" aria-label="Chat input"></textarea>
        <button id="chat-send-btn">Send</button>
      </div>
    </div>
  `;

  // Force a browser reflow so the slide-in animation triggers correctly
  void overlay.offsetWidth;
  overlay.classList.add('active');

  enhanceCodeBlocks();
  attachChatEventListeners();
  scrollToBottom();
}

function renderChatMessage(msg: ChatMessage, animate: boolean = false): string {
  if (msg.role === 'user') {
    const imageHtml = msg.imageUrl ? `<img class="chat-image" src="${msg.imageUrl}" alt="Uploaded image" />` : '';
    return `<div class="chat-message user"><div class="message-content">${imageHtml}${escapeHtml(msg.content)}</div></div>`;
  } else {
    const rawHtml = animate ? '' : (marked.parse(msg.content) as string);
    const copyBtn = `<button class="message-action-btn copy-btn" title="Copy response" data-content="${escapeHtml(msg.content)}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>`;
    return `<div class="chat-message assistant"><div class="message-content">${rawHtml}</div><div class="message-actions">${copyBtn}</div></div>`;
  }
}

function enhanceCodeBlocks() {
  const chatBody = document.getElementById('chat-body');
  if (!chatBody) return;

  const preBlocks = chatBody.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    if (pre.hasAttribute('data-enhanced')) return;
    pre.setAttribute('data-enhanced', 'true');

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    
    const header = document.createElement('div');
    header.className = 'code-header';
    
    const codeBlock = pre.querySelector('code');
    let lang = 'Code';
    if (codeBlock) {
      const cls = codeBlock.className;
      const match = cls.match(/language-(\w+)/);
      if (match) lang = match[1];
    }
    
    header.innerHTML = `<span>${lang}</span>`;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-header-copy';
    copyBtn.innerHTML = `📋 Copy`;
    copyBtn.onclick = () => {
      const textToCopy = codeBlock ? codeBlock.innerText : pre.innerText;
      navigator.clipboard.writeText(textToCopy);
      copyBtn.innerHTML = `✅ Copied`;
      setTimeout(() => { copyBtn.innerHTML = `📋 Copy`; }, 2000);
    };
    
    header.appendChild(copyBtn);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function exportConversation() {
  if (chatMessages.length === 0) {
    alert("No messages to export.");
    return;
  }
  const text = chatMessages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n');
  navigator.clipboard.writeText(text);
  alert("Conversation copied to clipboard!");
}

function attachChatEventListeners() {
  const saveBtn = document.getElementById('inline-apikey-save');
  const select = document.getElementById('inline-provider-select') as HTMLSelectElement;
  const input = document.getElementById('inline-apikey-input') as HTMLInputElement;
  const inputContainer = document.getElementById('inline-apikey-container');

  if (select && inputContainer) {
    select.addEventListener('change', () => {
      if (select.value === 'pollinations') {
        inputContainer.style.display = 'none';
      } else {
        inputContainer.style.display = 'block';
      }
    });
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (select) {
        const isPollinations = select.value === 'pollinations';
        if (isPollinations || (input && input.value.trim().length > 0)) {
          saveBtn.textContent = 'Saving...';
          chrome.storage.sync.set({
            explainx_api_key: input ? input.value.trim() : '',
            explainx_provider: select.value
          }, () => {
            saveBtn.textContent = 'Connected! ✅';
            setTimeout(() => {
              showChatSidebar(); // Reload sidebar
            }, 600);
          });
        } else {
          alert('Please enter a valid API key.');
        }
      }
    };
  }

  document.getElementById('export-chat-btn')?.addEventListener('click', exportConversation);

  document.getElementById('explainx-close-btn')?.addEventListener('click', () => {
    hideSidebar();
  });

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideSidebar();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  document.getElementById('clear-chat-btn')?.addEventListener('click', async () => {
    if (confirm('Clear all chat messages?')) {
      await clearChatMessages();
      chatMessages = [];
      showChatSidebar();
    }
  });

  document.getElementById('chat-send-btn')?.addEventListener('click', () => {
    sendChatMessage();
  });

  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  
  const textarea = document.getElementById('chat-input') as HTMLTextAreaElement;
  if (textarea) {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    });
  }

  // Image upload handling
  const imageBtn = document.getElementById('image-upload-btn');
  const fileInput = document.getElementById('image-file-input') as HTMLInputElement;
  const previewContainer = document.getElementById('image-preview-container');

  imageBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    try {
      pendingImageUrl = await resizeAndEncode(file, 800);
      if (previewContainer) {
        previewContainer.innerHTML = `
          <img src="${pendingImageUrl}" alt="preview" />
          <button class="remove-image" id="remove-image-btn" title="Remove image">✕</button>
        `;
        previewContainer.style.display = 'flex';
        document.getElementById('remove-image-btn')?.addEventListener('click', () => {
          pendingImageUrl = null;
          previewContainer.innerHTML = '';
          previewContainer.style.display = 'none';
          fileInput.value = '';
        });
      }
    } catch (err) {
      console.error('Image processing error:', err);
    }
    // Reset file input so the same file can be re-selected
    fileInput.value = '';
  });

  // Paste image handling
  document.addEventListener('paste', async (e) => {
    if (!sidebarVisible) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            pendingImageUrl = await resizeAndEncode(file, 800);
            if (previewContainer) {
              previewContainer.innerHTML = `
                <img src="${pendingImageUrl}" alt="preview" />
                <button class="remove-image" id="remove-image-btn" title="Remove image">✕</button>
              `;
              previewContainer.style.display = 'flex';
              document.getElementById('remove-image-btn')?.addEventListener('click', () => {
                pendingImageUrl = null;
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
                if (fileInput) fileInput.value = '';
              });
            }
          } catch (err) {
            console.error('Pasted image processing error:', err);
          }
        }
        break;
      }
    }
  });

  // Action buttons delegation
  const chatBody = document.getElementById('chat-body');
  chatBody?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.message-action-btn') as HTMLButtonElement;
    if (!btn) return;

    const content = btn.getAttribute('data-content') || '';

    if (btn.classList.contains('copy-btn')) {
      navigator.clipboard.writeText(content).then(() => {
        const originalTitle = btn.title;
        const originalHtml = btn.innerHTML;
        btn.title = 'Copied!';
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.classList.add('copied');
        
        setTimeout(() => { 
          btn.title = originalTitle; 
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied');
        }, 2000);
      });
    } else if (btn.classList.contains('edit-btn')) {
      const input = document.getElementById('chat-input') as HTMLTextAreaElement;
      if (input) {
        input.value = content;
        input.focus();
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
      }
    }
  });
}

function resizeAndEncode(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;
  if (!input || (!input.value.trim() && !pendingImageUrl) || isLoading) return;

  const message = input.value.trim();
  const imageUrl = pendingImageUrl;
  
  // Clear image preview
  pendingImageUrl = null;
  const previewContainer = document.getElementById('image-preview-container');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
  }
  const fileInput = document.getElementById('image-file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
  
  // Simple command handler - executes without AI
  if (message.startsWith('/')) {
    const [cmd, ...args] = message.split(' ');
    const arg = args.join(' ');
    
    if (cmd === '/goto' || cmd === '/open') {
      window.open(arg, '_blank');
      appendChatMessage({ id: generateId(), role: 'assistant', content: `Opened: ${arg}`, timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/refresh' || cmd === '/reload') {
      window.location.reload();
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Page refreshed', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/back') {
      window.history.back();
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Went back', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/forward') {
      window.history.forward();
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Went forward', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/scrollup') {
      window.scrollBy(0, -(parseInt(arg) || 300));
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Scrolled up', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/scrolldown') {
      window.scrollBy(0, parseInt(arg) || 300);
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Scrolled down', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/print') {
      window.print();
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Print dialog opened', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/copy') {
      const text = document.body.innerText;
      navigator.clipboard.writeText(text);
      appendChatMessage({ id: generateId(), role: 'assistant', content: 'Page content copied to clipboard', timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
    
    if (cmd === '/help') {
      const helpText = `Available Commands:
/goto <url> - Open URL
/open <url> - Open URL  
/refresh - Reload page
/back - Go back
/forward - Go forward
/scrollup <px> - Scroll up (default 300)
/scrolldown <px> - Scroll down
/copy - Copy page text
/print - Print page
/help - Show commands`;
      appendChatMessage({ id: generateId(), role: 'assistant', content: helpText, timestamp: Date.now() }, true);
      input.value = '';
      return;
    }
  }
  
  const lastSelectedText = chatMessages
    .slice()
    .reverse()
    .find(m => m.selectedText)?.selectedText;
  
  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: message || (imageUrl ? 'Analyze this image' : ''),
    timestamp: Date.now(),
    selectedText: lastSelectedText,
    imageUrl: imageUrl || undefined
  };
  
  appendChatMessage(userMsg, true);
  
  input.value = '';
  input.style.height = 'auto';
  
  isLoading = true;
  showLoadingInChat();
  
  const conversationHistory = chatMessages
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content, selectedText: m.selectedText, imageUrl: m.imageUrl }));
  
  chrome.runtime.sendMessage({
    type: 'CHAT_MESSAGE',
    message: message || 'Analyze this image',
    conversationHistory: conversationHistory,
    imageUrl: imageUrl || undefined
  });
}

function appendChatMessage(msg: ChatMessage, save: boolean = true, animate: boolean = false) {
  chatMessages.push(msg);
  
  if (save) {
    saveChatMessage(msg);
  }
  
  const chatBody = document.getElementById('chat-body');
  if (chatBody) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = renderChatMessage(msg, animate);
    const newElement = msgDiv.firstElementChild as HTMLElement;
    chatBody.appendChild(newElement);
    
    if (animate && msg.role === 'assistant') {
      const contentDiv = newElement.querySelector('.message-content') as HTMLElement;
      if (contentDiv) {
        let i = 0;
        const fullText = msg.content;
        const speed = Math.max(3, Math.floor(fullText.length / 100));
        
        const interval = setInterval(() => {
          i += speed;
          if (i >= fullText.length) {
            i = fullText.length;
            clearInterval(interval);
            contentDiv.innerHTML = marked.parse(fullText) as string;
            enhanceCodeBlocks();
            scrollToBottom(true);
            return;
          }
          
          const currentText = fullText.slice(0, i);
          contentDiv.innerHTML = marked.parse(currentText) as string;
          scrollToBottom(true);
        }, 15);
      }
    } else {
      enhanceCodeBlocks();
      scrollToBottom();
    }
  }
}

function showLoadingInChat() {
  const chatBody = document.getElementById('chat-body');
  if (!chatBody) return;
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'chat-loading-indicator';
  loadingDiv.className = 'chat-loading';
  loadingDiv.innerHTML = '<span class="explainx-loading"><span class="explainx-spinner"></span> Thinking...</span>';
  chatBody.appendChild(loadingDiv);
  scrollToBottom();
}

function removeLoadingFromChat() {
  const loading = document.getElementById('chat-loading-indicator');
  if (loading) {
    loading.remove();
  }
  isLoading = false;
}

function showErrorInChat(error: string) {
  const chatBody = document.getElementById('chat-body');
  if (!chatBody) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'chat-error';
  errorDiv.textContent = `⚠️ ${error}`;
  chatBody.appendChild(errorDiv);
  scrollToBottom();
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function scrollToBottom(instant: boolean = false) {
  const chatBody = document.getElementById('chat-body');
  if (chatBody) {
    if (instant) {
      chatBody.scrollTop = chatBody.scrollHeight;
    } else {
      setTimeout(() => {
        chatBody.scrollTo({
          top: chatBody.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }
}

function hideSidebar() {
  sidebarVisible = false;
  const overlay = document.getElementById('explainx-overlay');
  const toggleBtn = document.getElementById('explainx-toggle-btn');
  
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
  
  if (toggleBtn) {
    toggleBtn.classList.remove('hidden');
  }
}

// Automatically create the floating toggle button on every targeted webpage so it is always accessible!
getOrCreateToggle();

// Protect the toggle button from being removed by Single Page Applications (SPAs)
const observer = new MutationObserver(() => {
  if (document.body && !document.getElementById('explainx-toggle-btn') && !document.getElementById('explainx-overlay')) {
    getOrCreateToggle();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
