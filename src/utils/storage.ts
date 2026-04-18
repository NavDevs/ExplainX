// Types
export type Mode = 'simple' | 'student' | 'beginner-code' | 'interview' | 'summary';
export type Provider = 'openai' | 'gemini' | 'anthropic' | 'groq';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: Mode; // Optional: for text explanations
  selectedText?: string; // Optional: if message was from text selection
}

export interface ChatSession {
  messages: ChatMessage[];
  createdAt: number;
  lastActive: number;
}

export interface StoredSettings {
  apiKey: string;
  provider: Provider;
  defaultMode: Mode;
  theme: 'light' | 'dark';
}

export async function getStoredSettings(): Promise<StoredSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['explainx_api_key', 'explainx_provider', 'explainx_default_mode', 'explainx_theme'],
      (result) => {
        resolve({
          apiKey: (result.explainx_api_key as string) || '',
          provider: (result.explainx_provider as Provider) || 'openai',
          defaultMode: (result.explainx_default_mode as Mode) || 'simple',
          theme: (result.explainx_theme as 'light'|'dark') || 'light',
        });
      }
    );
  });
}

export async function saveSettings(settings: Partial<StoredSettings>): Promise<void> {
  return new Promise((resolve) => {
    const toSave: Record<string, any> = {};
    if (settings.apiKey !== undefined) toSave['explainx_api_key'] = settings.apiKey;
    if (settings.provider !== undefined) toSave['explainx_provider'] = settings.provider;
    if (settings.defaultMode !== undefined) toSave['explainx_default_mode'] = settings.defaultMode;
    if (settings.theme !== undefined) toSave['explainx_theme'] = settings.theme;
    chrome.storage.sync.set(toSave, () => resolve());
  });
}

export interface ExplanationRecord {
  text: string;
  mode: Mode;
  explanation: string;
  timestamp: number;
}

export async function saveToHistory(record: ExplanationRecord): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['explainx_history'], (result) => {
      const history: ExplanationRecord[] = (result.explainx_history as ExplanationRecord[]) || [];
      history.unshift(record);
      if (history.length > 20) history.pop();
      chrome.storage.local.set({ explainx_history: history }, () => resolve());
    });
  });
}

export async function getHistory(): Promise<ExplanationRecord[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['explainx_history'], (result) => {
      resolve((result.explainx_history as ExplanationRecord[]) || []);
    });
  });
}

export async function getLastMode(): Promise<Mode> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['explainx_last_mode'], (result) => {
      resolve((result.explainx_last_mode as Mode) || 'simple');
    });
  });
}

export async function saveLastMode(mode: Mode): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ explainx_last_mode: mode }, () => resolve());
  });
}

// Chat message storage functions
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['explainx_chat_messages'], (result) => {
      const messages: ChatMessage[] = (result.explainx_chat_messages as ChatMessage[]) || [];
      messages.push(message);
      // Limit to last 50 messages to prevent storage overflow
      if (messages.length > 50) messages.shift();
      chrome.storage.local.set({ explainx_chat_messages: messages }, () => resolve());
    });
  });
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['explainx_chat_messages'], (result) => {
      resolve((result.explainx_chat_messages as ChatMessage[]) || []);
    });
  });
}

export async function clearChatMessages(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ explainx_chat_messages: [] }, () => resolve());
  });
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
