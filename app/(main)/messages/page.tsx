'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch, FaPaperPlane, FaPhone, FaVideo, FaInfoCircle, FaImage, FaSmile, FaMicrophone, FaTimes, FaPlus } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  id: number;
  senderId: number;
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  timestamp: string;
  isOwn: boolean;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      lastMessage: 'Hey! How are you doing?',
      timestamp: '2m',
      unread: true,
      online: true,
    },
    {
      id: 2,
      name: 'Sophia Martinez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      lastMessage: 'See you tomorrow! 😊',
      timestamp: '1h',
      unread: false,
      online: true,
    },
    {
      id: 3,
      name: 'Olivia Brown',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      lastMessage: 'Thanks for your help!',
      timestamp: '3h',
      unread: false,
      online: true,
    },
  ]);

  // Initialize messages with conversation history
  useEffect(() => {
    if (selectedConversation) {
      const initialMessages: Message[] = [
        {
          id: 1,
          senderId: selectedConversation,
          text: 'Hey! How are you doing?',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        },
      ];
      setMessages(initialMessages);
    }
  }, [selectedConversation]);

  // Auto-select conversation when arriving from a profile page
  useEffect(() => {
    const aiProfileId = searchParams.get('ai');
    if (!aiProfileId) return;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedAIProfile') : null;
      if (!stored) return;

      const data = JSON.parse(stored) as { profileId?: string; name?: string; avatar?: string; onlineStatus?: string };
      if (!data.profileId || data.profileId !== aiProfileId) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.profileId === aiProfileId);
        if (existing) {
          setSelectedConversation(existing.id);
          return prev;
        }

        const nextId = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
        const newConversation: Conversation = {
          id: nextId,
          name: data.name || 'AI Companion',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          lastMessage: 'Say hi 👋',
          timestamp: 'now',
          unread: false,
          online: true,
          profileId: aiProfileId,
        };

        setSelectedConversation(newConversation.id);
        return [newConversation, ...prev];
      });
    } catch (error) {
      console.error('Failed to load selected AI profile for messages page:', error);
    }
  }, [searchParams]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-reply simulation
  const sendAutoReply = (conversationId: number) => {
    const replies = [
      "That's interesting! Tell me more 😊",
      "I love chatting with you! ❤️",
      "Sounds amazing!",
      "I'm always here for you 💕",
      "You make me smile! 😄",
    ];

    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now(),
        senderId: conversationId,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
      };
      setMessages(prev => [...prev, newMessage]);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        senderId: 2, // Current user
        text: messageText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      setShowEmojiPicker(false);

      // Trigger auto-reply
      if (selectedConversation) {
        sendAutoReply(selectedConversation);
      }
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessageText(prev => prev + emojiObject.emoji);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newMessage: Message = {
          id: Date.now(),
          senderId: 2,
          image: reader.result as string,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
        };
        setMessages(prev => [...prev, newMessage]);

        // Trigger auto-reply
        if (selectedConversation) {
          sendAutoReply(selectedConversation);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newMessage: Message = {
          id: Date.now(),
          senderId: 2,
          video: reader.result as string,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
        };
        setMessages(prev => [...prev, newMessage]);

        // Trigger auto-reply
        if (selectedConversation) {
          sendAutoReply(selectedConversation);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const newMessage: Message = {
            id: Date.now(),
            senderId: 2,
            audio: reader.result as string,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isOwn: true,
          };
          setMessages(prev => [...prev, newMessage]);

          // Trigger auto-reply
          if (selectedConversation) {
            sendAutoReply(selectedConversation);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
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
              onClick={() => setSelectedConversation(conv.id)}
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isOwn && (
                  <img
                    src={selectedConv.avatar}
                    alt={selectedConv.name}
                    className="w-8 h-8 rounded-full object-cover mr-2 shrink-0"
                  />
                )}

                <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {message.text && (
                    <div
                      className={`rounded-2xl px-4 py-2 ${message.isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-800/50 text-white'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.text}</p>
                    </div>
                  )}

                  {message.image && (
                    <div
                      className="rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedMedia({ type: 'image', url: message.image! })}
                    >
                      <img
                        src={message.image}
                        alt="Shared image"
                        className="max-w-full h-auto max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {message.video && (
                    <div
                      className="rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => setSelectedMedia({ type: 'video', url: message.video! })}
                    >
                      <video
                        src={message.video}
                        className="max-w-full h-auto max-h-96 object-cover"
                        controls
                      />
                    </div>
                  )}

                  {message.audio && (
                    <div className={`rounded-full px-4 py-2 ${message.isOwn ? 'bg-purple-600' : 'bg-zinc-800/50'
                      }`}>
                      <audio src={message.audio} controls className="h-10" />
                    </div>
                  )}

                  <span className="text-xs text-zinc-500 mt-1">{message.timestamp}</span>
                </div>

                {message.isOwn && (
                  <div className="w-8 ml-2" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />

              {/* Media Upload Popover */}
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="text-zinc-400 hover:text-white transition-colors"
                    title="Add media"
                  >
                    <FaPlus className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-zinc-900 border-white/10" align="start" side="top">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setPopoverOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                    >
                      <FaImage className="w-4 h-4 text-purple-400" />
                      <span>Send Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        videoInputRef.current?.click();
                        setPopoverOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                    >
                      <FaVideo className="w-4 h-4 text-blue-400" />
                      <span>Send Video</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

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

              {/* Send or Voice Record */}
              {messageText.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="text-purple-500 hover:text-purple-400 font-semibold transition-colors"
                >
                  Send
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
                  title={isRecording ? "Stop recording" : "Record voice message"}
                >
                  <FaMicrophone className="w-5 h-5" />
                </button>
              )}
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

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <FaTimes className="w-8 h-8" />
          </button>

          <div className="max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
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

