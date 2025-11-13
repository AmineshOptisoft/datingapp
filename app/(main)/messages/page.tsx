"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/lib/socket";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    // Get current user from cookie/session
    // For now using placeholder - you should get this from auth context
    const userId = "user_id_from_auth"; // Replace with actual user ID
    setCurrentUserId(userId);

    // Join socket room
    if (socket && userId) {
      socket.emit("user:join", userId);
    }

    // Fetch conversations
    fetchConversations();
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on("message:receive", (message: Message) => {
      if (
        message.sender === selectedUser ||
        message.receiver === selectedUser
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();

        // Mark as read if chat is open
        if (message.sender === selectedUser) {
          socket.emit("message:read", {
            userId: currentUserId,
            otherUserId: selectedUser,
          });
        }
      }

      // Update conversations
      fetchConversations();
    });

    // Message sent confirmation
    socket.on("message:sent", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Typing indicators
    socket.on("typing:show", ({ userId }) => {
      if (userId === selectedUser) {
        setTyping(true);
      }
    });

    socket.on("typing:hide", ({ userId }) => {
      if (userId === selectedUser) {
        setTyping(false);
      }
    });

    return () => {
      socket.off("message:receive");
      socket.off("message:sent");
      socket.off("typing:show");
      socket.off("typing:hide");
    };
  }, [socket, selectedUser, currentUserId]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        scrollToBottom();

        // Mark messages as read
        if (socket) {
          socket.emit("message:read", {
            userId: currentUserId,
            otherUserId: userId,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const selectConversation = (userId: string) => {
    setSelectedUser(userId);
    fetchMessages(userId);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit("message:send", {
      senderId: currentUserId,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleTyping = () => {
    if (!socket || !selectedUser) return;

    socket.emit("typing:start", {
      userId: currentUserId,
      receiverId: selectedUser,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (!socket || !selectedUser) return;

    socket.emit("typing:stop", {
      userId: currentUserId,
      receiverId: selectedUser,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUser
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isConnected ? (
              <span className="text-green-600">● Online</span>
            ) : (
              <span className="text-red-600">● Offline</span>
            )}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {conversations.map((conv) => (
            <div
              key={conv.userId}
              onClick={() => selectConversation(conv.userId)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                selectedUser === conv.userId ? "bg-purple-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {conv.user.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {selectedConversation?.user.name}
              </h3>
              {typing && <p className="text-sm text-gray-500">typing...</p>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.createdAt + msg.message}
                  className={`flex ${
                    msg.sender === "ai" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender === "ai"
                        ? "bg-blue-100 text-gray-900"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">
                Select a conversation
              </p>
              <p className="text-sm">Choose someone to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
