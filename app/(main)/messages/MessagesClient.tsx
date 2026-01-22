'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch, FaPaperPlane, FaPhone, FaVideo, FaInfoCircle, FaSmile } from 'react-icons/fa';
import { Phone, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';
import { useSocket } from '@/lib/socket';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

// Dynamically import emoji picker to avoid SSR issues
const Picker = dynamic(
  () => import('emoji-picker-react').then((mod) => mod.default),
  { ssr: false }
);

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
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedUrlParam = useRef(false);
  const pendingSelection = useRef<{ profileId: string; conversationId: number } | null>(null);
  const socketRef = useRef<any>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);

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
          
          console.log('📥 API returned conversations:', mappedConversations.length);
          
          // Merge with existing conversations instead of replacing
          setConversations(prev => {
            // Keep manually created conversations that aren't in API response
            const apiProfileIds = new Set(mappedConversations.map(c => c.profileId));
            const manualConversations = prev.filter(c => !apiProfileIds.has(c.profileId));
            
            console.log('🔄 Merging:', { api: mappedConversations.length, manual: manualConversations.length });
            
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
          console.log('🔄 Restored persona from localStorage:', savedPersonaId);
        } else {
          // Set default persona if exists and no saved selection
          const defaultPersona = data.personas?.find((p: any) => p.makeDefault);
          if (defaultPersona) {
            setSelectedPersonaId(defaultPersona._id);
            console.log('✅ Auto-selected default persona:', defaultPersona.displayName);
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
        console.log('🔧 Processing conversation:', { aiProfileId, existingCount: prevConversations.length });
        
        // Check if conversation already exists
        const existing = prevConversations.find((c) => c.profileId === aiProfileId);
        if (existing) {
          console.log('✅ Found existing conversation:', existing.name);
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

        console.log('➕ Creating new conversation:', newConversation.name, 'ID:', uniqueId);
        
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
      console.log('🔍 Selecting conversation:', { profileId, conversationId });
      pendingSelection.current = null; // Clear immediately to prevent re-runs
      
      setSelectedConversation(conversationId);
      setSelectedProfileId(profileId);
      fetchConversation(profileId);
      console.log('✅ Conversation selected successfully');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [socketMessages]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  
  // Debug log
  useEffect(() => {
    console.log('📊 State Debug:', {
      selectedConversation,
      conversationsCount: conversations.length,
      selectedConv: selectedConv ? `Found: ${selectedConv.name}` : 'NOT FOUND',
      allConversationIds: conversations.map(c => c.id)
    });
  }, [selectedConversation, conversations, selectedConv]);

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConv?.profileId) {
      // Include persona ID in message metadata
      if (selectedPersonaId) {
        // Find selected persona details
        const selectedPersona = personas.find(p => p._id === selectedPersonaId);
        
        console.log('🎭 Sending with persona:', {
          personaId: selectedPersonaId,
          displayName: selectedPersona?.displayName,
          background: selectedPersona?.background
        });
        
        // Send message with persona context
        socketRef.current?.emit("send_message", { 
          message: messageText, 
          profileId: selectedConv.profileId,
          personaId: selectedPersonaId,
          personaContext: selectedPersona?.background || ''
        });
      } else {
        console.log('📝 Sending without persona');
        sendMessage(messageText, selectedConv.profileId);
      }
      setMessageText('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessageText(prev => prev + emojiObject.emoji);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-80px)] flex">
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
              className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
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
                className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-200 dark:hover:bg-white/5 transition-all duration-300 border-b border-zinc-200 dark:border-white/5 ${
                  selectedConversation === conv.id ? 'bg-zinc-200 dark:bg-white/10' : ''
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
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/10 h-full">
          {/* Chat Header */}
          <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900/10 backdrop-blur-sm p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
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
              {/* Persona Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative"
                  title="Select Persona"
                >
                  <User className="w-5 h-5" />
                  {selectedPersonaId && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-white dark:border-zinc-900" />
                  )}
                </button>

                {/* Persona Dropdown */}
                {showPersonaSelector && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowPersonaSelector(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Select Persona</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Choose how AI sees you</p>
                      </div>

                      <div className="max-h-64 overflow-y-auto">
                        {/* No Persona Option */}
                        <button
                          onClick={() => {
                            setSelectedPersonaId(null);
                            setShowPersonaSelector(false);
                            // Save to localStorage
                            localStorage.removeItem(`selectedPersona_${userId}`);
                            console.log('❌ No persona selected - cleared localStorage');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-b border-zinc-200 dark:border-zinc-700/50 ${
                            !selectedPersonaId ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                              <User className="w-5 h-5 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-zinc-900 dark:text-white text-sm">No Persona</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Chat as yourself</p>
                            </div>
                            {!selectedPersonaId && (
                              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>

                        {/* Personas List */}
                        {personas.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">No personas yet</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Create one in your profile</p>
                          </div>
                        ) : (
                          personas.map((persona) => (
                            <button
                              key={persona._id}
                              onClick={() => {
                                setSelectedPersonaId(persona._id);
                                setShowPersonaSelector(false);
                                // Save to localStorage
                                localStorage.setItem(`selectedPersona_${userId}`, persona._id);
                                console.log('💾 Saved persona to localStorage:', persona.displayName);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-b border-zinc-200 dark:border-zinc-700/50 last:border-b-0 ${
                                selectedPersonaId === persona._id ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden shrink-0">
                                  {persona.avatar ? (
                                    <img src={persona.avatar} alt={persona.displayName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {persona.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                                    {persona.displayName}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                    {persona.background || 'No background'}
                                  </p>
                                </div>

                                {/* Selected Indicator */}
                                {selectedPersonaId === persona._id && (
                                  <svg className="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        <div
                          className={`rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-[1.02] ${
                            isOwn
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.message}</p>
                        </div>

                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
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
                      <div className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-lg">
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

          {/* Message Input */}
          <div className="sticky bottom-0 z-10 bg-zinc-50 dark:bg-zinc-900/10 backdrop-blur-sm p-4 border-t border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  title="Add emoji"
                >
                  <FaSmile className="w-5 h-5 mt-2" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <Picker
                      onEmojiClick={handleEmojiClick}
                      theme={'dark' as any}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-white/10 rounded-full px-4 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="text-purple-500 hover:text-purple-400 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
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
    </div>
  );
}
