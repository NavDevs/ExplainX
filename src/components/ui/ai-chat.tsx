"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Trash2, Settings, Image as ImageIcon, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          chrome.storage.local.set({ explainx_chat_messages: updated });
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
          chrome.storage.local.set({ explainx_chat_messages: updated });
          return updated;
        });
        setStreamText("");
        setIsTyping(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Auto-scroll on new messages or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

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
    chrome.storage.local.set({ explainx_chat_messages: updated });
    
    const sentImage = pendingImage;
    setInput("");
    setPendingImage(null);
    setIsTyping(true);
    setKeyError(null);

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
    setMessages([]);
    chrome.storage.local.set({ explainx_chat_messages: [] });
  };

  return (
    <div className={cn("relative w-full h-full rounded-2xl overflow-hidden p-[2px]", className)}>
      {/* Animated Outer Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-white/20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner Glass Card */}
      <div className="relative flex flex-col w-full h-full rounded-xl border border-white/10 overflow-hidden bg-black/90 backdrop-blur-xl">
        {/* Inner Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-950 opacity-90"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />

        {/* Floating Ambient Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/15 pointer-events-none"
            animate={{
              y: ["0%", "-140%"],
              x: [Math.random() * 160 - 80, Math.random() * 160 - 80],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
            style={{ left: `${Math.random() * 100}%`, bottom: "-10%" }}
          />
        ))}

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">ExplainX</h2>
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                {provider === "groq" ? "Groq (Ultra-Fast)" : "Gemini (Vision)"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSetupMode(!setupMode)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                setupMode ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/70 hover:text-white"
              )}
              title="API Key Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Setup / API Key Modal Panel */}
        <AnimatePresence>
          {setupMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 border-b border-white/10 relative z-20 bg-gray-900/90 backdrop-blur-md space-y-2.5 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" /> AI Provider & Key
                </span>
                {keyError && (
                  <span className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Key Error
                  </span>
                )}
              </div>

              {keyError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
                  {keyError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("groq")}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium border transition-all text-center",
                    provider === "groq"
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                      : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  ⚡ Groq (Fast)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("gemini")}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium border transition-all text-center",
                    provider === "gemini"
                      ? "bg-purple-600/30 border-purple-500 text-white shadow-sm"
                      : "bg-black/40 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  👁️ Gemini (Photos)
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
                  placeholder={`Paste ${provider === "groq" ? "Groq (gsk_...)" : "Gemini"} API Key`}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs bg-black/60 rounded-lg border text-white placeholder-white/40 focus:outline-none transition-all",
                    keyError ? "border-red-500/80 focus:ring-1 focus:ring-red-500" : "border-white/15 focus:ring-1 focus:ring-blue-500"
                  )}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveKey}
                  className={cn(
                    "flex-1 py-1.5 px-3 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1.5",
                    saveSuccess
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30"
                  )}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </>
                  ) : (
                    "Save & Connect"
                  )}
                </button>
                {hasKey && (
                  <button
                    onClick={() => setSetupMode(false)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/15 text-white/70"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages Scrolling Area */}
        <div className="flex-1 min-h-0 px-4 py-3 overflow-y-auto space-y-3 text-sm flex flex-col relative z-10">
          {messages.length === 0 && !setupMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3.5 py-3 rounded-2xl max-w-[85%] bg-white/10 text-white/90 self-start backdrop-blur-md border border-white/10"
            >
              <div className="font-semibold mb-1 text-xs text-blue-300">👋 Welcome to ExplainX</div>
              <div className="text-xs text-white/80 leading-relaxed">
                I can help you understand code, explain concepts, answer questions, or analyze photos!
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "px-3.5 py-2.5 rounded-2xl max-w-[85%] shadow-md backdrop-blur-md whitespace-pre-wrap break-words text-xs leading-relaxed",
                msg.role === "assistant"
                  ? msg.isError
                    ? "bg-red-950/60 border border-red-500/40 text-red-200 self-start"
                    : "bg-white/10 border border-white/10 text-white self-start"
                  : "bg-blue-600 text-white font-medium self-end shadow-blue-900/40"
              )}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded preview"
                  className="max-h-48 max-w-full rounded-lg mb-2 object-cover border border-white/15 block"
                />
              )}
              {msg.content}
              {msg.isError && (
                <button
                  onClick={() => setSetupMode(true)}
                  className="mt-2 block text-[11px] underline text-blue-300 hover:text-blue-200 font-normal"
                >
                  🔑 Click here to update your API key
                </button>
              )}
            </motion.div>
          ))}

          {/* Live Streaming Response Preview */}
          {isTyping && streamText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3.5 py-2.5 rounded-2xl max-w-[85%] bg-white/10 border border-white/10 text-white self-start whitespace-pre-wrap break-words text-xs leading-relaxed"
            >
              {streamText}
            </motion.div>
          )}

          {/* Typing Pulse Dots */}
          {isTyping && !streamText && (
            <motion.div
              className="flex items-center gap-1 px-3 py-2 rounded-2xl max-w-[30%] bg-white/10 border border-white/10 self-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-300"></span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Attachment Preview */}
        {pendingImage && (
          <div className="px-4 py-2 border-t border-white/10 relative z-10 bg-black/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={pendingImage}
                alt="Selected"
                className="w-12 h-12 rounded-lg object-cover border border-white/20"
              />
              <span className="text-[11px] text-white/70">Photo attached for analysis</span>
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

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 relative z-10 bg-black/40 backdrop-blur-md flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
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
            className={cn(
              "p-2 rounded-lg transition-colors flex-shrink-0",
              pendingImage
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            )}
            title="Upload photo for AI analysis"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            className="flex-1 px-3 py-2 text-xs bg-black/60 rounded-lg border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={pendingImage ? "Ask about this photo..." : "Type a message or paste image..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onPaste={handlePaste}
            disabled={!hasKey}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || isTyping || !hasKey}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-blue-900/30"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
