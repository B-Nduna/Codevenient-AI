"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, uploadedFile]);

  const sendMessage = async (msg = input) => {
    if (!msg.trim()) return;

    const newMessage = { sender: "user", text: msg };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    const textarea = document.querySelector("textarea");
    if (textarea) textarea.style.height = "auto";

    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });

      const reader = res.body.getReader();
      let aiMessage = "";
      setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiMessage += new TextDecoder().decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: "ai", text: aiMessage };
          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // New chat
  const newChat = async () => {
    setMessages([]);
    setUploadedFile(null);
    await sendMessage("new_chat");
  };

  // File upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadedFile(file);
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: `📎 Uploaded: ${file.name}` },
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.analysis || "File processed successfully." },
      ]);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  // Voice input
  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.start();
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white relative">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur-lg z-20 text-center p-4 flex flex-col gap-1"
      >
        <h1
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 drop-shadow-lg cursor-pointer"
          onClick={newChat}
        >
          Codevenient AI
        </h1>
        <p className="text-sm text-white/60">
          Your business assistant — concise & proactive
        </p>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2 pt-28 pb-28">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="flex items-center gap-2 mb-1 text-xs text-white/70">
                  <span className="text-blue-300">💼</span>
                  <span className="font-medium cursor-pointer" onClick={newChat}>
                    Codevenient AI
                  </span>
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[75%] whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg"
                    : "bg-white/20 text-white backdrop-blur-md border border-white/10"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-1 text-xs text-white/70">
                <span className="text-blue-300">💼</span>
                <span className="font-medium">Codevenient AI</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500/40 to-blue-500/40 text-white font-medium shadow-lg border border-white/10">
                Typing…
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Row */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-0 left-0 w-full p-3 bg-black/50 backdrop-blur-lg z-20"
      >
        {uploadedFile && (
          <div className="text-xs text-white/70 px-3 py-1 bg-white/10 rounded-lg flex justify-between items-center mb-2">
            <span>📎 {uploadedFile.name}</span>
            <button
              className="text-red-400 font-bold px-2"
              onClick={() => setUploadedFile(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach */}
          <input
            type="file"
            id="attachment"
            className="hidden"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <label
            htmlFor="attachment"
            className="p-3 rounded-2xl bg-white/10 text-white cursor-pointer hover:bg-white/20 transition flex items-center justify-center"
            title="Attach image or PDF"
          >
            📎
          </label>

          {/* Expandable textarea */}
          <textarea
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                e.currentTarget.style.height = "auto";
              }
            }}
            placeholder="Ask me about your business..."
            className="flex-1 p-3 rounded-2xl resize-none overflow-hidden bg-white/10 text-white placeholder-white/50 border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* Voice */}
          <button
            onClick={handleVoiceInput}
            className={`px-3 py-2 rounded-2xl ${
              listening ? "bg-red-500" : "bg-white/10 hover:bg-white/20"
            } text-white shadow-lg transition`}
            title="Speak"
          >
            🎤
          </button>

          {/* Send */}
          <button
            onClick={() => sendMessage()}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            ➤
          </button>
        </div>
      </motion.div>
    </main>
  );
}
