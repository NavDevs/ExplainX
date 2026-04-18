import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { isCode } from './utils/codeDetector';
import { ALL_MODES, MODE_LABELS } from './utils/promptTemplates';
import { Mode, ChatMessage, generateId, escapeHtml, saveChatMessage, getChatMessages, clearChatMessages } from './utils/storage';

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
let isDarkMode = false; 

chrome.storage.local.get(['isDarkMode'], (result) => {
  isDarkMode = !!result.isDarkMode;
});

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
    
    appendChatMessage(assistantMsg);
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
    toggleBtn.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon128.jpg')}" alt="logo" class="explainx-toggle-logo" />`;
    toggleBtn.title = 'Open ExplainX Chat';
    document.body.appendChild(toggleBtn);
    
    if (isDarkMode) {
      toggleBtn.classList.add('dark-mode');
    }
    
    toggleBtn.addEventListener('click', () => {
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
  isDarkMode = await new Promise((resolve) => {
    chrome.storage.local.get(['isDarkMode'], (result) => {
      resolve(!!result?.isDarkMode);
    });
  });

  const overlay = getOrCreateOverlay();
  const toggleBtn = getOrCreateToggle();
  
  if (isDarkMode) {
    overlay.classList.add('dark-mode');
    toggleBtn.classList.add('dark-mode');
  } else {
    overlay.classList.remove('dark-mode');
    toggleBtn.classList.remove('dark-mode');
  }

  toggleBtn.classList.add('hidden');
  
  chatMessages = await getChatMessages();

  overlay.innerHTML = `
    <div id="explainx-popup">
      <div class="explainx-header">
        <span class="explainx-logo">
          <img src="${chrome.runtime.getURL('icons/icon128.jpg')}" alt="logo" class="explainx-chat-logo" /> 
          ExplainX
        </span>
        <div class="header-actions">
          <button class="theme-toggle-btn" id="theme-toggle-btn" title="Toggle Dark Mode">
            ${isDarkMode ? '☀️' : '🌙'}
          </button>
          <button class="header-btn" id="export-chat-btn" title="Export Conversation">Export</button>
          <button class="header-btn" id="clear-chat-btn" title="Clear Chat">Clear</button>
          <button class="explainx-close" id="explainx-close-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="explainx-chat-body" id="chat-body">
        ${chatMessages.map(msg => renderChatMessage(msg)).join('')}
      </div>
      <div class="explainx-chat-input">
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

function renderChatMessage(msg: ChatMessage): string {
  if (msg.role === 'user') {
    return `<div class="chat-message user">${escapeHtml(msg.content)}</div>`;
  } else {
    const rawHtml = marked.parse(msg.content) as string;
    return `<div class="chat-message assistant">${rawHtml}</div>`;
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
  const themeToggle = document.getElementById('theme-toggle-btn');
  themeToggle?.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    chrome.storage.local.set({ isDarkMode });
    const overlay = document.getElementById('explainx-overlay');
    const toggleBtn = document.getElementById('explainx-toggle-btn');
    if (isDarkMode) {
      overlay?.classList.add('dark-mode');
      toggleBtn?.classList.add('dark-mode');
      themeToggle.innerHTML = '☀️';
    } else {
      overlay?.classList.remove('dark-mode');
      toggleBtn?.classList.remove('dark-mode');
      themeToggle.innerHTML = '🌙';
    }
  });

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
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input') as HTMLTextAreaElement;
  if (!input || !input.value.trim() || isLoading) return;

  const message = input.value.trim();
  
  const lastSelectedText = chatMessages
    .slice()
    .reverse()
    .find(m => m.selectedText)?.selectedText;
  
  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
    selectedText: lastSelectedText 
  };
  
  appendChatMessage(userMsg, true);
  
  input.value = '';
  input.style.height = 'auto';
  
  isLoading = true;
  showLoadingInChat();
  
  const conversationHistory = chatMessages
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content, selectedText: m.selectedText }));
  
  chrome.runtime.sendMessage({
    type: 'CHAT_MESSAGE',
    message: message,
    conversationHistory: conversationHistory
  });
}

function appendChatMessage(msg: ChatMessage, save: boolean = true) {
  chatMessages.push(msg);
  
  if (save) {
    saveChatMessage(msg);
  }
  
  const chatBody = document.getElementById('chat-body');
  if (chatBody) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = renderChatMessage(msg);
    chatBody.appendChild(msgDiv.firstElementChild!);
    enhanceCodeBlocks();
    scrollToBottom();
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

function scrollToBottom() {
  const chatBody = document.getElementById('chat-body');
  if (chatBody) {
    setTimeout(() => {
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
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
