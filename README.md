<<<<<<< HEAD
# ⚡ ExplainX - AI-Powered Text Explanations
=======

# ExplainX - AI Powered Browsing Companion
>>>>>>> d6fbcc3054b91653a13f7871bb1bee2b32db1f20

**ExplainX** is a powerful Chrome Extension that provides instant AI-powered explanations for any text on the web. Select any text, click ExplainX, and get clear, concise explanations in seconds.

![ExplainX Logo](src/icons/icon128.png)

---

## ✨ Features

### 🎯 Multiple AI Modes
- **Simple** - Easy explanations for anyone
- **Student** - Detailed explanations with examples
- **Beginner Code** - Code explanations for new developers
- **Interview** - Interview-focused explanations
- **Summary** - Quick summaries of complex topics

### 💬 Interactive Chat
- Ask follow-up questions
- Get deeper explanations
- Conversation history saved locally
- Clean, modern chat interface

### 🔒 Privacy First
- All data stays local
- No tracking or analytics
- Your API key, your control
- No data collection

### 🎨 Beautiful Design
- Clean, minimal interface
- Smooth animations
- Responsive sidebar
- Works on any website

---

## 🚀 Quick Install (30 Seconds)

### Step 1: Download
1. Go to [Releases](https://github.com/NavDevs/ExplainX/releases)
2. Download the latest ZIP file
3. Extract to a folder

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the extracted folder
5. Done! 🎉

### Step 3: Setup API Key
1. Click the ExplainX icon in your toolbar
2. Go to **Settings**
3. Add your API key (Groq, OpenAI, or Anthropic)
4. Start explaining!

---

## 📖 How to Use

1. **Select any text** on any webpage
2. **Click the ExplainX button** that appears
3. **Choose a mode** (Simple, Student, Code, etc.)
4. **Get instant explanation** in the sidebar
5. **Ask follow-up questions** in the chat

---

## 🔧 Supported AI Providers

ExplainX works with multiple AI providers:

| Provider | API Required | Cost |
|----------|-------------|------|
| **Groq** | ✅ Yes | Free tier available |
| **OpenAI** | ✅ Yes | Pay-per-use (~$0.01/request) |
| **Anthropic** | ✅ Yes | Pay-per-use |

### Get Your API Key

**Groq (Recommended - Free):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Create an API key
4. Add to ExplainX settings

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account
3. Get your API key
4. Add to ExplainX settings

---

## 🛠️ Development

### Tech Stack
- **TypeScript** - Type-safe development
- **Webpack** - Fast bundling
- **Marked** - Markdown rendering
- **Chrome Extension API** - Native browser integration

### Setup for Development

```bash
# Clone the repository
git clone https://github.com/NavDevs/ExplainX.git
cd ExplainX

# Install dependencies
npm install

# Development mode (auto-rebuild on changes)
npm run dev

# Build for production
npm run build
```

### Project Structure

```
ExplainX/
├── src/                    # Source code
│   ├── background.ts       # Service worker
│   ├── content.ts          # Content script
│   ├── popup.ts            # Popup logic
│   ├── options.ts          # Settings page
│   ├── components/         # UI components
│   ├── styles/             # CSS files
│   └── utils/              # Helper functions
├── website/                # Landing page
│   ├── index.html          # Main page
│   ├── styles.css          # Styles
│   └── script.js           # Scripts
├── dist/                   # Built extension (after npm run build)
└── package.json            # Dependencies
```

---

## 🌐 Website & Documentation

- **Landing Page**: [https://navdevs.github.io/ExplainX](https://navdevs.github.io/ExplainX/website/)
- **Quick Start Guide**: [QUICK_START.md](QUICK_START.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **AI Chat Integration**: [AI_CHAT_INTEGRATION.md](AI_CHAT_INTEGRATION.md)

---

## 📝 Privacy Policy

ExplainX respects your privacy:

✅ **No data collection** - We don't collect any personal information  
✅ **Local storage only** - Chat history stays on your device  
✅ **Your API key** - Stored locally, never transmitted to us  
✅ **Text only** - Only selected text is sent to your chosen AI provider  
✅ **No tracking** - No analytics or tracking scripts  

See full [Privacy Policy](PRIVACY_POLICY.md) for details.

---

## 🐛 Troubleshooting

### Extension not working?
1. Check if API key is added in Settings
2. Make sure Developer mode is enabled
3. Reload the extension in `chrome://extensions`
4. Check console for errors (F12 → Console)

### API errors?
1. Verify your API key is correct
2. Check if you have API credits remaining
3. Try a different AI provider
4. Check your internet connection

### Chat not loading?
1. Clear chat history in Settings
2. Reload the extension
3. Check browser console for errors

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🎨 Design improvements
- 🔧 Code contributions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Support

If you find ExplainX helpful:

⭐ **Star this repository** - It helps others discover the project!  
🐛 **Report issues** - Help us improve  
💬 **Share feedback** - Let us know what you think  

---

## 📞 Contact

- **GitHub**: [@NavDevs](https://github.com/NavDevs)
- **Issues**: [Report a bug](https://github.com/NavDevs/ExplainX/issues)
- **Website**: [https://navdevs.github.io/ExplainX](https://navdevs.github.io/ExplainX/website/)

---

**Made with ❤️ for learners everywhere**
