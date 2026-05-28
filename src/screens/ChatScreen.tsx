/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ChevronLeft, MessageSquare, Send, Plus, 
  MoreVertical, User, Users, Phone, Video,
  Smile, Paperclip, MapPin, Mic, Check, Image as ImageIcon, FileText, X, VideoOff, PhoneOff, Trash2, Ban, LogOut, Settings, Camera, Info
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, limit, doc, 
  updateDoc, Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ensureUserJoinedSectionGroup } from '../lib/chatService';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  fileUrl?: string;
  fileType?: string;
}

interface Conversation {
  id: string;
  type: 'personal' | 'group';
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  name?: string;
  section?: string;
  batch?: string;
  avatarUrl?: string;
}

interface ChatScreenProps {
  onBack?: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [activeTab, setActiveTab] = useState<'Personal' | 'Group'>('Personal');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;
  const { user } = useAuth();
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  const isInitialLoadRef = useRef(true);

  // Reset scroll to top when toggling between chat list and open chat conversation
  useEffect(() => {
    isInitialLoadRef.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' as any });
    document.body.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [selectedChat]);

  const [userProfiles, setUserProfiles] = useState<Record<string, { fullName: string; avatarUrl: string }>>({});

  // Dynamic profile loader for chat participants and active message senders
  useEffect(() => {
    const idsToFetch = new Set<string>();

    // 1. Add personal chat participants
    conversations.forEach(c => {
      if (c.type === 'personal' && currentUser) {
        const recipientId = c.participants.find(id => id !== currentUser.uid);
        if (recipientId) {
          idsToFetch.add(recipientId);
        }
      }
    });

    // 2. Add message senders of selected chat
    if (selectedChat) {
      messages.forEach(m => {
        if (m.senderId) {
          idsToFetch.add(m.senderId);
        }
      });
    }

    const uniqueIds = Array.from(idsToFetch).filter(id => !userProfiles[id]);
    if (uniqueIds.length === 0) return;

    const fetchUsers = async () => {
      const newProfiles = { ...userProfiles };
      let updated = false;

      for (let i = 0; i < uniqueIds.length; i += 10) {
        const chunk = uniqueIds.slice(i, i + 10);
        const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          newProfiles[docSnap.id] = {
            fullName: data.fullName || 'User',
            avatarUrl: data.avatarUrl || ''
          };
          updated = true;
        });
      }

      if (updated) {
        setUserProfiles(newProfiles);
      }
    };

    fetchUsers().catch(err => console.error("Error fetching user profiles:", err));
  }, [conversations, selectedChat, messages, currentUser]);

  // Auto-join section group
  useEffect(() => {
    if (user?.id && user?.studentId) {
      setIsJoiningGroup(true);
      ensureUserJoinedSectionGroup(user.id, user.studentId, user)
        .finally(() => setIsJoiningGroup(false));
    }
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        messageEndRef.current?.scrollIntoView({ behavior: 'instant' as any });
        isInitialLoadRef.current = false;
      } else {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Fetch Conversations
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Conversation));
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
       } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const msgText = newMessage;
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
        senderId: currentUser.uid,
        senderName: user?.fullName || currentUser.displayName || 'User',
        senderAvatarUrl: user?.avatarUrl || '',
        text: msgText,
        createdAt: serverTimestamp()
      });

      // Update conversation last message
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const startPersonalChat = async (targetUser: any) => {
    if (!currentUser) return;

    // Check if chat already exists
    const existing = conversations.find(c => 
      c.type === 'personal' && c.participants.includes(targetUser.id)
    );

    if (existing) {
      setSelectedChat(existing);
      setShowUserSearch(false);
      return;
    }

    try {
      const newChatRef = await addDoc(collection(db, 'chats'), {
        type: 'personal',
        participants: [currentUser.uid, targetUser.id],
        lastMessage: 'Started a conversation',
        lastMessageAt: serverTimestamp(),
        name: targetUser.fullName || 'User',
        avatarUrl: targetUser.avatarUrl || ''
      });

      setSelectedChat({
        id: newChatRef.id,
        type: 'personal',
        participants: [currentUser.uid, targetUser.id],
        lastMessage: 'Started a conversation',
        lastMessageAt: Timestamp.now(),
        name: targetUser.fullName || 'User',
        avatarUrl: targetUser.avatarUrl || ''
      });
      setShowUserSearch(false);
    } catch (err) {
      console.error('Error starting chat', err);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    const q = query(
      collection(db, 'users'),
      limit(5)
    );
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== currentUser?.uid));
  };

  const filteredConversations = conversations.filter(c => 
    activeTab === 'Personal' ? c.type === 'personal' : c.type === 'group'
  );

  return (
    <div className="h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 via-purple-200/50 to-blue-200/50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20 -z-10 pointer-events-none" />
      {!selectedChat ? (
        <>
          <header className="p-6 pb-2">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={onBack}
                    className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-600 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <MessageSquare size={20} fill="currentColor" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Chats</h1>
                  </div>
               </div>
               <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                  <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'Felix'}`} alt="Profile" className="w-full h-full object-cover" />
               </div>
            </div>

            <div className="relative mb-6">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input
                 type="text"
                 placeholder="Search messages..."
                 className="w-full bg-white dark:bg-slate-800 border-none rounded-[2rem] py-4 pl-14 pr-6 shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 transition-colors placeholder-slate-400"
               />
            </div>

            <div className="flex gap-3">
               {(['Personal', 'Group'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                     activeTab === tab ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm'
                   }`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
          </header>

          <main className="flex-1 px-6 space-y-4 overflow-y-auto no-scrollbar pt-4 pb-24">
             {loading ? (
               <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Connection established...</p>
               </div>
             ) : filteredConversations.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-400">
                     <MessageSquare size={32} />
                  </div>
                  <p className="text-xs font-bold text-slate-500">No {activeTab.toLowerCase()} chats found</p>
               </div>
             ) : (
                filteredConversations.map((chat) => {
                   const recipientId = chat.type === 'personal' ? chat.participants.find(id => id !== currentUser?.uid) : null;
                   const recipientProfile = recipientId ? userProfiles[recipientId] : null;
                   const chatName = recipientProfile?.fullName || chat.name || 'Chat';
                   const chatAvatar = recipientProfile?.avatarUrl || chat.avatarUrl;

                   return (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       key={chat.id}
                       onClick={() => setSelectedChat(chat)}
                       className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-indigo-500/30"
                     >
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                           {chatAvatar ? (
                             <img src={chatAvatar} className="w-full h-full object-cover" />
                           ) : (
                             chat.type === 'personal' ? <User size={24} /> : <Users size={24} />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate uppercase tracking-tight">{chatName}</h4>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter shrink-0">
                                {chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                              </span>
                           </div>
                           <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold truncate leading-relaxed italic">{chat.lastMessage}</p>
                        </div>
                     </motion.div>
                   );
                })
             )}
          </main>

          {activeTab === 'Personal' && (
            <div className="fixed bottom-24 right-6">
               <button 
                 onClick={() => setShowUserSearch(true)}
                 className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-transform"
               >
                  <Plus size={24} />
               </button>
            </div>
          )}
        </>
      ) : (
        <ChatWindow 
          chat={selectedChat} 
          messages={messages} 
          onSend={handleSendMessage} 
          newMessage={newMessage} 
          setNewMessage={setNewMessage}
          onBack={() => setSelectedChat(null)} 
          currentUser={currentUser}
          messageEndRef={messageEndRef}
          userProfiles={userProfiles}
        />
      )}

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm p-6 flex flex-col items-center justify-center"
          >
             <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl space-y-6 text-[#2c3e50] dark:text-slate-200">
                <div className="flex items-center justify-between">
                   <h2 className="text-lg font-black uppercase tracking-tight">Find User</h2>
                   <button onClick={() => setShowUserSearch(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="relative">
                   <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyUp={(e) => e.key === 'Enter' && searchUsers()}
                     placeholder="Search by name or student ID..."
                     className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-6 pr-12 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20"
                   />
                   <button 
                     onClick={searchUsers}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500"
                   >
                     <Search size={18} />
                   </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                   {users.map(u => (
                     <div 
                       key={u.id}
                       onClick={() => startPersonalChat(u)}
                       className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                     >
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-500 font-bold uppercase text-[10px]">
                           {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase">{u.fullName}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.studentId}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChatWindowProps {
  chat: Conversation;
  messages: Message[];
  onSend: (e: React.FormEvent) => void;
  newMessage: string;
  setNewMessage: (val: string) => void;
  onBack: () => void;
  currentUser: any;
  messageEndRef: React.RefObject<HTMLDivElement>;
  userProfiles: Record<string, { fullName: string; avatarUrl: string }>;
}

function ChatWindow({ chat, messages, onSend, newMessage, setNewMessage, onBack, currentUser, messageEndRef, userProfiles }: ChatWindowProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [calling, setCalling] = useState<'audio' | 'video' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ['😀','😂','🥰','😎','😭','🥺','🤔','👍','❤️','🔥','✨','🎉'];

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onload = async (ev) => {
                  const result = ev.target?.result as string;
                  try {
                    await addDoc(collection(db, 'chats', chat.id, 'messages'), {
                      senderId: currentUser?.uid || 'unknown',
                      senderName: user?.fullName || currentUser?.displayName || 'User',
                      senderAvatarUrl: user?.avatarUrl || '',
                      text: 'Audio Message',
                      fileUrl: result,
                      fileType: 'audio',
                      createdAt: serverTimestamp()
                    });
                    await updateDoc(doc(db, 'chats', chat.id), {
                      lastMessage: 'Sent a voice message',
                      lastMessageAt: serverTimestamp()
                    });
                  } catch(err) {
                    console.error("Error sending audio", err);
                  }
              };
              reader.readAsDataURL(audioBlob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error('Error accessing mic', err);
          alert('Could not access microphone');
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (ev) => {
       const result = ev.target?.result as string;
       const isImage = file.type.startsWith('image/');
       try {
         await addDoc(collection(db, 'chats', chat.id, 'messages'), {
           senderId: currentUser?.uid,
           senderName: user?.fullName || currentUser?.displayName || 'User',
           senderAvatarUrl: user?.avatarUrl || '',
           text: file.name,
           fileUrl: result,
           fileType: isImage ? 'image' : 'doc',
           createdAt: serverTimestamp()
         });
         await updateDoc(doc(db, 'chats', chat.id), {
           lastMessage: isImage ? 'Sent an image' : 'Sent a file',
           lastMessageAt: serverTimestamp()
         });
       } catch (err) {
         console.error(err);
         alert("Error sending file");
       }
     };
     reader.readAsDataURL(file);
     setShowAttach(false);
  };

  // Determine chat name and avatar based on shared profiles
  const recipientId = chat.type === 'personal' ? chat.participants.find(id => id !== currentUser?.uid) : null;
  const recipientProfile = recipientId ? userProfiles[recipientId] : null;
  const chatName = recipientProfile?.fullName || chat.name || 'Chat';
  const chatAvatar = recipientProfile?.avatarUrl || chat.avatarUrl;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 transition-colors relative">
      {/* Call UI Overlay */}
      <AnimatePresence>
         {calling && (
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex flex-col items-center gap-3 border border-slate-700/50 min-w-[280px]"
           >
              <div className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border-2 border-slate-700">
                    {chatAvatar ? <img src={chatAvatar} className="w-full h-full object-cover" /> : <User size={32} />}
                 </div>
                 <div className="text-center">
                    <p className="font-bold text-sm tracking-wide">{chatName}</p>
                    <p className="text-xs text-indigo-400 font-medium">{calling === 'video' ? 'Video Calling...' : 'Calling...'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                 <button className="w-12 h-12 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <Mic size={20} />
                 </button>
                 <button onClick={() => setCalling(null)} className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors">
                    {calling === 'video' ? <VideoOff size={20} /> : <PhoneOff size={20} />}
                 </button>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      <input type="file" ref={imageInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
      <input type="file" ref={docInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />

      <header className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-emerald-600 active:scale-90 transition-transform p-2 -ml-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
               <ChevronLeft size={28} />
            </button>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-500 font-bold overflow-hidden shadow-inner uppercase text-[10px]">
                  {chatAvatar ? <img src={chatAvatar} className="w-full h-full object-cover" /> : (chat.type === 'personal' ? (chatName?.charAt(0) || 'U') : <Users size={20} />)}
               </div>
               <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-[15px] max-w-[150px] truncate">{chatName}</h3>
                  <p className="text-[11px] font-medium text-slate-500">Active Now</p>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1 text-slate-400 relative">
            <button onClick={() => setCalling('audio')} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-emerald-600"><Phone size={20} fill="currentColor" /></button>
            <button onClick={() => setCalling('video')} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-emerald-600"><Video size={24} fill="currentColor" /></button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className={`p-2.5 rounded-full transition-colors ${showMenu ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'} text-emerald-600`}>
                <Info size={24} fill="currentColor" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 text-[13px] font-semibold"
                  >
                     <div className="p-2 flex flex-col">
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200">
                          <User size={16} /> View Profile
                        </button>
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200">
                          <Search size={16} /> Search in Conversation
                        </button>
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200">
                          <Settings size={16} /> Notification Settings
                        </button>
                        <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors">
                          <Ban size={16} /> Block User
                        </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
         </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar bg-slate-50/50 dark:bg-slate-950/20 relative">
         <div className="absolute inset-0 z-0 opacity-[0.1]" style={{ backgroundImage: chat.type === 'group' ? 'url("https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=1000&auto=format&fit=crop")' : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
         
         <div className="flex items-center justify-center my-6 relative z-10">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Today</span>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
         </div>

         {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.uid;
            const senderProfile = msg.senderId ? userProfiles[msg.senderId] : null;
            const senderAvatar = senderProfile?.avatarUrl || (msg as any).senderAvatarUrl || '';
            const senderName = senderProfile?.fullName || msg.senderName || 'User';

            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10`}>
                <div className={`max-w-[85%] flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* User Avatar next to message */}
                    {!isMe && (
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden mb-1 flex items-center justify-center text-slate-400 border border-slate-50 dark:border-slate-900 shadow-sm relative -ml-2 z-10 select-none">
                       <img 
                         src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`} 
                         alt="User" 
                         className="w-full h-full object-cover" 
                       />
                     </div>
                    )}
                    <div className="flex flex-col">
                       {!isMe && (
                         <span className="text-[11px] font-medium text-slate-500 mb-1 ml-3">{senderName}</span>
                       )}
                       <div className={`py-2 px-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm max-w-full break-words ${
                         isMe 
                           ? 'bg-emerald-500 text-white' 
                           : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                       }`}>
                          {msg.fileUrl ? (
                             msg.fileType === 'image' ? (
                               <div className="flex flex-col gap-2">
                                  <img src={msg.fileUrl} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-2xl object-cover" />
                                  <span className="opacity-80 break-all">{msg.text}</span>
                               </div>
                             ) : msg.fileType === 'audio' ? (
                               <audio controls src={msg.fileUrl} className="max-w-[200px]" />
                             ) : (
                               <div className="flex items-center gap-3 bg-white/20 p-2 rounded-xl">
                                  <FileText size={24} />
                                  <span className="break-all">{msg.text}</span>
                               </div>
                             )
                          ) : (
                            <span>{msg.text}</span>
                          )}
                       </div>
                       <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                          {isMe && <Check size={12} className="text-emerald-400" />}
                       </div>
                    </div>
                 </div>
              </div>
            );
         })}
         <div ref={messageEndRef} />
      </main>

      <footer className="p-3 pb-24 sm:pb-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-20">
         <div className="flex items-center gap-2 max-w-4xl mx-auto w-full relative">
            <div className="flex items-center text-emerald-500 shrink-0">
               <button type="button" className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
                  <Plus size={24} />
               </button>
               <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <Camera size={24} />
               </button>
               <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleFileUpload} />
               <input type="file" accept="image/*" hidden ref={imageInputRef} onChange={handleFileUpload} />
               <input type="file" accept=".pdf,.doc,.docx,.txt" hidden ref={docInputRef} onChange={handleFileUpload} />

               <div className="relative">
                 <button type="button" id="chat-attach-btn" onClick={() => setShowAttach(!showAttach)} className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                    <Paperclip size={24} />
                 </button>
                 <AnimatePresence>
                   {showAttach && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       className="fixed z-[999] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1 w-48"
                       style={{ 
                         bottom: '80px', // Fallback for fixed positioning above the footer
                         left: 'max(1rem, calc(50% - 24rem + 1rem))' // Aligned roughly above the attachment icon
                       }}
                     >
                        <button type="button" onClick={() => { imageInputRef.current?.click(); }} className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                           <ImageIcon size={18} className="text-emerald-500" /> Send Image
                        </button>
                        <button type="button" onClick={() => { docInputRef.current?.click(); }} className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                           <FileText size={18} className="text-indigo-500" /> Send Document
                        </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
               <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`}>
                  <Mic size={24} />
               </button>
            </div>
            
            <form onSubmit={onSend} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full pl-4 pr-1 py-1 flex items-center gap-2 transition-all relative min-w-0">
               <input 
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 placeholder="Message"
                 className="flex-1 bg-transparent border-none outline-none text-[15px] py-1.5 text-slate-800 dark:text-slate-100 placeholder-slate-500 min-w-0 focus:ring-0"
               />
               <div className="relative">
                 <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 text-emerald-500 hover:text-emerald-600 transition-colors mr-1">
                    <Smile size={24} />
                 </button>
                 {showEmojiPicker && (
                    <div className="absolute bottom-[120%] right-0 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 w-[220px] z-50">
                       {emojis.map(e => (
                         <button key={e} type="button" onClick={() => { setNewMessage(newMessage + e); setShowEmojiPicker(false); }} className="text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors">
                           {e}
                         </button>
                       ))}
                    </div>
                 )}
               </div>
               {newMessage.trim() && (
                 <button 
                   type="submit"
                   className="absolute right-[-45px] text-emerald-500 hover:text-emerald-600 p-2 transition-colors shrink-0"
                 >
                    <Send size={24} fill="currentColor" className="text-emerald-500" />
                 </button>
               )}
            </form>
            
            {newMessage.trim() ? <div className="w-[45px] shrink-0" /> : null}
         </div>
      </footer>
    </div>
  );
}
