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
  isGift?: boolean;
  giftId?: number;
  giftImage?: string;
  giftPrice?: number;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  sendMessage: (msg: string, profileId?: string, isGift?: boolean, giftId?: number, giftPrice?: number, personaId?: string, personaContext?: string) => void;
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
  const [selectedProfileId, _setSelectedProfileId] = useState("");
  const selectedProfileIdRef = useRef("");

  const setSelectedProfileId = (profileId: string) => {
    selectedProfileIdRef.current = profileId;
    _setSelectedProfileId(profileId);
  };
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

    const socket = io(process.env.NEXT_PUBLIC_APP_URL, { auth: { userId } });

    socket.on("connect", () => {
      console.log('🟢 Socket connected, socket id:', socket.id);
      setIsConnected(true);
      // Wait a tick to allow components to register their selectedProfileId if needed
      setTimeout(() => {
        if (selectedProfileIdRef.current) {
          console.log('📡 Auto-fetching conversation for:', selectedProfileIdRef.current);
          socket.emit("get_conversation", selectedProfileIdRef.current);
        }
      }, 100);
    });

    socket.on("disconnect", () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
    });

    socket.on("receive_message", (msg: Message) => {
      console.log('📩 receive_message:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("conversation", (msgs: Message[]) => {
      console.log('📜 conversation loaded:', msgs.length, 'messages');
      setMessages(msgs);
    });

    // Listen for AI typing events
    socket.on("ai_typing_start", () => {
      setIsAITyping(true);
    });

    socket.on("ai_typing_stop", () => {
      setIsAITyping(false);
    });

    // Listen for rate limit errors
    socket.on("rate_limit_exceeded", (data: { message: string; retryAfter?: number }) => {
      console.warn("⚠️ Rate limit exceeded:", data.message);
      // Show error notification to user
      if (typeof window !== 'undefined') {
        alert(data.message); // Simple alert for now, can be replaced with toast notification
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      setIsConnected(false);
      setMessages([]);
      setIsAITyping(false);
    };
  }, [userId]);

  const sendMessage = (msg: string, profileId?: string, isGift?: boolean, giftId?: number, giftPrice?: number, personaId?: string, personaContext?: string) => {
    if (!socketRef.current) return;
    const targetProfileId = profileId || selectedProfileId;
    socketRef.current.emit("send_message", { 
      message: msg, 
      profileId: targetProfileId,
      isGift,
      giftId,
      giftPrice,
      personaId,
      personaContext
    });
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
