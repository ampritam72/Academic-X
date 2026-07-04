/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Send, Trash2, Copy, Check, BookOpen, 
  Image as ImageIcon, Mic, Video, FileText, ChevronRight, 
  HelpCircle, StopCircle, ArrowRight, Sparkle, Loader2 
} from 'lucide-react';
import { generateContent } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachedImage?: string; // base64 preview format
  attachedVideo?: { name: string; duration: string };
  followUps?: string[];
}

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  { label: '📝 Explain Topic', prompt: 'Explain this topic in simple words: ' },
  { label: '💻 Bug Fixer', prompt: 'Find the bug in this code and explain the correct solution:\n\n' },
  { label: '📚 Summarize Text', prompt: 'Summarize the following text briefly:\n\n' },
  { label: '🧮 Translate', prompt: 'Translate the following text into English:\n\n' },
];

const PRESET_MOCK_VOICE_QUERIES = [
  "Hello, how can you help me today?",
  "What is the capital of France?",
  "Write an email requesting a day off.",
  "Tell me a joke."
];

export function AskAIModal({ isOpen, onClose }: AskAIModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Media attachments state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<{ name: string; size: string } | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(3);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<any>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Hello! I am your **AI Assistant**. 👋\n\nAsk me any questions, request solutions, summarize topics, or generate text!\n\nYou can also upload **images**, perform **voice queries**, or attach **videos** for analysis.',
          timestamp: new Date(),
          followUps: [
            "Write a poem about the sea",
            "How do black holes work?",
            "What can you do?"
          ]
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isRecordingAudio, isVideoUploading]);

  if (!isOpen) return null;

  // Handle image upload and conversion to base64 for display preview
  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
        setInput((prev) => prev ? prev : `Analyze this attached image and explain it:`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle simulated Voice record processing
  const handleVoiceMicClick = () => {
    if (isRecordingAudio) {
      stopVoiceRecording(true);
      return;
    }

    setIsRecordingAudio(true);
    setRecordingCountdown(3);
    
    // Simulating countdown & transcription insertion
    recordingTimerRef.current = setInterval(() => {
      setRecordingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(recordingTimerRef.current);
          stopVoiceRecording(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopVoiceRecording = (cancelled: boolean) => {
    clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    if (!cancelled) {
      // Pick a random smart transcription and put it into input
      const randomQuery = PRESET_MOCK_VOICE_QUERIES[Math.floor(Math.random() * PRESET_MOCK_VOICE_QUERIES.length)];
      setInput(randomQuery);
    }
  };

  // Handle Lecture Video Upload simulation with animated progress report
  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedVideo({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      });
      
      // Simulate progress uploads
      setIsVideoUploading(true);
      setVideoProgress(0);
      
      const interval = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsVideoUploading(false);
            // Append helper query automated
            setInput(`I have attached this video "${file.name}". Please summarize its key moments.`);
            return 100;
          }
          return prev + 15;
        });
      }, 300);
    }
  };

  const handleSend = async (textToSend: string, customImage?: string) => {
    if (!textToSend.trim() && !customImage && !attachedImage && !isLoading) return;

    const userMsgText = textToSend || (customImage || attachedImage ? "Attached Image analyzed" : "");
    const imgToSend = customImage || attachedImage;
    const vidToSend = attachedVideo;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
      attachedImage: imgToSend || undefined,
      attachedVideo: vidToSend ? { name: vidToSend.name, duration: "Lecture Video" } : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setAttachedVideo(null);
    setIsLoading(true);

    try {
      let promptWithContext = userMsgText.trim();
      if (!promptWithContext) {
        if (imgToSend) promptWithContext = "Please analyze this image.";
        else if (vidToSend) promptWithContext = "Please summarize this video.";
      } else {
        if (vidToSend) {
          promptWithContext = `[Video Attached: "${vidToSend.name}"]\n\n${promptWithContext}`;
        }
      }

      const historyPayload = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'welcome-reset')
        .map(m => ({
          role: m.sender === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

      const response = await generateContent(promptWithContext, imgToSend || undefined, historyPayload);
      
      // Intelligent mock contextual response modifiers to accommodate attachments
      let finalAiResponse = response || 'No response found. Please try again.';
      let followUps = [
        "Explain in more detail",
        "Give an example"
      ];

      if (imgToSend) {
        // Just return the AI's actual response.
        finalAiResponse = response || 'No content returned for image analysis.';
      }

      if (vidToSend) {
        // Just return the AI's actual response.
        finalAiResponse = response || 'No content returned for video analysis.';
      }
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: finalAiResponse,
        timestamp: new Date(),
        followUps: followUps,
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      let errorMsgText = 'Sorry, the AI server is currently overloaded. Please try again in a few moments.';
      if (error.message && error.message.includes('413')) {
        errorMsgText = '⚠️ **Token limit exceeded!** Please reduce your query text/code size slightly and try again.';
      }
      
      const aiErrorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: errorMsgText,
        timestamp: new Date(),
        followUps: ["Simplify explanation", "Shorten prompt and retry"]
      };
      setMessages((prev) => [...prev, aiErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'ai',
          text: 'Chat history cleared. Please send a new query, or select one of the Quick Filters below!',
          timestamp: new Date(),
          followUps: ["Tell me a joke", "Write a poem"]
        },
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple Markdown parsing for bullet points, bold text, and code blocks
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Code Block Toggle
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const fullCode = codeContent.join('\n');
          codeContent = [];
          return (
            <div key={idx} className="my-2 bg-slate-900 border border-slate-800 text-cyan-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto relative group">
              <button 
                onClick={() => copyToClipboard(fullCode, `code-${idx}`)}
                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg active:scale-95 transition-all opacity-85"
                title="Copy Code"
                type="button"
              >
                {copiedId === `code-${idx}` ? <Check size={12} className="text-emerald-450" /> : <Copy size={12} />}
              </button>
              <pre className="whitespace-pre leading-relaxed">{fullCode}</pre>
            </div>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Handle Bold text styling
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900 dark:text-cyan-300">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const finalContent = parts.length > 0 ? parts : line;

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <ul key={idx} className="list-disc list-inside ml-2 my-1.5 text-slate-700 dark:text-slate-300">
            <li className="leading-relaxed">
              <span className="ml-[2px]">{line.trim().substring(2)}</span>
            </li>
          </ul>
        );
      }

      // Ordered list
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="ml-2 my-1.5 flex gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-black text-cyan-500">{numMatch[1]}.</span>
            <span className="leading-relaxed">{numMatch[2]}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="min-h-[1rem] leading-relaxed my-1.5 text-slate-700 dark:text-slate-300">
          {finalContent}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-md flex flex-col justify-end"
    >
      {/* Tap outside overlay to close safely */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="h-[92%] md:h-[88%] w-full max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 rounded-t-[2.5rem] flex flex-col shadow-2xl border-t border-white/20 dark:border-slate-800 relative z-10"
      >
        {/* Invisible file inputs for image, video uploads */}
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageChange} 
        />
        <input 
          type="file" 
          ref={videoInputRef} 
          accept="video/*" 
          className="hidden" 
          onChange={handleVideoChange} 
        />

        {/* Drawer Slide Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer" onClick={onClose} />
        </div>

        {/* Header */}
        <header className="px-6 pb-4 pt-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/15">
              <Sparkles className="animate-pulse" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                AI Assistant
              </h2>
              <p className="text-[10px] text-emerald-500 font-bold tracking-wide uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Active Voice & Video Core
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2.5 hover:bg-red-500/10 hover:text-red-500 text-slate-400 dark:text-slate-500 rounded-xl transition-all cursor-pointer"
              title="Clear Chat"
              type="button"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:scale-105 active:scale-90 transition-transform cursor-pointer"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Voice Recording overlay indicator inside the modal */}
        {isRecordingAudio && (
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75" />
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <Mic size={16} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold font-sans">🎤 Recording your audio...</p>
                <p className="text-[10px] text-cyan-200">Will automatically transcribe after 3 seconds.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold bg-slate-900/40 px-2.5 py-1 rounded-lg">
                00:0{recordingCountdown}
              </span>
              <button 
                onClick={() => stopVoiceRecording(true)} 
                className="bg-slate-900 hover:bg-slate-800 text-xs text-rose-350 font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all text-[10px]"
                type="button"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Video Upload Processing bar */}
        {isVideoUploading && (
          <div className="bg-slate-100 dark:bg-slate-950 px-6 py-4 border-b border-cyan-500/25 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                <Loader2 className="animate-spin text-cyan-500" size={14} />
                Processing lecture video and bookmark tracking...
              </span>
              <span className="font-mono text-[10px] text-slate-500">{videoProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Chat Message Scroll Panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Sparkles size={14} />
                </div>
              )}
              
              <div className="max-w-[85%] relative group">
                <div
                  className={`rounded-2xl p-4 text-[12px] font-medium leading-relaxed [word-break:break-word] ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Embedded user photo attach inside user message box */}
                  {msg.attachedImage && (
                    <div className="mb-2 bg-slate-950/20 rounded-xl overflow-hidden max-h-48 border border-white/20">
                      <img 
                        src={msg.attachedImage} 
                        alt="Attached content" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {/* Embedded user video outline badge file */}
                  {msg.attachedVideo && (
                    <div className="mb-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                        <Video size={16} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[10px] font-bold truncate text-white">{msg.attachedVideo.name}</p>
                        <p className="text-[8px] text-slate-350">{msg.attachedVideo.duration} • Attached</p>
                      </div>
                    </div>
                  )}

                  {msg.sender === 'ai' ? (
                    <div className="space-y-1">
                      {renderMessageContent(msg.text)}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

                {/* Micro Clipboard Action Button inside Message boxes */}
                {msg.sender === 'ai' && msg.id !== 'welcome' && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 p-1.5 rounded-md transition-all active:scale-90 text-slate-500 dark:text-slate-400"
                      title="Copy"
                      type="button"
                    >
                      {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                )}

                {/* Embedded dynamic follow up helper query buttons/options */}
                {msg.sender === 'ai' && msg.followUps && msg.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {msg.followUps.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => handleSend(action)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-cyan-50 dark:hover:bg-slate-750 transition-colors border border-slate-200/40 dark:border-slate-800 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 rounded-full cursor-pointer active:scale-95"
                        type="button"
                      >
                        <Sparkle size={10} className="text-cyan-500 animate-pulse" />
                        {action}
                        <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-slate-400 mt-1 block px-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-bold text-sm uppercase">
                  🎓
                </div>
              )}
            </div>
          ))}

          {/* Preset SUGGESTION chips shown when chat is blank or simple */}
          {messages.length <= 1 && (
            <div className="space-y-2.5 py-3 animate-fade-in">
              <div className="flex items-center gap-1.5 pl-1">
                <BookOpen size={12} className="text-cyan-500" />
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Quick Help Filters
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (s.prompt.includes('\n')) {
                        setInput(s.prompt);
                      } else {
                        handleSend(s.prompt);
                      }
                    }}
                    className="flex flex-col text-left items-start gap-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-750 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all active:scale-95 text-[11px] text-slate-700 dark:text-slate-350 cursor-pointer"
                    type="button"
                  >
                    <span className="font-bold text-slate-900 dark:text-white mb-0.5">{s.label}</span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 line-clamp-1 truncate w-full">Tap to ask...</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing indicator bubble */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <Loader2 size={14} className="animate-spin text-cyan-500" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Image & Video Compositing Thumbnail preview bar above footer text bar */}
        {(attachedImage || attachedVideo) && (
          <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-250 dark:border-slate-850 flex items-center gap-3">
            {attachedImage && (
              <div className="relative group shrink-0">
                <img 
                  src={attachedImage} 
                  alt="Composer thumb" 
                  className="w-12 h-12 object-cover rounded-lg border border-cyan-500/40"
                />
                <button
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {attachedVideo && (
              <div className="bg-slate-200 dark:bg-slate-900 px-3 py-2 rounded-xl flex items-center gap-2 max-w-xs border border-cyan-500/25 shrink-0">
                <Video size={14} className="text-cyan-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] truncate font-bold text-slate-800 dark:text-slate-100">{attachedVideo.name}</p>
                  <p className="text-[8px] text-slate-500">{attachedVideo.size}</p>
                </div>
                <button
                  onClick={() => setAttachedVideo(null)}
                  className="text-slate-400 hover:text-red-500 p-0.5"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex-1 text-[10px] text-slate-500">
              {attachedImage && "📸 Image attached"}
              {attachedVideo && "🎥 Lecture Video attached"}
            </div>
          </div>
        )}

        {/* Input Composer Panel with Image, Voice & Video Toolbar */}
        <footer className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 flex flex-col gap-3">
          {/* Enhanced Smart Attachment Panel bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleImageClick}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border ${
                attachedImage 
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500/30 text-cyan-600'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-500'
              } text-[10px] font-bold transition-all active:scale-95`}
              title="📸 Add Image"
              type="button"
            >
              <ImageIcon size={14} className={attachedImage ? 'animate-bounce' : ''} />
              <span>IMAGE</span>
            </button>

            <button
              onClick={handleVoiceMicClick}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border ${
                isRecordingAudio 
                ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500'
              } text-[10px] font-bold transition-all active:scale-95`}
              title="🎤 Try Voice Command"
              type="button"
            >
              <Mic size={14} className={isRecordingAudio ? 'animate-pulse text-red-500' : ''} />
              <span>VOICE</span>
            </button>

            <button
              onClick={handleVideoClick}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border ${
                attachedVideo 
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500/30 text-cyan-600'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-500'
              } text-[10px] font-bold transition-all active:scale-95`}
              title="📽️ Summarize Lecture Video"
              type="button"
            >
              <Video size={14} />
              <span>VIDEO</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question about studies, lectures or programming..."
              disabled={isLoading || isRecordingAudio}
              className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 py-3 px-1 font-medium"
            />
            
            <button
              type="submit"
              disabled={isLoading || isRecordingAudio || (!input.trim() && !attachedImage)}
              className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl active:scale-90 disabled:opacity-40 hover:scale-105 transition-all cursor-pointer shadow-md shadow-cyan-500/10"
            >
              <Send size={15} />
            </button>
          </form>
          <div className="flex justify-between items-center px-1 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
            <span>💡 Tips: Press <b>VOICE</b> to record audio queries</span>
            <span>Powered by Groq/Gemini Multi-Modal</span>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
