'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch, FaPaperPlane, FaPhone, FaVideo, FaInfoCircle, FaSmile, FaGift, FaMicrophone, FaExpand } from 'react-icons/fa';
import { PiCoinsFill } from "react-icons/pi";
import { Phone, User, Send, Mic, Maximize2, ChevronDown, Video } from 'lucide-react';
import dynamic from 'next/dynamic';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';
import { useSocket } from '@/lib/socket';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import RestrictedContentModal from '@/components/RestrictedContentModal';




// Dynamically import emoji picker to avoid SSR issues
const Picker = dynamic(
  () => import('emoji-picker-react').then((mod) => mod.default),
  { ssr: false }
);

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const GIFTS = [
  { id: 1, name: "Star", image: "/gifts-reactions/star.png", price: 3 },
  { id: 2, name: "Happy Star", image: "/gifts-reactions/happy-start.png", price: 5 },
  { id: 3, name: "Sunflower", image: "/gifts-reactions/sunflower.png", price: 7 },
  { id: 4, name: "Joy Ride", image: "/gifts-reactions/joy-ride.png", price: 9 },
  { id: 5, name: "Rainbow", image: "/gifts-reactions/rainbow.png", price: 5 },
  { id: 6, name: "Target", image: "/gifts-reactions/target-locked.png", price: 11 },
  { id: 7, name: "Heart Box", image: "/gifts-reactions/hearts.png", price: 19 },
  { id: 8, name: "Sun", image: "/gifts-reactions/sunny.png", price: 5 },
  { id: 9, name: "Clap", image: "/gifts-reactions/applaud.png", price: 39 },
  { id: 10, name: "Bear Hi", image: "/gifts-reactions/hi.png", price: 79 },
  { id: 11, name: "Hamster", image: "/gifts-reactions/blush.png", price: 49 },
  { id: 12, name: "Bear", image: "/gifts-reactions/love-from-this-side.png", price: 89 },
  { id: 13, name: "Cheers", image: "/gifts-reactions/cheers.png", price: 129 },
  { id: 14, name: "Bunny", image: "/gifts-reactions/bunny.png", price: 229 },
  { id: 15, name: "Fire", image: "/gifts-reactions/fire.png", price: 99 },
  { id: 16, name: "Fireworks", image: "/gifts-reactions/sparkles.png", price: 199 },
  { id: 17, name: "Lips", image: "/gifts-reactions/kiss.png", price: 279 },
  { id: 18, name: "Rose", image: "/gifts-reactions/rose.png", price: 359 },
  { id: 19, name: "Aww", image: "/gifts-reactions/awww.png", price: 99 },
  { id: 20, name: "Laugh", image: "/gifts-reactions/laughing.png", price: 99 },
  { id: 21, name: "In Love", image: "/gifts-reactions/in-love.png", price: 99 },
  { id: 22, name: "Kiss", image: "/gifts-reactions/warm-kiss.png", price: 99 },
  { id: 23, name: "Heart", image: "/gifts-reactions/packed-heart.png", price: 8 },
  { id: 24, name: "Chocolaty", image: "/gifts-reactions/chocolaty.png", price: 59 },
  { id: 25, name: "Double Kisses", image: "/gifts-reactions/double-kisses.png", price: 79 },
  { id: 26, name: "Roses", image: "/gifts-reactions/rosees.png", price: 99 },
  { id: 27, name: "Flower Pot", image: "/gifts-reactions/flower-pot.png", price: 1499 },
];

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  online: boolean;
  profileId?: string;
}

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

export default function MessagesClient() {
  const searchParams = useSearchParams();
  const { messages: socketMessages, sendMessage, isConnected, selectedProfileId, setSelectedProfileId, fetchConversation, userId, isAITyping, socket } = useSocket();

  // Store socket reference
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Restricted Content Modal State
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [restrictedData, setRestrictedData] = useState<{
    profileId: string;
    alias: string;
    name: string;
    price: number;
    avatar?: string;
  } | null>(null);

  // Socket listener for restricted content
  useEffect(() => {
    if (!socket) return;
    
    // Listen for restricted content event
    const handleRestrictedContent = (data: any) => {
      console.log('🚫 Restricted content event received:', data);
      
      // Try to find avatar from conversations
      const conversation = conversations.find(c => c.profileId === data.profileId);
      const avatar = conversation?.avatar;

      setRestrictedData({
        profileId: data.profileId,
        alias: data.alias,
        name: data.name,
        price: data.price,
        avatar: avatar
      });
      setRestrictedModalOpen(true);
    };
    
    socket.on('restricted_content', handleRestrictedContent);
    
    return () => {
      socket.off('restricted_content', handleRestrictedContent);
    };
  }, [socket, conversations]);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sfwEnabled, setSfwEnabled] = useState(true);





  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedUrlParam = useRef(false);
  const pendingSelection = useRef<{ profileId: string; conversationId: number } | null>(null);
  const socketRef = useRef<any>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [chatContainerHeight, setChatContainerHeight] = useState<number | null>(null);



  // Fetch all conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) {
        setIsLoadingConversations(false);
        return;
      }

      setIsLoadingConversations(true);
      try {
        const response = await fetch(`/api/conversations?userId=${userId}`);
        if (!response.ok) {
          console.error('Failed to fetch conversations');
          setIsLoadingConversations(false);
          return;
        }

        const data = await response.json();
        if (data.conversations && Array.isArray(data.conversations)) {
          // Map API response to Conversation interface
          // Use profileId hash as unique ID to prevent duplicates
          const mappedConversations: Conversation[] = data.conversations.map((conv: any) => ({
            id: conv.profileId ? conv.profileId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : Math.random(),
            name: conv.name,
            avatar: conv.avatar,
            lastMessage: conv.lastMessage,
            timestamp: conv.timestamp,
            unread: conv.unread || false,
            online: conv.online !== false,
            profileId: conv.profileId,
          }));

          // Merge with existing conversations instead of replacing
          setConversations(prev => {
            // Keep manually created conversations that aren't in API response
            const apiProfileIds = new Set(mappedConversations.map(c => c.profileId));
            const manualConversations = prev.filter(c => !apiProfileIds.has(c.profileId));

            return [...manualConversations, ...mappedConversations];
          });
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [userId]);

  // Fetch user personas
  useEffect(() => {
    const fetchPersonas = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/personas?userId=${userId}`);
        if (!response.ok) return;

        const data = await response.json();
        setPersonas(data.personas || []);

        // Check localStorage for saved persona selection
        const savedPersonaId = localStorage.getItem(`selectedPersona_${userId}`);

        if (savedPersonaId && data.personas?.some((p: any) => p._id === savedPersonaId)) {
          // Restore saved persona
          setSelectedPersonaId(savedPersonaId);
        } else {
          // Set default persona if exists and no saved selection
          const defaultPersona = data.personas?.find((p: any) => p.makeDefault);
          if (defaultPersona) {
            setSelectedPersonaId(defaultPersona._id);
          }
        }
      } catch (error) {
        console.error('Error fetching personas:', error);
      }
    };

    fetchPersonas();
  }, [userId]);

  // Auto-select conversation when arriving from a profile page
  useEffect(() => {
    const aiProfileId = searchParams.get('ai');
    if (!aiProfileId || hasProcessedUrlParam.current) return;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedAIProfile') : null;
      if (!stored) return;

      const data = JSON.parse(stored) as { profileId?: string; name?: string; avatar?: string; onlineStatus?: string };
      if (!data.profileId || data.profileId !== aiProfileId) return;

      // Mark as processed to prevent re-running
      hasProcessedUrlParam.current = true;

      // Use functional update to access latest conversations without adding to dependencies
      setConversations((prevConversations) => {
        // Check if conversation already exists
        const existing = prevConversations.find((c) => c.profileId === aiProfileId);
        if (existing) {
          // Mark for selection in separate effect
          pendingSelection.current = { profileId: aiProfileId, conversationId: existing.id };
          return prevConversations; // No change needed
        }

        // Create new conversation if it doesn't exist
        const uniqueId = aiProfileId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const newConversation: Conversation = {
          id: uniqueId,
          name: data.name || 'AI Companion',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          lastMessage: 'Say hi 👋',
          timestamp: 'now',
          unread: false,
          online: true,
          profileId: aiProfileId,
        };

        // Mark for selection in separate effect
        pendingSelection.current = { profileId: aiProfileId, conversationId: newConversation.id };

        return [newConversation, ...prevConversations];
      });
    } catch (error) {
      console.error('Failed to load selected AI profile for messages page:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle pending selection after conversation state updates
  useEffect(() => {
    if (pendingSelection.current) {
      const { profileId, conversationId } = pendingSelection.current;
      pendingSelection.current = null; // Clear immediately to prevent re-runs

      setSelectedConversation(conversationId);
      setSelectedProfileId(profileId);
      fetchConversation(profileId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [socketMessages]);

  // VisualViewport: when mobile keyboard opens, constrain chat height so input stays visible
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;

    const handler = () => {
      const diff = window.innerHeight - vv.height;
      setChatContainerHeight(diff > 150 ? vv.height : null); // keyboard open when viewport shrinks >150px
    };
    handler();
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  // Scroll input into view when focused (fixes first-tap keyboard covering input on Android)
  const handleInputFocus = () => {
    setTimeout(() => {
      inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 350);
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    const targetProfileId = selectedConv?.profileId || selectedProfileId;

    if (messageText.trim() && targetProfileId) {
      if (selectedPersonaId) {
        const selectedPersona = personas.find(p => p._id === selectedPersonaId);
        if (socketRef.current) {
          socketRef.current.emit("send_message", {
            message: messageText,
            profileId: targetProfileId,
            personaId: selectedPersonaId,
            personaContext: selectedPersona?.background || ''
          });
        } else {
          console.error('❌ Socket not available, falling back to sendMessage');
          sendMessage(messageText, targetProfileId);
        }
      } else {
        sendMessage(messageText, targetProfileId);
      }
      setMessageText('');
      setShowEmojiPicker(false);
    } else {
      console.warn('⚠️ Send condition not met:', {
        hasText: !!messageText.trim(),
        hasProfileId: !!targetProfileId
      });
    }
  };

  const handleSendGift = (gift: any) => {
    const targetProfileId = selectedConv?.profileId || selectedProfileId;

    if (targetProfileId) {
      // For fallback/logging
      const giftMessage = `🎁 Sent ${gift.name} (${gift.price} coins)`;

      const giftData = {
        message: giftMessage,
        profileId: targetProfileId,
        personaId: selectedPersonaId,
        isGift: true,
        giftId: gift.id,
        giftImage: gift.image,
        giftPrice: gift.price,
        personaContext: selectedPersonaId ? personas.find(p => p._id === selectedPersonaId)?.background || '' : ''
      };

      if (socketRef.current) {
        socketRef.current.emit("send_message", giftData);
      } else {
        // Fallback to basic sendMessage if socket emit fails
        sendMessage(giftMessage, targetProfileId);
      }
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessageText(prev => prev + emojiObject.emoji);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Left Sidebar - Conversations List */}
      <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-zinc-200 dark:border-white/10 flex flex-col bg-zinc-100/50 dark:bg-zinc-900/20 ${selectedConversation && 'hidden md:flex'
        }`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Messages</h1>
            <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="relative w-20 h-20 mb-6">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                {/* Inner spinning ring */}
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                {/* Pulsing center */}
                <div className="absolute inset-3 bg-purple-500/20 rounded-full animate-pulse"></div>
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-900 dark:text-white font-semibold text-lg">Loading Conversations</p>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Finding your connections...</p>
              </div>
              {/* Animated dots */}
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-zinc-900 dark:text-white font-semibold text-lg mb-2">No Conversations Yet</p>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm text-center">Start chatting with AI companions from their profiles</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv.id);
                  if (conv.profileId) {
                    setIsLoadingMessages(true);
                    setSelectedProfileId(conv.profileId);
                    fetchConversation(conv.profileId);
                    // Simulate loading delay for smooth transition
                    setTimeout(() => setIsLoadingMessages(false), 800);
                  }
                }}
                className={`w-full p-2 flex items-center gap-3 hover:bg-zinc-200 dark:hover:bg-white/5 transition-all duration-300 border border-zinc-200 dark:border-white/5 rounded-[14px] shadow-lg ${selectedConversation === conv.id ? 'bg-white dark:bg-[#1e1e24]' : ''
                  }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-14 h-14 rounded-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{conv.name}</h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 shrink-0">{conv.timestamp}</span>
                  </div>
                  <p className={`text-sm truncate ${conv.unread ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread Indicator */}
                {conv.unread && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 animate-pulse" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      {selectedConv ? (
        <div
          className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/10 min-h-0"
          style={chatContainerHeight ? { height: chatContainerHeight, minHeight: 0 } : undefined}
        >
          {/* Chat Header - safe-area for iOS notch; no top margin on mobile */}
          <div className="sticky top-0 z-20 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 pb-3 bg-white dark:bg-[#1e1e24] border-b border-zinc-200 dark:border-white/5 flex items-center justify-between md:mx-2 md:mt-2 md:mb-0 md:rounded-[24px] md:border md:shadow-lg md:pt-3">
            <div className="flex items-center gap-3">
              {/* Back Button for Mobile */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mr-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedConv.avatar}
                    alt={selectedConv.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedConv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-white">{selectedConv.name}</h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Active now</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Voice Call Button (Yellow Circle) */}
              <button
                onClick={() => setShowVoiceCall(true)}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Start Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <FaVideo className="w-5 h-5" />
              </button>
              <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <FaInfoCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area - min-h-0 allows flex shrink when keyboard opens; pb-24 so last message clears input bar */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pb-24 space-y-4 overscroll-contain touch-scroll">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-24 h-24 mb-6">
                  {/* Animated gradient ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-20 animate-spin" style={{ animationDuration: '3s' }}></div>
                  {/* Main spinner */}
                  <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
                  {/* Inner glow */}
                  <div className="absolute inset-4 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full animate-pulse"></div>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-zinc-900 dark:text-white font-semibold text-lg">Loading Messages</p>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">Preparing your conversation...</p>
                </div>
                {/* Shimmer effect */}
                <div className="flex gap-2 mt-6">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            ) : (
              <>
                {socketMessages.map((message, index) => {
                  const isOwn = message.sender === userId;

                  // Robust gift detection (even if flag is missing)
                  let displayGift = message.isGift ? { image: message.giftImage, price: message.giftPrice } : null;
                  if (!displayGift && message.message.startsWith('🎁 Sent ')) {
                    const match = message.message.match(/🎁 Sent (.+) \((\d+) coins\)/);
                    if (match) {
                      const giftName = match[1];
                      const foundGift = GIFTS.find(g => g.name === giftName);
                      if (foundGift) {
                        displayGift = { image: foundGift.image, price: foundGift.price };
                      }
                    }
                  }

                  return (
                    <div
                      key={message._id || index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {!isOwn && (
                        <img
                          src={selectedConv.avatar}
                          alt={selectedConv.name}
                          className="w-8 h-8 rounded-full object-cover mr-2 shrink-0"
                        />
                      )}

                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {displayGift ? (
                          <div className="relative group p-2">
                            <img
                              src={displayGift.image}
                              alt={message.message}
                              className="w-32 h-32 object-contain animate-bounce-subtle hover:scale-110 transition-all duration-300 drop-shadow-xl cursor-default"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white dark:border-zinc-800 scale-90 group-hover:scale-100 transition-all">
                              <PiCoinsFill className="w-2.5 h-2.5" />
                              {displayGift.price}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-4 py-2 transition-all duration-300 ${isOwn
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                              : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-900 dark:text-white'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words font-medium tracking-tight">{message.message}</p>
                          </div>
                        )}

                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 px-1">
                          {(() => {
                            const timestamp = message.createdAt;
                            return timestamp
                              ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : 'now';
                          })()}
                        </span>
                      </div>

                      {isOwn && (
                        <div className="w-8 ml-2" />
                      )}
                    </div>
                  );
                })}

                {/* Premium Typing Indicator */}
                {isAITyping && (
                  <div className="flex justify-start animate-fadeIn">
                    {/* Avatar with glow effect */}
                    <div className="relative shrink-0 mr-3">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md animate-pulse"></div>
                      <img
                        src={selectedConv.avatar}
                        alt={selectedConv.name}
                        className="relative w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/30"
                      />
                    </div>

                    {/* Glassmorphism bubble with gradient */}
                    <div className="relative group">
                      {/* Gradient background animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl blur-sm animate-pulse"></div>

                      {/* Main bubble */}
                      <div className="relative rounded-2xl px-4 py-2 transition-all duration-300 bg-zinc-200 dark:bg-zinc-800/50 text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          {/* Animated dots with gradient */}
                          <div className="flex items-center gap-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce shadow-lg shadow-purple-500/50"
                              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
                            ></div>
                            <div
                              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 animate-bounce shadow-lg shadow-pink-500/50"
                              style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
                            ></div>
                            <div
                              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce shadow-lg shadow-purple-500/50"
                              style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
                            ></div>
                          </div>

                          {/* Typing text with fade animation */}
                          <span className="ml-2 text-xs text-zinc-400 font-medium animate-pulse">
                            typing...
                          </span>
                        </div>
                      </div>

                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input Container - solid bg so messages don't show through gifts */}
          <div
            ref={inputContainerRef}
            className="sticky bottom-0 z-10 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] w-full max-w-4xl mx-auto shrink-0 bg-zinc-50 dark:bg-[#0a0a0a]"
          >
            {/* Quick Reactions / Gifts above input - solid background */}
            <div className="flex items-center gap-2 mb-2 px-2 bg-zinc-50 dark:bg-[#0a0a0a] pt-1">
              {GIFTS.slice(0, 5).map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="flex flex-col items-center bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all hover:scale-105"
                >
                  <img src={gift.image} alt={gift.name} className="w-8 h-8 object-contain" />
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold mt-0.5 flex items-center gap-0.5">
                    <PiCoinsFill className="w-2.5 h-2.5" /> {gift.price}
                  </span>
                </button>
              ))}

              {/* Gift Icon Button with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-white rounded-full shadow-lg hover:bg-zinc-200 dark:hover:bg-zinc-100 transition-colors">
                    <FaGift className="w-5 h-5 text-zinc-900" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-[320px] p-0 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {/* Gift Popup Header */}
                  <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full">
                      <PiCoinsFill className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">0</span>
                      <button className="ml-1 w-5 h-5 flex items-center justify-center bg-zinc-900 dark:bg-white rounded-full">
                        <span className="text-white dark:text-zinc-900 font-bold text-lg leading-none">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Gift Selection Grid */}
                  <div className="h-[400px] overflow-y-auto p-4 custom-scrollbar">
                    <h4 className="text-zinc-500 text-sm font-medium mb-4">Classic</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {GIFTS.map((gift) => (
                        <button
                          key={gift.id}
                          onClick={() => handleSendGift(gift)}
                          className="flex flex-col items-center gap-1 group relative active:scale-95 transition-transform"
                        >
                          <div className="relative">
                            <img src={gift.image} alt={gift.name} className="w-12 h-12 object-contain transition-transform group-hover:scale-110" />
                            {gift.name.includes("Snowflake") || gift.name.includes("Double Kisses") || gift.name.includes("Bouquet") ? (
                              <span className="absolute -top-1 -left-1 bg-pink-500 text-[8px] font-bold px-1 rounded text-white italic">AR</span>
                            ) : null}
                          </div>
                          <span className="text-xs text-yellow-600 dark:text-yellow-500 font-bold flex items-center gap-0.5">
                            <PiCoinsFill className="w-3 h-3" /> {gift.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Main Input Area */}
            <div className="bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-white/5 rounded-[24px] p-2 flex flex-col gap-2 shadow-2xl">

              {/* Input Row */}
              <div className="flex items-center gap-2 pl-2">
                {/* Text Field */}
                <input
                  ref={messageInputRef}
                  type="text"
                  inputMode="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1 bg-transparent border-none focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 text-base py-2 min-w-0"
                />

                {/* Right Icons */}
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all group disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-purple-600 dark:text-purple-500 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between px-2 pb-1 border-t border-zinc-100 dark:border-white/5 pt-2">
                <div className="flex items-center gap-3">

                  {/* Persona Selector Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                      className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#2a2a35] hover:bg-zinc-200 dark:hover:bg-[#323240] rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center p-1 shadow-sm overflow-hidden">
                        {(() => {
                          const persona = selectedPersonaId ? personas.find(p => p._id === selectedPersonaId) : null;
                          if (persona?.avatar) return <img src={persona.avatar} alt="" className="w-full h-full object-cover rounded-full" />;
                          return <User className="w-full h-full text-white" />;
                        })()}
                      </div>
                      <span className="truncate max-w-[80px]">
                        {selectedPersonaId ? personas.find(p => p._id === selectedPersonaId)?.displayName : 'Persona'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${showPersonaSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showPersonaSelector && (
                      <div className="absolute left-0 bottom-full mb-3 w-[260px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Backdrop for closing */}
                        <div className="fixed inset-0 z-[-1]" onClick={() => setShowPersonaSelector(false)} />

                        <div className="bg-white dark:bg-[#1a1a1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Select Persona</h3>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {/* Default Option */}
                            <button
                              onClick={() => {
                                setSelectedPersonaId(null);
                                setShowPersonaSelector(false);
                                localStorage.removeItem(`selectedPersona_${userId}`);
                              }}
                              className={`w-full p-3 flex items-center gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800/50 ${!selectedPersonaId ? 'bg-purple-50/50 dark:bg-purple-500/10' : ''}`}
                            >
                              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-zinc-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Default Mode</p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Chat as yourself</p>
                              </div>
                            </button>

                            {/* Personas */}
                            {personas.map((persona) => (
                              <button
                                key={persona._id}
                                onClick={() => {
                                  setSelectedPersonaId(persona._id);
                                  setShowPersonaSelector(false);
                                  localStorage.setItem(`selectedPersona_${userId}`, persona._id);
                                }}
                                className={`w-full p-3 flex items-center gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${selectedPersonaId === persona._id ? 'bg-purple-50/50 dark:bg-purple-500/10' : ''}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                  {persona.avatar ? (
                                    <img src={persona.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white font-bold text-sm">{persona.displayName.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{persona.displayName}</p>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{persona.background || 'Persona profile'}</p>
                                </div>
                              </button>
                            ))}

                            {personas.length === 0 && (
                              <div className="p-8 text-center">
                                <p className="text-xs text-zinc-500">No personas found</p>
                                <p className="text-[10px] text-zinc-400 mt-1">Create one in your profile settings</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Emoji Picker Button (Old logic kept) */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-white transition-colors relative"
                  >
                    <FaSmile className="w-4 h-4" />
                    {showEmojiPicker && (
                      <div className="absolute bottom-10 left-0 z-50">
                        {/* Backdrop to close on outside click */}
                        <div className="fixed inset-0 z-[-1]" onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(false);
                        }} />
                        <Picker
                          onEmojiClick={handleEmojiClick}
                          theme={'dark' as any}
                          width={300}
                          height={400}
                        />
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-white transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-900/10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-600/20 flex items-center justify-center">
              <FaPaperPlane className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Your Messages</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {/* Voice Call Modal */}
      <Dialog open={showVoiceCall} onOpenChange={setShowVoiceCall}>
        <DialogContent className="max-w-md p-0 bg-transparent border-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Voice Call with {selectedConv?.name}</DialogTitle>
          {selectedConv?.profileId && (
            <VoiceCallPanel
              profile={{
                profileId: selectedConv.profileId,
                name: selectedConv.name,
                avatar: selectedConv.avatar,
                cardTitle: 'AI Girlfriend',
                category: 'Different Personalities',
              } as any}
            />
          )}
        </DialogContent>

      </Dialog>
      
      {/* Restricted Content Modal */}
      <RestrictedContentModal 
        isOpen={restrictedModalOpen}
        onClose={() => setRestrictedModalOpen(false)}
        profileId={restrictedData?.profileId || ''}
        characterName={restrictedData?.name || 'Character'} // Default name if null
        price={restrictedData?.price || 4.99} // Default price if null
        avatar={restrictedData?.avatar}
      />
    </div>
  );
}
