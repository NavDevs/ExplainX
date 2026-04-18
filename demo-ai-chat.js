// Demo script for AI Chat Component
// This demonstrates the component working standalone

class AIChatComponent {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.messagesContainer = null;
    this.inputElement = null;
    this.messages = [];
    this.isTyping = false;
    this.onSendMessage = null;
  }

  init(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.messages = [
      { sender: 'ai', text: '👋 Hello! I\'m your AI assistant.', timestamp: Date.now() }
    ];
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ai-chat-card">
        <div class="ai-chat-animated-border"></div>
        <div class="ai-chat-inner-card">
          <div class="ai-chat-animated-bg"></div>
          <div class="ai-chat-particles"></div>
          <div class="ai-chat-header">
            <h2 class="ai-chat-title">🤖 AI Assistant</h2>
          </div>
          <div class="ai-chat-messages" id="ai-chat-messages">
            ${this.renderMessages()}
          </div>
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
    this.inputElement = document.getElementById('ai-chat-input');
    this.createParticles();
  }

  renderMessages() {
    return this.messages.map((msg, i) => `
      <div class="ai-chat-message ${msg.sender}" style="animation-delay: ${i * 0.1}s">
        ${this.escapeHtml(msg.text)}
      </div>
    `).join('') + (this.isTyping ? this.renderTypingIndicator() : '');
  }

  renderTypingIndicator() {
    return `
      <div class="ai-chat-message ai typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
  }

  createParticles() {
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

  attachEventListeners() {
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

  handleSend() {
    if (!this.inputElement) return;
    
    const text = this.inputElement.value.trim();
    if (!text || this.isTyping) return;

    this.addMessage({ sender: 'user', text, timestamp: Date.now() });
    this.inputElement.value = '';

    if (this.onSendMessage) {
      this.onSendMessage(text);
    }
  }

  addMessage(message) {
    this.messages.push(message);
    this.updateMessages();
  }

  showTyping() {
    this.isTyping = true;
    this.updateMessages();
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    this.updateMessages();
  }

  updateMessages() {
    if (!this.messagesContainer) return;
    
    this.messagesContainer.innerHTML = this.renderMessages();
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (!this.messagesContainer) return;
    
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 50);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearMessages() {
    this.messages = [];
    this.updateMessages();
  }
}

// Initialize the demo
document.addEventListener('DOMContentLoaded', () => {
  const chatComponent = new AIChatComponent('ai-chat-container');
  
  chatComponent.init((message) => {
    // Simulate AI response
    chatComponent.showTyping();
    
    setTimeout(() => {
      chatComponent.hideTyping();
      chatComponent.addMessage({
        sender: 'ai',
        text: `🤖 This is a sample AI response to: "${message}"`,
        timestamp: Date.now()
      });
    }, 1200);
  });
});
