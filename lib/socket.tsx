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
import { useAuth } from "@/app/contexts/AuthContext";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  message: string;
  createdAt?: Date | string;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  sendMessage: (msg: string, profileId?: string) => void;
  userId: string;
  isConnected: boolean;
  selectedProfileId: string;
  setSelectedProfileId: (profileId: string) => void;
  fetchConversation: (profileId: string) => void;
  disconnectSocket: () => void;
  setUserId: (id: string) => void;
  isAITyping: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [userId, setUserId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const { user } = useAuth();

  // Keep socket userId in sync with authenticated user
  useEffect(() => {
    if (user) {
      setUserId((user as any).id || (user as any)._id || "");
    } else {
      setUserId("");
    }
  }, [user]);

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

    const socket = io("http://localhost:3000", { auth: { userId } });

    socket.on("connect", () => {
      setIsConnected(true);
      if (selectedProfileId) {
        socket.emit("get_conversation", selectedProfileId);
      }
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("conversation", (msgs: Message[]) => {
      setMessages(msgs);
    });

    // Listen for AI typing events
    socket.on("ai_typing_start", () => {
      setIsAITyping(true);
    });

    socket.on("ai_typing_stop", () => {
      setIsAITyping(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      setIsConnected(false);
      setMessages([]);
      setIsAITyping(false);
    };
  }, [userId]);

  const sendMessage = (msg: string, profileId?: string) => {
    if (!socketRef.current) return;
    const targetProfileId = profileId || selectedProfileId;
    socketRef.current.emit("send_message", { message: msg, profileId: targetProfileId });
  };

  const fetchConversation = (profileId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("get_conversation", profileId);
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
        selectedProfileId,
        setSelectedProfileId,
        fetchConversation,
        disconnectSocket,
        setUserId,
        isAITyping,
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
