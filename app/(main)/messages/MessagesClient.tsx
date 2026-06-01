'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaSearch, FaPaperPlane, FaPhone, FaVideo, FaInfoCircle, FaSmile, FaGift, FaMicrophone, FaExpand } from 'react-icons/fa';
import { PiCoinsFill } from "react-icons/pi";
import { Phone, User, Send, Mic, Maximize2, ChevronDown, Video, Globe, MoreVertical, MessageSquare, Heart, Shield, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';
import ReportModal from '@/components/ReportModal';
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

import { GIFTS } from '@/lib/constants/gifts';

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { id: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { id: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { id: 'te', name: 'Telugu', flag: '🇮🇳' },
  { id: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { id: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { id: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { id: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { id: 'pa', name: 'Punjabi', flag: '🇮🇳' },
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
  characterVideo?: string;
  characterThumbnail?: string;
  age?: number | null;
  likes?: number;
  interactions?: number;
  personalityType?: string;
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Restricted Content Modal State
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [restrictedData, setRestrictedData] = useState<{
    profileId: string;
    alias: string;
    name: string;
    price: number;
    avatar?: string;
  } | null>(null);

  // Socket listener for restricted content and wallet updates
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

    const handleWalletUpdated = (data: any) => {
      if (typeof data.balance === 'number') {
        setWalletBalance(data.balance);
        window.dispatchEvent(new CustomEvent('wallet_updated', { detail: { balance: data.balance } }));
      }
    };

    const handleGiftError = (data: any) => {
      alert(data.message || "Failed to send gift.");
    };
    
    socket.on('restricted_content', handleRestrictedContent);
    socket.on('wallet_updated', handleWalletUpdated);
    socket.on('gift_error', handleGiftError);
    
    return () => {
      socket.off('restricted_content', handleRestrictedContent);
      socket.off('wallet_updated', handleWalletUpdated);
      socket.off('gift_error', handleGiftError);
    };
  }, [socket, conversations]);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.balance);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, []);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sfwEnabled, setSfwEnabled] = useState(true);

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/user/language', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.language) setSelectedLanguage(data.language);
        }
      } catch (err) {
        console.error('Failed to fetch user language', err);
      }
    };
    fetchLanguage();
  }, []);

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
            characterVideo: conv.characterVideo,
            characterThumbnail: conv.characterThumbnail,
            age: conv.age,
            likes: conv.likes,
            interactions: conv.interactions,
            personalityType: conv.personalityType,
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

        // Only user-created characters have background videos
        if (aiProfileId.startsWith('character-')) {
          if ((data as any).characterVideo) {
            newConversation.characterVideo = (data as any).characterVideo;
          }
          
          // Also explicitly fetch the video right away to ensure we have the latest
          const charId = aiProfileId.replace('character-', '');
          fetch(`/api/characters/${charId}`)
            .then(res => res.json())
            .then(charData => {
              if (charData.success && charData.character && charData.character.characterVideo) {
                setConversations(prev => prev.map(c => 
                  c.profileId === aiProfileId ? { ...c, characterVideo: charData.character.characterVideo } : c
                ));
              }
            })
            .catch(console.error);
        }

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

    console.log('🔍 handleSendMessage debug:', {
      targetProfileId,
      selectedConvProfileId: selectedConv?.profileId,
      selectedProfileId,
      hasSocket: !!socketRef.current,
      isConnected,
      messageText: messageText.trim().substring(0, 20),
    });

    if (messageText.trim() && targetProfileId) {
      const selectedPersona = selectedPersonaId ? personas.find(p => p._id === selectedPersonaId) : null;
      console.log('📤 Sending message to:', targetProfileId);
      sendMessage(
        messageText, 
        targetProfileId, 
        false, 
        undefined, 
        undefined, 
        selectedPersonaId || undefined, 
        selectedPersona?.background || ''
      );
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
    if (walletBalance !== null && walletBalance < gift.price) {
      alert("Insufficient coins to send this gift. Please purchase more coins.");
      return;
    }

    // Optimistic UI update for immediate feedback
    if (walletBalance !== null) {
      const newBalance = walletBalance - gift.price;
      setWalletBalance(newBalance);
      window.dispatchEvent(new CustomEvent('wallet_updated', { detail: { balance: newBalance } }));
    }

    const targetProfileId = selectedConv?.profileId || selectedProfileId;

    if (targetProfileId) {
      // For fallback/logging
      const giftMessage = `🎁 Sent ${gift.name} (${gift.price} coins)`;

      const personaBackground = selectedPersonaId ? personas.find(p => p._id === selectedPersonaId)?.background || '' : '';
      sendMessage(
        giftMessage, 
        targetProfileId, 
        true, 
        gift.id, 
        gift.price, 
        selectedPersonaId || undefined, 
        personaBackground
      );
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
      {/* ═══ LEFT PANEL – Conversation List ═══ */}
      <div className={`w-full md:w-[300px] lg:w-[320px] xl:w-[340px] flex-shrink-0 border-r border-zinc-200 dark:border-white/5 flex flex-col bg-white dark:bg-[#111115] ${selectedConversation && 'hidden md:flex'}`}>
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Messages</h1>
              {conversations.length > 0 && (
                <span className="min-w-[22px] h-[22px] flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold rounded-full px-1.5">{conversations.length}</span>
              )}
            </div>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-white/5 border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/10 transition-all"
            />
          </div>
        </div>
        <div className="h-px bg-zinc-100 dark:bg-white/5" />

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoadingConversations ? (
            <div className="px-3 space-y-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-white/10 rounded w-24" />
                    <div className="h-3 bg-zinc-100 dark:bg-white/5 rounded w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="text-zinc-900 dark:text-white font-semibold mb-1">No conversations</p>
              <p className="text-zinc-500 text-sm text-center">Start chatting from a profile page</p>
            </div>
          ) : (
            <div className="px-2 space-y-0.5">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    if (conv.profileId) {
                      setIsLoadingMessages(true);
                      setSelectedProfileId(conv.profileId);
                      fetchConversation(conv.profileId);
                      setTimeout(() => setIsLoadingMessages(false), 800);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 relative ${
                    selectedConversation === conv.id
                      ? 'bg-zinc-100 dark:bg-white/[0.08]'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  {selectedConversation === conv.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-white rounded-r-full" />
                  )}
                  <div className="relative shrink-0">
                    <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10" />
                    {conv.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-white dark:border-[#111115]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white truncate">{conv.name}</h3>
                      <span className="text-[11px] text-zinc-400 shrink-0 ml-2 font-medium">{conv.timestamp}</span>
                    </div>
                    <p className={`text-[13px] truncate ${conv.unread ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-500'}`}>{conv.lastMessage}</p>
                  </div>
                  {conv.unread && <div className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MIDDLE PANEL – Chat Area ═══ */}
      {selectedConv ? (
        <div
          className="flex flex-1 flex-col min-h-0 relative bg-zinc-50 dark:bg-[#0c0c0f]"
          style={chatContainerHeight ? { height: chatContainerHeight, minHeight: 0 } : undefined}
        >
          {/* Background Video */}
          {selectedConv.characterVideo && (
            <video
              src={selectedConv.characterVideo}
              poster={selectedConv.characterThumbnail}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-30 dark:opacity-20 pointer-events-none"
            />
          )}

          {/* Chat Header */}
          <div className="sticky top-0 z-20 shrink-0 px-4 py-3 bg-white/90 dark:bg-[#111115]/90 backdrop-blur-xl border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative">
                <img src={selectedConv.avatar} alt={selectedConv.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10" />
                {selectedConv.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111115]" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-[15px] text-zinc-900 dark:text-white leading-tight">{selectedConv.name}</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active now</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowVoiceCall(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors" title="Voice Call">
                <Phone className="w-[18px] h-[18px] text-zinc-600 dark:text-zinc-400" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                <FaVideo className="w-[18px] h-[18px] text-zinc-600 dark:text-zinc-400" />
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors lg:hidden">
                    <MoreVertical className="w-[18px] h-[18px] text-zinc-600 dark:text-zinc-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" align="end">
                  <button onClick={() => setIsReportModalOpen(true)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors font-medium">Report User</button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportedId={selectedConv.profileId || selectedProfileId || ''} />

          {/* Messages Area - min-h-0 allows flex shrink when keyboard opens */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pb-4 space-y-4 overscroll-contain touch-scroll relative z-10">
            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-zinc-200 dark:border-white/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-zinc-900 dark:border-t-white rounded-full animate-spin"></div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Loading messages...</p>
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
                            className={`rounded-2xl px-4 py-2.5 transition-all duration-300 ${isOwn
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                              : 'bg-white dark:bg-white/[0.08] text-zinc-900 dark:text-white border border-zinc-100 dark:border-white/5'
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
                    {/* Avatar */}
                    <div className="relative shrink-0 mr-3">
                      <img
                        src={selectedConv.avatar}
                        alt={selectedConv.name}
                        className="relative w-8 h-8 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-white/10"
                      />
                    </div>

                    {/* Clean typing bubble */}
                    <div className="relative group">
                      <div className="rounded-2xl px-4 py-3 bg-white dark:bg-white/[0.08] border border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
                          <span className="ml-2 text-xs text-zinc-400 font-medium animate-pulse">typing...</span>
                        </div>
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
            className="sticky bottom-0 z-10 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-t-2xl w-full max-w-4xl mx-auto shrink-0 bg-zinc-50/95 dark:bg-[#0c0c0f]/95 backdrop-blur-xl"
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
                  {/* <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800"> */}
                    {/* <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full"> */}
                      {/* <PiCoinsFill className="w-4 h-4 text-yellow-500" /> */}
                      {/* <span className="text-sm font-bold text-zinc-900 dark:text-white">{walletBalance !== null ? walletBalance : '...'}</span> */}
                      {/* <Link href="/wallet" className="ml-1 w-5 h-5 flex items-center justify-center bg-zinc-900 dark:bg-white rounded-full"> */}
                        {/* <span className="text-white dark:text-zinc-900 font-bold text-lg leading-none">+</span> */}
                      {/* </Link> */}
                    {/* </div> */}
                  {/* </div> */}

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
            <div className="bg-white dark:bg-[#111115] border border-zinc-200 dark:border-white/5 rounded-[20px] p-2 flex flex-col gap-2 shadow-lg">

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
                  className="w-10 h-10 flex items-center justify-center bg-zinc-900 dark:bg-white rounded-xl hover:opacity-80 transition-all group disabled:opacity-30"
                >
                  <Send className="w-4 h-4 text-white dark:text-zinc-900 group-hover:scale-110 transition-transform" />
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
                      <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center p-1 shadow-sm overflow-hidden">
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
                              className={`w-full p-3 flex items-center gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800/50 ${!selectedPersonaId ? 'bg-zinc-100/70 dark:bg-white/5' : ''}`}
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
                                className={`w-full p-3 flex items-center gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${selectedPersonaId === persona._id ? 'bg-zinc-100/70 dark:bg-white/5' : ''}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
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

                  {/* Language Selector Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#2a2a35] hover:bg-zinc-200 dark:hover:bg-[#323240] rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
                    >
                      <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      <span className="truncate max-w-[80px]">
                        {selectedLanguage}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${showLanguageSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showLanguageSelector && (
                      <div className="absolute left-0 bottom-full mb-3 w-[200px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Backdrop for closing */}
                        <div className="fixed inset-0 z-[-1]" onClick={() => setShowLanguageSelector(false)} />

                        <div className="bg-white dark:bg-[#1a1a1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Select Language</h3>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.id}
                                onClick={async () => {
                                  setSelectedLanguage(lang.name);
                                  setShowLanguageSelector(false);
                                  try {
                                    const token = localStorage.getItem('token');
                                    if (token) {
                                      await fetch('/api/user/language', {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ language: lang.name })
                                      });
                                    }
                                  } catch (err) {
                                    console.error('Failed to save language', err);
                                  }
                                }}
                                className={`w-full p-3 flex items-center gap-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${selectedLanguage === lang.name ? 'bg-zinc-100/70 dark:bg-white/5' : ''}`}
                              >
                                <span className="text-xl leading-none">{lang.flag}</span>
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{lang.name}</span>
                              </button>
                            ))}
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
        <div className="hidden md:flex flex-1 items-center justify-center bg-white dark:bg-[#0c0c0f]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-9 h-9 text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Your Messages</h2>
            <p className="text-zinc-500 text-sm">Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {/* ═══ RIGHT PANEL – Profile Sidebar ═══ */}
      {selectedConv && (
        <div className="hidden lg:flex w-[300px] xl:w-[320px] flex-shrink-0 flex-col border-l border-zinc-200 dark:border-white/5 bg-white dark:bg-[#111115] overflow-y-auto">
          {(() => {
            const seed = selectedConv.name.length + (selectedConv.name.charCodeAt(0) || 0);
            const fallbackLikes = (seed * 37 + 50) % 900 + 20;
            const fallbackInteractions = ((seed * 73 + 100) % 4500 + 50) * 100;
            const fallbackAge = (seed % 15) + 18;
            
            const finalLikes = selectedConv.likes !== undefined ? selectedConv.likes : fallbackLikes;
            const finalInteractions = selectedConv.interactions !== undefined ? selectedConv.interactions : fallbackInteractions;
            const finalAge = selectedConv.age !== undefined && selectedConv.age !== null ? selectedConv.age : fallbackAge;
            
            const formatStat = (num: number) => {
              if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
              if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
              return num.toString();
            };

            return (
              <>
                {/* Profile Card */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 relative">
                  {/* Large Avatar */}
                  <div className="relative mb-3">
                    <div className="w-28 h-28 rounded-full ring-[4px] ring-white dark:ring-[#111115] overflow-hidden shadow-lg border border-zinc-100 dark:border-white/5">
                      <img src={selectedConv.avatar} alt={selectedConv.name} className="w-full h-full object-cover" />
                    </div>
                    {selectedConv.online && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-[#111115]" />
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-0.5">{selectedConv.name}</h3>

                  {/* Age & Personality */}
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 text-center">
                    {finalAge} years old {selectedConv.personalityType ? `• ${selectedConv.personalityType}` : ''}
                  </p>

                  {/* Active Now Badge */}
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Now</span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-center gap-6 mb-6 w-full bg-zinc-50 dark:bg-white/5 py-3 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-semibold">
                        <svg className="w-4 h-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{formatStat(finalLikes)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Likes</span>
                    </div>
                    
                    <div className="w-px h-8 bg-zinc-200 dark:bg-white/10" />
                    
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-semibold">
                        <MessageSquare className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                        <span>{formatStat(finalInteractions)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Chats</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={() => setShowVoiceCall(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-white/[0.12] transition-all active:scale-[0.98] border border-zinc-200 dark:border-white/5">
                      <FaVideo className="w-4 h-4" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-zinc-100 dark:bg-white/5 mx-6" />

                {/* Profile Info */}
                <div className="px-6 py-5 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">About</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-zinc-900 dark:text-white font-medium">AI Companion</p>
                      <p className="text-zinc-500 text-xs">Always here for you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-zinc-900 dark:text-white font-medium">Private & Secure</p>
                      <p className="text-zinc-500 text-xs">End-to-end encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-zinc-900 dark:text-white font-medium">24/7 Available</p>
                      <p className="text-zinc-500 text-xs">Always online</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-white/5 mx-6" />

          {/* Quick Actions */}
          <div className="px-6 py-5">
            {selectedConv.profileId && (
              <Link
                href={`/${selectedConv.profileId.startsWith('character-') ? 'character' : 'girl'}/${selectedConv.profileId.startsWith('character-') ? selectedConv.profileId.replace('character-', '') : selectedConv.profileId}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all mb-3 border border-zinc-200 dark:border-white/5"
              >
                <User className="w-4 h-4" />
                View Full Profile
              </Link>
            )}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              Report User
            </button>
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
        characterName={restrictedData?.name || 'Character'}
        price={restrictedData?.price || 4.99}
        avatar={restrictedData?.avatar}
      />
    </div>
  );
}
