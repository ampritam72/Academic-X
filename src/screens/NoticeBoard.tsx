import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Bell, Calendar, ChevronRight, Info, Send, Plus, Trash2, CheckCircle2, Clock, Link as LinkIcon, AlertCircle, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notifyNewNotice } from '../services/notificationService';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCacheData, setCacheData } from '../lib/cacheDB';

interface NoticeBoardProps {
  onBack: () => void;
}

interface Message {
  id: string;
  sender: string;
  role: 'CR' | 'Student';
  content: string;
  timestamp: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  deadline: string;
  status: 'pending' | 'done';
}

interface DeptNotice {
  id: string;
  title: string;
  date: string;
  link: string;
}

export function NoticeBoard({ onBack }: NoticeBoardProps) {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('section');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deptNotices, setDeptNotices] = useState<DeptNotice[]>([]);

  const isCR = hasRole('CR') || hasRole('Admin');

  useEffect(() => {
    getCacheData<Message[]>('noticeboard_messages').then(data => {
      if (data && messages.length === 0) setMessages(data);
    });
    
    const q = query(collection(db, 'section_notices'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
         if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
             const data = change.doc.data();
             if (data.authorId !== user?.id) {
                 notifyNewNotice(`${data.role} ${data.sender}`, data.content);
             }
         }
      });
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
      } as Message));
      setMessages(data);
      setCacheData('noticeboard_messages', data);
    });
  }, [user?.id]);

  useEffect(() => {
    getCacheData<Assignment[]>('noticeboard_assignments').then(data => {
      if (data && assignments.length === 0) setAssignments(data);
    });

    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
         if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
             const data = change.doc.data();
             if (data.authorId !== user?.id) {
                 notifyNewNotice(`New Assignment: ${data.course}`, data.title);
             }
         }
      });
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(data);
      setCacheData('noticeboard_assignments', data);
    });
  }, [user?.id]);

  useEffect(() => {
    getCacheData<DeptNotice[]>('noticeboard_dept').then(data => {
      if (data && deptNotices.length === 0) setDeptNotices(data);
    });
    
    const q = query(collection(db, 'dept_notices'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
         if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
             const data = change.doc.data();
             if (data.authorId !== user?.id) {
                 notifyNewNotice(`Department Notice`, data.title);
             }
         }
      });
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeptNotice));
      setDeptNotices(data);
      setCacheData('noticeboard_dept', data);
    });
  }, [user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isCR || !user?.id) return;
    const content = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, 'section_notices'), {
        sender: user?.displayName || user?.fullName || 'Admin',
        role: hasRole('CR') ? 'CR' : 'Admin',
        content,
        authorId: user.id,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      alert('Failed to send notice');
    }
  };

  const toggleAssignmentStatus = async (id: string) => {
    const asgn = assignments.find(a => a.id === id);
    if (!asgn) return;
    try {
      await updateDoc(doc(db, 'assignments', id), {
        status: asgn.status === 'pending' ? 'done' : 'pending'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!isCR || !isEditMode) return;
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!isCR || !isEditMode) return;
    try {
      await deleteDoc(doc(db, 'dept_notices', id));
    } catch (error) {
      console.error(error);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', course: '', deadline: '' });

  const handleAddAssignment = async () => {
    if (!newAssignment.title || !newAssignment.course || !newAssignment.deadline || !user?.id) return;
    try {
      await addDoc(collection(db, 'assignments'), {
        title: newAssignment.title,
        course: newAssignment.course,
        deadline: newAssignment.deadline,
        status: 'pending',
        authorId: user.id,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewAssignment({ title: '', course: '', deadline: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to add assignment');
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors overflow-hidden">
      <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Bell size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-tight">Varendra Hub</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Notice & Deadlines</p>
              </div>
            </div>
          </div>

          {isCR && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isEditMode 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500'
              }`}
            >
              <Edit3 size={14} />
              {isEditMode ? 'Finish Editing' : 'Edit Mode'}
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-2 mt-4 pb-2">
          {[
            { id: 'section', label: 'Section Notice' },
            { id: 'dept', label: 'Department' },
            { id: 'assignments', label: 'Assignments' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-[9px] whitespace-nowrap font-black uppercase tracking-widest transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md transform -translate-y-0.5' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar relative p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'section' && (
            <motion.div 
               key="section"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full flex flex-col"
            >
               <div className="flex-1 space-y-4 pb-20">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col items-start max-w-[85%] group">
                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 ml-4 flex items-center gap-1">
                          {msg.role} • {msg.sender}
                       </span>
                       <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl rounded-tl-lg shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{msg.content}</p>
                          <span className="block text-[8px] text-slate-400 mt-2 text-right font-bold">{msg.timestamp}</span>
                       </div>
                    </div>
                  ))}
               </div>

               {isCR && isEditMode && (
                  <div className="fixed bottom-24 left-6 right-6 flex gap-3 p-3 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 z-50 transition-colors">
                     <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Post a section update..."
                        className="flex-1 bg-transparent px-4 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none"
                     />
                     <button 
                        onClick={handleSendMessage}
                        className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-indigo-500/20"
                     >
                        <Send size={18} />
                     </button>
                  </div>
               )}
               {(!isCR || !isEditMode) && (
                  <div className="fixed bottom-24 left-6 right-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-3">
                     <AlertCircle size={16} className="text-amber-500" />
                     <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Only CR can post updates here</p>
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'dept' && (
            <motion.div 
               key="dept"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-4 pb-32"
            >
               {deptNotices.map((notice) => (
                 <div 
                   key={notice.id} 
                   className="block bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 hover:border-indigo-200 group transition-all"
                 >
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                          Department
                       </span>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{notice.date}</span>
                          {isCR && isEditMode && (
                             <button 
                                onClick={() => deleteNotice(notice.id)}
                                className="text-rose-500 active:scale-90"
                             >
                                <Trash2 size={14} />
                             </button>
                          )}
                       </div>
                    </div>
                    <a href={notice.link} className="block group">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug group-hover:text-indigo-500 transition-colors">
                          {notice.title}
                       </h4>
                       <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <LinkIcon size={12} className="text-indigo-500" />
                          View Attachment
                       </div>
                    </a>
                 </div>
               ))}

               {(!isCR || !isEditMode) && (
                  <div className="fixed bottom-24 left-6 right-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-3">
                     <AlertCircle size={16} className="text-amber-500" />
                     <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Only CR can post updates here</p>
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div 
               key="assignments"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-4 pb-32"
            >
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Tracker</h3>
                 {isCR && isEditMode && (
                    <button 
                     onClick={() => setShowAddModal(true)}
                     className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                    >
                      <Plus size={14} /> Add New
                    </button>
                 )}
              </div>

              {assignments.sort((a, b) => a.status === 'done' ? 1 : -1).map((asgn) => (
                <div 
                   key={asgn.id}
                   className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border transition-all ${
                     asgn.status === 'done' 
                     ? 'border-emerald-100 dark:border-emerald-900/30 opacity-70' 
                     : 'border-slate-50 dark:border-slate-800'
                   }`}
                >
                   <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                         <h4 className={`text-base font-black tracking-tight leading-tight mb-1 ${asgn.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                           {asgn.title}
                         </h4>
                         <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">{asgn.course}</p>
                         
                         <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                              asgn.status === 'done' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500' 
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                            }`}>
                               {asgn.status === 'done' ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <Clock size={12} />}
                               <span className="text-[10px] font-black uppercase tracking-widest">{asgn.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                               <Calendar size={12} /> {asgn.deadline}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <button 
                        onClick={() => toggleAssignmentStatus(asgn.id)}
                        className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                          asgn.status === 'done' 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700' 
                            : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                         {asgn.status === 'done' ? 'Reopen Task' : 'Mark as Done'}
                      </button>
                      
                      {isCR && isEditMode && (
                        <button 
                          onClick={() => deleteAssignment(asgn.id)}
                          className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      )}
                   </div>
                </div>
              ))}

              {(!isCR || !isEditMode) && (
                  <div className="fixed bottom-24 left-6 right-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-3">
                     <AlertCircle size={16} className="text-amber-500" />
                     <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Only CR can post updates here</p>
                  </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Assignment Modal */}
        <AnimatePresence>
           {showAddModal && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 pb-24">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative z-10 border border-slate-50 dark:border-slate-800"
                >
                   <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-8">Add New Deadline</h3>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Title</label>
                         <input 
                            placeholder="Assignment Name"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 border border-transparent dark:text-slate-100"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Course</label>
                         <input 
                            placeholder="Course Code"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 border border-transparent dark:text-slate-100"
                            value={newAssignment.course}
                            onChange={(e) => setNewAssignment({...newAssignment, course: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Deadline Date</label>
                         <input 
                            type="date"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 border border-transparent dark:text-slate-100"
                            value={newAssignment.deadline}
                            onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
                         />
                      </div>
                      <div className="flex gap-3 mt-8">
                         <button 
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest"
                         >
                            Cancel
                         </button>
                         <button 
                            onClick={handleAddAssignment}
                            className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                         >
                            Save Deadline
                         </button>
                      </div>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </main>

      <div className="h-20" />
    </div>
  );
}
