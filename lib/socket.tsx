"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  message: string;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  sendMessage: (msg: string) => void;
  userId: string;
  isConnected: boolean;
  fetchConversation: () => void;
  disconnectSocket: () => void;
  setUserId: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Initialize user from localStorage if available
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id || user._id || "");
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setMessages([]);
      }
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
    }

    const socket = io("http://localhost:4000", { auth: { userId } });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("get_conversation", "ai_bot");
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("conversation", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      setIsConnected(false);
      setMessages([]);
    };
  }, [userId]);

  const sendMessage = (msg: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("send_message", { message: msg });
  };

  const fetchConversation = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("get_conversation", "ai_bot");
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
      setUserId("");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        messages,
        sendMessage,
        userId,
        isConnected,
        fetchConversation,
        disconnectSocket,
        setUserId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
}
