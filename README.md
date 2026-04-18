# ⚡ ExplainX - AI-Powered Text Explanations

**ExplainX** is a powerful Chrome Extension that provides instant AI-powered explanations for any text on the web. Select any text, click ExplainX, and get clear, concise explanations in seconds.

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
- Clean, modern chat interface

### 🖱️ Draggable Toggle
- Toggle button is fully movable
- Position it anywhere on page
- Won't block website content
- Works on any website

### 📱 Mobile Friendly
- Responsive chat UI
- Works on all screen sizes
- Touch-enabled drag support

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
- Your API key, your control
- No data collection

### 🎨 Beautiful Design
- Clean, minimal interface
- Smooth animations
- Dark mode default
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

### Step 3: Start Using
- Select any text on any webpage
- Click the ExplainX button that appears
- Get instant explanation!
- Try commands like `/scrollup` or `/goto google.com`

---

## 📖 How to Use

### Basic Explanation
1. **Select any text** on any webpage
2. **Click the ExplainX button** that appears
3. **Choose a mode** (Simple, Student, Code, etc.)
4. **Get instant explanation** in the sidebar
5. **Ask follow-up questions** in the chat

### Page Commands
Just type commands in the chat - no AI needed!

```
/scrollup       → Scroll up 300px
/scrolldown 500 → Scroll down 500px
/goto wikipedia.org → Open URL
/refresh       → Reload page
/help          → Show all commands
```

### Reposition Toggle
- Click and drag the ExplainX button to move it
- Position it anywhere on the page
- It stays in place until moved again

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
│   ├── content.ts         # Content script
│   ├── popup.ts          # Popup logic
│   ├���─ options.ts        # Settings page
│   ├── components/       # UI components
│   ├── styles/          # CSS files
│   └── utils/            # Helper functions
├── docs/                 # Website
├── dist/                 # Built extension
└── package.json         # Dependencies
```

---

## 🌐 Website & Documentation

- **Landing Page**: https://navdevs.github.io/ExplainX/
- **GitHub**: https://github.com/NavDevs/ExplainX
- **Issues**: https://github.com/NavDevs/ExplainX/issues

---

## 📝 Privacy Policy

✅ **No data collection** - We don't collect any personal information  
✅ **Local storage only** - Chat history stays on your device  
✅ **Your API key** - Stored locally, never transmitted to us  
✅ **Text only** - Only selected text is sent to your chosen AI provider  
✅ **No tracking** - No analytics or tracking scripts  

---

## 🐛 Troubleshooting

### Extension not working?
1. Make sure Developer mode is enabled
2. Reload the extension in `chrome://extensions`
3. Check console for errors (F12 → Console)

### API errors?
1. Verify your API key is correct
2. Check if you have API credits remaining
3. Try a different AI provider
4. Check your internet connection

### Chat not loading?
1. Reload the extension
2. Check browser console for errors

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Support

⭐ **Star this repository** - It helps others discover the project!  
🐛 **Report issues** - Help us improve  
💬 **Share feedback** - Let us know what you think  

---

**Made with ❤️ for learners everywhere**