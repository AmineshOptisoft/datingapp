"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";

export default function MessagesPage() {
  const router = useRouter();
  const { messages, sendMessage, isConnected, userId } = useSocket();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check token & redirect to homepage if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  // Scroll to last message on new messages and connected
  useEffect(() => {
    if (isConnected) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isConnected]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  // Render loading until socket connected AND userId is present
  if (!isConnected || !userId) {
    return (
      <div className="flex justify-center items-center min-h-screen text-zinc-300 bg-zinc-950/90">
        Connecting to chat server...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-4xl mx-auto p-4 md:p-6">
      <header className="flex justify-between items-center mb-4 bg-zinc-900/60 border border-white/10 rounded-2xl px-4 py-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-zinc-300 hover:text-white text-sm md:text-base"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-white">AI Chat 💬</h1>
        <div className="text-xs md:text-sm">
          {isConnected ? (
            <span className="text-green-400">● Connected</span>
          ) : (
            <span className="text-red-400">● Disconnected</span>
          )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4 shadow-xl">
        {messages.length === 0 && (
          <p className="text-center text-zinc-400">Start the conversation!</p>
        )}
        {messages.map((msg, index) => {
          const isUser = msg.sender === userId;
          return (
            <div
              key={index}
              className={`max-w-xl p-3 rounded-2xl text-sm md:text-base ${
                isUser
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto"
                  : "bg-zinc-800 text-zinc-100 border border-white/5"
              }`}
            >
              {msg.message}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </section>

      <footer className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-full border border-white/15 bg-zinc-900/70 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          type="text"
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!isConnected}
        />
        <button
          disabled={!input.trim() || !isConnected}
          onClick={handleSend}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Send
        </button>
      </footer>
    </main>
  );
}
