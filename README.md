# ⚡ ExplainX - AI-Powered Text Explanations

ExplainX is a powerful Chrome Extension that provides instant AI-powered explanations for any text on the web. Select any text, click ExplainX, and get clear, concise explanations in seconds.

![ExplainX Logo](src/icons/icon128.png)

---

## ✨ Features

### 🎯 Powerful AI Integration
- **Default Groq API Key**: Fully integrated Groq API for blazing fast inference without needing your own API key.
- **Vision Capabilities**: Powered by the `llama-4-scout` multimodal model. Upload screenshots or simply use `Ctrl+V` to paste images directly into the chat for instant visual analysis!
- **Empathetic Chatbot**: The AI isn't just a textbook; it has a friendly, supportive, and emotionally intelligent personality designed to be conversational.
- **Multiple Explanation Modes**: Switch between Simple (ELI5), Student (academic), Code (syntax breakdown), Interview (prep), or Summary mode.

### 💻 Premium UI Experience
- **ChatGPT-Style Actions**: Hover over any chat message to quickly **Copy** the AI's response or **Edit** your previous requests!
- **Dark Mode by Default**: A sleek, modern, fully dark interface with tailored typography and layout.
- **Draggable Interface**: The activation button is a draggable floating icon, keeping it out of your way until you need it.

### 🔧 Page Commands (No AI needed)
- `/goto <url>` - Open any URL
- `/open <url>` - Open any URL
- `/refresh` - Reload page
- `/back` - Go back
- `/forward` - Go forward
- `/scrollup [px]` - Scroll up
- `/scrolldown [px]` - Scroll down
- `/copy` - Copy page text
- `/print` - Print page
- `/help` - Show all commands

### 🔒 Privacy First
- All data stays local
- No tracking or analytics

---

## 🚀 Quick Install

1. Go to [Releases](https://github.com/NavDevs/ExplainX/releases)
2. Download the latest ZIP file
3. Extract to a folder
4. Open Chrome → `chrome://extensions`
5. Enable **Developer mode**
6. Click **Load unpacked**
7. Select the extracted folder
8. Done! 🎉

---

## 📖 How to Use

### Basic Explanation
1. **Select any text** on any webpage
2. **Click the ExplainX button** that appears
3. **Get instant explanation** in the sidebar
4. **Ask follow-up questions** in the chat

### Page Commands
Just type commands in the chat - no AI needed!
```
/scrollup       → Scroll up 300px
/scrolldown 500 → Scroll down 500px
/goto wikipedia.org → Open URL
/help          → Show all commands
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### Project Structure
```
ExplainX/
├── src/           # Source code
│   ├── content.ts  # Content script
│   ├── background.ts # Service worker
│   └── utils/    # Helper functions
├── docs/          # Website
├── dist/          # Built extension
└── package.json  # Dependencies
```

---

## 🐛 Troubleshooting

### Extension not working?
1. Make sure Developer mode is enabled
2. Reload the extension in `chrome://extensions`
3. Check console for errors (F12 → Console)

### API errors?
1. Verify your API key is correct
2. Check if you have API credits remaining
3. Check your internet connection

---

## 📄 License

MIT License

---

## 🙏 Support

⭐ **Star this repository**  
🐛 **Report issues**  
💬 **Share feedback**

---

**Made with ❤️ for learners everywhere**