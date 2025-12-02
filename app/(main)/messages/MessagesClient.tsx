'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch, FaPaperPlane, FaPhone, FaVideo, FaInfoCircle, FaSmile } from 'react-icons/fa';
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
  createdAt?: Date;
}

export default function MessagesClient() {
  const searchParams = useSearchParams();
  const { messages: socketMessages, sendMessage, isConnected, selectedProfileId, setSelectedProfileId, fetchConversation, userId } = useSocket();
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedUrlParam = useRef(false);
  const pendingSelection = useRef<{ profileId: string; conversationId: number } | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch all conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/conversations?userId=${userId}`);
        if (!response.ok) {
          console.error('Failed to fetch conversations');
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
      }
    };

    fetchConversations();
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
      sendMessage(messageText, selectedConv.profileId);
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
      <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-white/10 flex flex-col bg-zinc-900/20 ${selectedConversation && 'hidden md:flex'
        }`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setSelectedConversation(conv.id);
                if (conv.profileId) {
                  setSelectedProfileId(conv.profileId);
                  fetchConversation(conv.profileId);
                }
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedConversation === conv.id ? 'bg-white/10' : ''
                }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                  <span className="text-xs text-zinc-500 shrink-0">{conv.timestamp}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread ? 'text-white font-medium' : 'text-zinc-400'}`}>
                  {conv.lastMessage}
                </p>
              </div>

              {/* Unread Indicator */}
              {conv.unread && (
                <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      {selectedConv ? (
        <div className="flex flex-1 flex-col bg-zinc-900/10">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back Button for Mobile */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-zinc-400 hover:text-white transition-colors mr-3"
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
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{selectedConv.name}</h2>
                  <p className="text-xs text-zinc-400">Active now</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Voice Call Button (Yellow Circle) */}
              <button
                onClick={() => setShowVoiceCall(true)}
                className="relative w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 flex items-center justify-center transition-all shadow-lg hover:shadow-yellow-500/50"
                title="Start Voice Call"
              >
                <FaPhone className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900 animate-pulse" />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <FaVideo className="w-5 h-5" />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <FaInfoCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {socketMessages.map((message, index) => {
              const isOwn = message.sender === userId;
              return (
                <div
                  key={message._id || index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
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
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800/50 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.message}</p>
                    </div>

                    {/* <span className="text-xs text-zinc-500 mt-1">
                      {message.createdAt 
                        ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : 'now'
                      }
                    </span> */}
                  </div>

                  {isOwn && (
                    <div className="w-8 ml-2" />
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-zinc-400 hover:text-white transition-colors"
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
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-full px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
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
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-900/10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-600/20 flex items-center justify-center">
              <FaPaperPlane className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
            <p className="text-zinc-400">Select a conversation to start chatting</p>
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
