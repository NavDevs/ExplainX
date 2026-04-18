# ⚡ ExplainX - AI-Powered Text Explanations

ExplainX is a powerful Chrome Extension that provides instant AI-powered explanations for any text on the web. Select any text, click ExplainX, and get clear, concise explanations in seconds.

![ExplainX Logo](src/icons/icon128.png)

---

## ✨ Features

### 🎯 Multiple AI Modes
- **Simple** - Easy explanations for anyone (ELI5)
- **Student** - Detailed explanations with examples
- **Beginner Code** - Code explanations for new developers
- **Interview** - Interview-focused technical prep
- **Summary** - Quick summaries of complex topics

### 💬 Interactive Chat
- Ask follow-up questions
- Get deeper explanations
- Conversation history saved locally
- Dark mode by default

### 🖱️ Draggable Toggle
- Toggle button is fully movable
- Position it anywhere on page

### 📱 Mobile Friendly
- Responsive chat UI
- Works on all screen sizes

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