// AI Chat Component - Vanilla TypeScript Implementation
// Converted from React to work with Chrome Extension

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp?: number;
}

export class AIChatComponent {
  private container: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private messages: ChatMessage[] = [];
  private isTyping: boolean = false;
  private onSendMessage: ((message: string) => void) | null = null;

  constructor(private containerId: string = 'ai-chat-container') {}

  /**
   * Initialize the chat component
   */
  init(onSendMessage: (message: string) => void): void {
    this.onSendMessage = onSendMessage;
    this.messages = [
      { sender: 'ai', text: '👋 Hello! I\'m your AI assistant.', timestamp: Date.now() }
    ];
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the chat component
   */
  private render(): void {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ai-chat-card">
        <!-- Animated Outer Border -->
        <div class="ai-chat-animated-border"></div>

        <!-- Inner Card -->
        <div class="ai-chat-inner-card">
          <!-- Inner Animated Background -->
          <div class="ai-chat-animated-bg"></div>

          <!-- Floating Particles -->
          <div class="ai-chat-particles"></div>

          <!-- Header -->
          <div class="ai-chat-header">
            <h2 class="ai-chat-title">🤖 AI Assistant</h2>
          </div>

          <!-- Messages -->
          <div class="ai-chat-messages" id="ai-chat-messages">
            ${this.renderMessages()}
          </div>

          <!-- Input -->
          <div class="ai-chat-input-container">
            <input
              type="text"
              id="ai-chat-input"
              class="ai-chat-input"
              placeholder="Type a message..."
            />
            <button id="ai-chat-send-btn" class="ai-chat-send-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.messagesContainer = document.getElementById('ai-chat-messages');
    this.inputElement = document.getElementById('ai-chat-input') as HTMLInputElement;

    // Create particles
    this.createParticles();
  }

  /**
   * Render messages
   */
  private renderMessages(): string {
    return this.messages.map((msg, i) => `
      <div class="ai-chat-message ${msg.sender}" style="animation-delay: ${i * 0.1}s">
        ${this.escapeHtml(msg.text)}
      </div>
    `).join('') + (this.isTyping ? this.renderTypingIndicator() : '');
  }

  /**
   * Render typing indicator
   */
  private renderTypingIndicator(): string {
    return `
      <div class="ai-chat-message ai typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
  }

  /**
   * Create floating particles
   */
  private createParticles(): void {
    const particlesContainer = this.container?.querySelector('.ai-chat-particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'ai-chat-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${i * 0.5}s`;
      particle.style.animationDuration = `${5 + Math.random() * 3}s`;
      particlesContainer.appendChild(particle);
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const input = this.inputElement;

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSend());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleSend();
        }
      });
    }
  }

  /**
   * Handle sending a message
   */
  private handleSend(): void {
    if (!this.inputElement) return;
    
    const text = this.inputElement.value.trim();
    if (!text || this.isTyping) return;

    // Add user message
    this.addMessage({ sender: 'user', text, timestamp: Date.now() });
    
    // Clear input
    this.inputElement.value = '';

    // Trigger callback
    if (this.onSendMessage) {
      this.onSendMessage(text);
    }
  }

  /**
   * Add a message to the chat
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.updateMessages();
  }

  /**
   * Show typing indicator
   */
  showTyping(): void {
    this.isTyping = true;
    this.updateMessages();
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTyping(): void {
    this.isTyping = false;
    this.updateMessages();
  }

  /**
   * Update messages display
   */
  private updateMessages(): void {
    if (!this.messagesContainer) return;
    
    this.messagesContainer.innerHTML = this.renderMessages();
    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    
    setTimeout(() => {
      this.messagesContainer!.scrollTop = this.messagesContainer!.scrollHeight;
    }, 50);
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
    this.updateMessages();
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.messages = [];
    this.isTyping = false;
  }
}
