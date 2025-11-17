"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";

export default function MessagesPage() {
  const router = useRouter();
  const { messages, sendMessage, isConnected, userId } = useSocket();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check token & redirect to login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
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
      <div className="flex justify-center items-center min-h-screen text-purple-700">
        Connecting to chat server...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <header className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-purple-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-purple-700">AI Chat 💬</h1>
        <div className="text-sm">
          {isConnected ? (
            <span className="text-green-600">● Connected</span>
          ) : (
            <span className="text-red-600">● Disconnected</span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-white shadow rounded-lg p-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500">Start the conversation!</p>
        )}
        {messages.map((msg, index) => {
          const isUser = msg.sender === userId;
          return (
            <div
              key={index}
              className={`max-w-xl p-3 rounded-xl ${
                isUser
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {msg.message}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
