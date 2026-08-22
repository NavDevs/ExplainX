"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  X, 
  Trash2, 
  Settings, 
  Image as ImageIcon, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  Bot,
  ArrowDown
} from "lucide-react";
import { marked } from "marked";
import { cn } from "@/lib/utils";

import hljs from 'highlight.js';

// Custom code block renderer - uses inline styles to avoid Tailwind purge of dynamic HTML
marked.use({
  renderer: {
    code(token: any) {
      const text = (typeof token === "object" && token.text !== undefined ? token.text : token) || "";
      const lang = ((typeof token === "object" && token.lang) || "code").toLowerCase();
      const encodedCode = encodeURIComponent(text);
      
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      let highlighted = text;
      try {
        highlighted = hljs.highlight(text, { language }).value;
      } catch (e) {
        highlighted = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      return `<div style="margin:10px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);background:#09090b;box-shadow:0 2px 10px rgba(0,0,0,0.4);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#18181b;border-bottom:1px solid rgba(255,255,255,0.1);">
    <span style="font-family:monospace;font-size:10px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:0.08em;">${lang}</span>
    <button type="button" class="explainx-copy-code-btn" data-code="${encodedCode}" style="padding:3px 10px;border-radius:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#d4d4d8;font-size:10px;font-family:sans-serif;cursor:pointer;display:flex;align-items:center;gap:4px;transition:background 0.2s;">
      <span class="btn-text">📋 Copy Code</span>
    </button>
  </div>
  <pre class="hljs" style="padding:14px;overflow-x:auto;font-size:12px;font-family:monospace;line-height:1.6;color:#e4e4e7;margin:0;background:rgba(0,0,0,0.6);"><code>${highlighted}</code></pre>
</div>`;
    }
  }
});

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string;
  isError?: boolean;
}

interface AIChatProps {
  className?: string;
  onClose?: () => void;
}

/**
 * Resize a base64 image to a small thumbnail for storage.
 * Max 100px wide/tall, JPEG quality 0.4 → typically under 3KB per image.
 */
function resizeImageForStorage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 100;
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.4));
      } else {
        resolve("[image]");
      }
    };
    img.onerror = () => resolve("[image]");
    img.src = dataUrl;
  });
}

export default function AIChatCard({ className, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"groq" | "gemini">("groq");
  const [hasKey, setHasKey] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

  // Persist messages to storage with thumbnail-resized images
  const persistMessages = async (msgs: ChatMsg[]) => {
    const trimmed = msgs.slice(-200);
    const stored = await Promise.all(
      trimmed.map(async (m) => {
        if (m.imageUrl && m.imageUrl.startsWith("data:")) {
          const thumb = await resizeImageForStorage(m.imageUrl);
          return { ...m, imageUrl: thumb };
        }
        return m;
      })
    );
    chrome.storage.local.set({ explainx_chat_messages: stored });
  };

  // Auto-resize textarea when input changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${Math.max(newHeight, 38)}px`;
    }
  }, [input]);

  // Load settings & saved messages on mount
  useEffect(() => {
    chrome.storage.sync.get(["explainx_api_key", "explainx_provider"], (sync) => {
      const key = (sync.explainx_api_key as string) || "";
      const prov = (sync.explainx_provider as string) || "groq";
      setApiKey(key);
      setProvider(prov as "groq" | "gemini");
      const valid = !!key.trim();
      setHasKey(valid);
      if (!valid) setSetupMode(true);
    });

    chrome.storage.local.get(["explainx_chat_messages"], (local) => {
      const msgs = (local.explainx_chat_messages as ChatMsg[]) || [];
      setMessages(msgs);
    });
  }, []);

  // Listen for background responses & live streaming
  useEffect(() => {
    const listener = (request: any) => {
      if (request.type === "CHAT_CHUNK") {
        setStreamText(request.text || "");
      } else if (request.type === "CHAT_RESPONSE") {
        const msg = request.message;
        setMessages((prev) => {
          const updated = [...prev, msg];
          persistMessages(updated);
          return updated;
        });
        setStreamText("");
        setIsTyping(false);
      } else if (request.type === "CHAT_ERROR") {
        const errText = request.error || "An unexpected error occurred.";
        const isAuthError =
          errText.toLowerCase().includes("api key") ||
          errText.toLowerCase().includes("invalid") ||
          errText.toLowerCase().includes("auth");

        if (isAuthError) {
          setKeyError(errText);
          setSetupMode(true);
        }

        setMessages((prev) => {
          const errMsg: ChatMsg = {
            id: "err_" + Date.now(),
            role: "assistant",
            content: "⚠️ " + errText,
            timestamp: Date.now(),
            isError: true,
          };
          const updated = [...prev, errMsg];
          persistMessages(updated);
          return updated;
        });
        setStreamText("");
        setIsTyping(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Smart Auto-scroll: Only scrolls if the user hasn't scrolled up to read history
  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamText]);

  // Track User Scroll Position to allow free scrolling up during generation
  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 70;
    isAutoScrollEnabled.current = isNearBottom;
    setShowScrollDownBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    isAutoScrollEnabled.current = true;
    setShowScrollDownBtn(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle Image File Selection
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Clipboard Paste for Images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !pendingImage) || isTyping) return;

    const userMsg: ChatMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      role: "user",
      content: text || "Please analyze this image.",
      timestamp: Date.now(),
      imageUrl: pendingImage || undefined,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    persistMessages(updated);
    
    const sentImage = pendingImage;
    setInput("");
    setPendingImage(null);
    setIsTyping(true);
    setKeyError(null);

    // Re-enable auto-scroll when sending
    isAutoScrollEnabled.current = true;
    setShowScrollDownBtn(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "38px";
    }

    const history = updated.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
      imageUrl: m.imageUrl,
    }));

    chrome.runtime.sendMessage({
      type: "CHAT_MESSAGE",
      message: text || "Please analyze this image.",
      conversationHistory: history,
      imageUrl: sentImage || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      setKeyError("API key cannot be empty.");
      return;
    }
    chrome.storage.sync.set(
      { explainx_api_key: apiKey.trim(), explainx_provider: provider },
      () => {
        setHasKey(true);
        setKeyError(null);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setSetupMode(false);
        }, 800);
      }
    );
  };

  const handleClear = () => {
    if (messages.length === 0) return;
    if (window.confirm("Clear all messages in this conversation?")) {
      setMessages([]);
      chrome.storage.local.set({ explainx_chat_messages: [] });
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const conversationText = messages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const role = m.role === "user" ? "You" : "ExplainX AI";
        return `[${time}] ${role}:\n${m.content}\n`;
      })
      .join("\n----------------------------------------\n\n");

    const blob = new Blob([conversationText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explainx-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Click delegation for "Copy Code" buttons inside markdown code blocks
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".explainx-copy-code-btn") as HTMLElement;
    if (btn) {
      e.stopPropagation();
      const codeToCopy = decodeURIComponent(btn.getAttribute("data-code") || "");
      navigator.clipboard.writeText(codeToCopy);
      const textSpan = btn.querySelector(".btn-text");
      if (textSpan) {
        textSpan.textContent = "✓ Copied!";
        btn.style.color = "#4ade80";
        btn.style.background = "rgba(74,222,128,0.15)";
        btn.style.borderColor = "rgba(74,222,128,0.4)";
        setTimeout(() => {
          textSpan.textContent = "📋 Copy Code";
          btn.style.color = "#d4d4d8";
          btn.style.background = "rgba(255,255,255,0.08)";
          btn.style.borderColor = "rgba(255,255,255,0.12)";
        }, 2000);
      }
    }
  };

  const renderMarkdown = (content: string) => {
    try {
      return { __html: marked.parse(content) as string };
    } catch {
      return { __html: content };
    }
  };

  return (
    <div className={cn("relative w-full h-full flex flex-col bg-black overflow-hidden font-sans", className)}>
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 relative z-20 flex items-center justify-between bg-zinc-950/90 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-wide">ExplainX</h1>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                AI
              </span>
            </div>
            <span className="text-[10px] text-white/50 font-mono">
              {provider === "groq" ? "Groq (Fast)" : "Gemini (Vision)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Export Chat */}
          <button
            onClick={handleExport}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export Conversation (.md)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClear}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setSetupMode(!setupMode)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              setupMode ? "bg-blue-600 text-white" : "hover:bg-white/10 text-white/70 hover:text-white"
            )}
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Close Sidebar */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors ml-1"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Setup / API Key Panel */}
      <AnimatePresence>
        {setupMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3.5 border-b border-white/10 relative z-20 bg-zinc-900/95 backdrop-blur-xl space-y-3 flex-shrink-0 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> AI Provider & Key Settings
              </span>
              {keyError && (
                <span className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Key Error
                </span>
              )}
            </div>

            {keyError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 leading-relaxed">
                {keyError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider("groq")}
                className={cn(
                  "px-3 py-2 text-xs rounded-lg font-medium border transition-all text-center flex items-center justify-center gap-1.5",
                  provider === "groq"
                    ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                    : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                )}
              >
                ⚡ Groq (Ultra-Fast)
              </button>
              <button
                type="button"
                onClick={() => setProvider("gemini")}
                className={cn(
                  "px-3 py-2 text-xs rounded-lg font-medium border transition-all text-center flex items-center justify-center gap-1.5",
                  provider === "gemini"
                    ? "bg-purple-600/30 border-purple-500 text-white shadow-sm"
                    : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                )}
              >
                👁️ Gemini (Vision)
              </button>
            </div>

            <div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyError(null);
                }}
                placeholder={`Paste ${provider === "groq" ? "Groq API Key (gsk_...)" : "Gemini API Key"}`}
                className={cn(
                  "w-full px-3 py-2 text-xs bg-black/60 rounded-lg border text-white placeholder-white/40 focus:outline-none transition-all",
                  keyError ? "border-red-500/80 focus:ring-1 focus:ring-red-500" : "border-white/15 focus:ring-1 focus:ring-blue-500"
                )}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                className={cn(
                  "flex-1 py-2 px-3 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1.5",
                  saveSuccess
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30"
                )}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Connected!
                  </>
                ) : (
                  "Save & Connect"
                )}
              </button>
              {hasKey && (
                <button
                  onClick={() => setSetupMode(false)}
                  className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/15 text-white/70"
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scrolling Area */}
      <div 
        ref={chatScrollRef}
        onScroll={handleScroll}
        onClick={handleContainerClick}
        className="flex-1 min-h-0 px-4 py-3 overflow-y-auto space-y-4 text-sm flex flex-col relative z-10 scroll-smooth"
      >
        {messages.length === 0 && !setupMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 text-white self-start backdrop-blur-md max-w-[90%] shadow-lg"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-blue-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to ExplainX
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              Ask anything, upload photos for visual analysis, or select text on any webpage to explain it!
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 bg-white/5 rounded-md text-[11px] text-zinc-400 border border-white/5">
                💡 Explain code & bugs
              </span>
              <span className="px-2 py-1 bg-white/5 rounded-md text-[11px] text-zinc-400 border border-white/5">
                🖼️ Analyze screenshots
              </span>
              <span className="px-2 py-1 bg-white/5 rounded-md text-[11px] text-zinc-400 border border-white/5">
                ⚡ Real-time AI answers
              </span>
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "group relative max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md",
              msg.role === "assistant"
                ? msg.isError
                  ? "bg-red-950/70 border border-red-500/40 text-red-200 self-start"
                  : "bg-zinc-900/90 border border-white/10 text-zinc-100 self-start"
                : "bg-blue-600 text-white font-medium self-end shadow-blue-900/30"
            )}
          >
            {/* Uploaded Image Preview */}
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="Uploaded"
                className="max-h-52 max-w-full rounded-lg mb-2 object-cover border border-white/15 block"
              />
            )}

            {/* Message Body */}
            {msg.role === "assistant" && !msg.isError ? (
              <div 
                className="explainx-markdown" 
                dangerouslySetInnerHTML={renderMarkdown(msg.content)} 
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            )}

            {/* Timestamp and Actions at bottom */}
            {msg.role === "assistant" && !msg.isError && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-[10px]"
                  title="Copy full message"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Action */}
            {msg.isError && (
              <button
                onClick={() => setSetupMode(true)}
                className="mt-2.5 block text-[11px] font-medium text-blue-400 hover:text-blue-300 underline"
              >
                🔑 Click here to update your API key
              </button>
            )}
          </motion.div>
        ))}

        {/* Live Streaming Response with Typewriter Glow Cursor */}
        {isTyping && streamText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[88%] rounded-2xl px-4 py-3 bg-zinc-900/90 border border-white/10 text-zinc-100 self-start text-xs leading-relaxed shadow-md relative"
          >
            <div 
              className="explainx-markdown inline" 
              dangerouslySetInnerHTML={renderMarkdown(streamText)} 
            />
            {/* Blinking Typewriter Cursor */}
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 rounded-sm animate-pulse align-middle shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          </motion.div>
        )}

        {/* Typing Pulse Dots */}
        {isTyping && !streamText && (
          <motion.div
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl max-w-[25%] bg-zinc-900/80 border border-white/10 self-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-300"></span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Bottom Button (Visible when user scrolls up) */}
      <AnimatePresence>
        {showScrollDownBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-16 right-5 z-30 p-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-black/60 backdrop-blur-md border border-white/20 transition-all flex items-center gap-1 text-[11px] font-medium"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Latest</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Image Preview Banner */}
      {pendingImage && (
        <div className="px-4 py-2 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={pendingImage}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover border border-white/20"
            />
            <div>
              <span className="text-xs text-white font-medium block">Photo attached</span>
              <span className="text-[10px] text-zinc-400">Ready for AI analysis</span>
            </div>
          </div>
          <button
            onClick={() => setPendingImage(null)}
            className="p-1 rounded-full bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-red-300 transition-colors"
            title="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar (Flushed to Bottom, Auto-Expanding) */}
      {/* Input Bar - all inline styles to prevent host page CSS override */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        background: "#09090b",
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        flexShrink: 0,
        zIndex: 20,
        boxSizing: "border-box",
      }}>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageFile(e.target.files[0]);
            }
          }}
        />

        {/* Photo Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload photo for AI analysis"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: pendingImage ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.15)",
            background: pendingImage ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)",
            color: pendingImage ? "#60a5fa" : "rgba(255,255,255,0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
            padding: 0,
            boxSizing: "border-box",
          }}
        >
          <ImageIcon style={{ width: "16px", height: "16px" }} />
        </button>

        {/* Auto-Expanding Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={!hasKey}
          placeholder={
            !hasKey
              ? "Enter your API key above to start..."
              : pendingImage
              ? "Ask about this photo... (Enter to send)"
              : "Type a message... (Shift+Enter for new line)"
          }
          style={{
            flex: 1,
            minHeight: "38px",
            maxHeight: "120px",
            padding: "9px 12px",
            fontSize: "13px",
            lineHeight: "1.5",
            color: "#f4f4f5",
            background: "#27272a",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            outline: "none",
            resize: "none",
            overflowY: "auto",
            fontFamily: "inherit",
            boxSizing: "border-box",
            caretColor: "#60a5fa",
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !pendingImage) || isTyping || !hasKey}
          title="Send message (Enter)"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "rgb(37,99,235)",
            border: "none",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: ((!input.trim() && !pendingImage) || isTyping || !hasKey) ? 0.4 : 1,
            transition: "all 0.2s",
            padding: 0,
            boxSizing: "border-box",
          }}
        >
          <Send style={{ width: "16px", height: "16px" }} />
        </button>
      </div>
    </div>
  );
}
