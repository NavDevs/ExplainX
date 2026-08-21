"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, X, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings & messages on mount
  useEffect(() => {
    chrome.storage.sync.get(["explainx_api_key", "explainx_provider"], (sync) => {
      const key = (sync.explainx_api_key as string) || "";
      const prov = (sync.explainx_provider as string) || "groq";
      setApiKey(key);
      setProvider(prov as "groq" | "gemini");
      setHasKey(!!key.trim());
      if (!key.trim()) setSetupMode(true);
    });
    chrome.storage.local.get(["explainx_chat_messages"], (local) => {
      const msgs = (local.explainx_chat_messages as ChatMsg[]) || [];
      setMessages(msgs);
    });
  }, []);

  // Listen for background responses
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
        setMessages((prev) => {
          const errMsg: ChatMsg = {
            id: "err_" + Date.now(),
            role: "assistant",
            content: "⚠️ Error: " + request.error,
            timestamp: Date.now(),
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    chrome.storage.local.set({ explainx_chat_messages: updated });
    setInput("");
    setIsTyping(true);

    const history = updated.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    chrome.runtime.sendMessage({
      type: "CHAT_MESSAGE",
      message: input,
      conversationHistory: history,
    });
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) return;
    chrome.storage.sync.set(
      { explainx_api_key: apiKey, explainx_provider: provider },
      () => {
        setHasKey(true);
        setSetupMode(false);
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

      {/* Inner Card */}
      <div className="relative flex flex-col w-full h-full rounded-xl border border-white/10 overflow-hidden bg-black/90 backdrop-blur-xl">
        {/* Inner Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 via-black to-gray-900"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/10"
            animate={{
              y: ["0%", "-140%"],
              x: [Math.random() * 200 - 100, Math.random() * 200 - 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
            style={{ left: `${Math.random() * 100}%`, bottom: "-10%" }}
          />
        ))}

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 relative z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">🤖 ExplainX</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setSetupMode(!setupMode)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Settings">
              <Settings className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Clear chat">
              <Trash2 className="w-4 h-4 text-white/60" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/30 transition-colors" title="Close">
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>
        </div>

        {/* Setup Panel */}
        {setupMode && (
          <div className="px-4 py-3 border-b border-white/10 relative z-10 space-y-2">
            <label className="text-xs text-white/60 block">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "groq" | "gemini")}
              className="w-full px-3 py-1.5 text-sm bg-black/50 rounded-lg border border-white/10 text-white"
            >
              <option value="groq">Groq</option>
              <option value="gemini">Google Gemini</option>
            </select>
            <label className="text-xs text-white/60 block">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key..."
              className="w-full px-3 py-1.5 text-sm bg-black/50 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/50"
            />
            <button
              onClick={handleSaveKey}
              className="w-full px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
            >
              Save & Connect
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 px-4 py-3 overflow-y-auto space-y-3 text-sm flex flex-col relative z-10">
          {messages.length === 0 && !setupMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-xl max-w-[80%] bg-white/10 text-white self-start"
            >
              👋 Hello! I'm your AI assistant. Ask me anything!
            </motion.div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "px-3 py-2 rounded-xl max-w-[80%] shadow-md backdrop-blur-md whitespace-pre-wrap break-words",
                msg.role === "assistant"
                  ? "bg-white/10 text-white self-start"
                  : "bg-white/30 text-black font-semibold self-end"
              )}
            >
              {msg.content}
            </motion.div>
          ))}

          {/* Streaming text */}
          {isTyping && streamText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-xl max-w-[80%] bg-white/10 text-white self-start whitespace-pre-wrap break-words"
            >
              {streamText}
            </motion.div>
          )}

          {/* AI Typing Indicator */}
          {isTyping && !streamText && (
            <motion.div
              className="flex items-center gap-1 px-3 py-2 rounded-xl max-w-[30%] bg-white/10 self-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t border-white/10 relative z-10">
          <input
            className="flex-1 px-3 py-2 text-sm bg-black/50 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white/50"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!hasKey}
          />
          <button
            onClick={handleSend}
            disabled={!hasKey || isTyping}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
