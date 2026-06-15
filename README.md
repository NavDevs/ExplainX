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
- **ChatGPT-Style Actions**: Hover over any AI response to quickly **Copy** the text to your clipboard with a satisfying animated checkmark confirmation!
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

## 🚀 Installation & Deployment (Windows & macOS)

ExplainX is fully compatible with both **Windows** and **macOS** (as well as Linux). Since it is a Chrome Extension, it runs consistently across any desktop operating system!

### Step-by-step Guide
1. **Download the Release**: Go to the [Releases](https://github.com/NavDevs/ExplainX/releases) page and download the latest `ExplainX-vX.X.X.zip` file.
2. **Extract the ZIP**:
   - **Windows**: Right-click the `.zip` file and select "Extract All...".
   - **macOS**: Double-click the `.zip` file to automatically extract it into a folder.
3. **Open Chrome Extensions**: Open Google Chrome and type `chrome://extensions` in the URL bar, then hit Enter.
4. **Enable Developer Mode**: In the top right corner of the extensions page, toggle **Developer mode** to ON.
5. **Load the Extension**:
   - Click the **Load unpacked** button in the top left.
   - Select the folder you extracted in Step 2.
6. **Done! 🎉**: The ExplainX icon will now appear in your browser. Pin it to your toolbar for easy access!

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