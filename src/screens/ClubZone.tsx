/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Users, ChevronRight, PlusCircle, User, Star, 
  Calendar, MapPin, Edit3, Trash2, Image as ImageIcon, 
  MoreVertical, AlertCircle, CheckCircle2, Plus, X, ListFilter,
  Target, Upload, History
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Club, ClubEvent } from '../types';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebase';

const INITIAL_CLUBS: Club[] = [
  { 
    id: '1', 
    name: 'Web Development Club (VUWDC)', 
    description: 'Focusing on modern web technologies and full-stack development.',
    about: 'Join us to build amazing projects and compete in competitions. We focus on innovation and leadership in the web space.',
    iconColor: 'bg-blue-100 text-blue-500',
    bannerUrl: '/assets/images/banner.vuwdc.png',
    logoUrl: '/assets/images/logo.vuwdc.png',
    leader: { name: 'Sabbir Hossain Refat', role: 'CD', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Md. Nour Noby', designation: 'Club Mentor', imageUrl: '' }
  },
  { 
    id: '2', 
    name: 'CSE Sports Club', 
    description: 'Promoting physical activities and organizing sports events.',
    about: 'The sports club is dedicated to improving student health and organizing annual tournaments.',
    iconColor: 'bg-emerald-100 text-emerald-500',
    bannerUrl: '/assets/images/banner.csesc.png',
    logoUrl: '/assets/images/logo.csesc.png',
    fbPageId: '61573761815516',
    leader: { name: 'Abu Raihan Kawsar', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Md. Nour Noby', designation: 'Club Advisor', imageUrl: '' }
  },
  { 
    id: '3', 
    name: 'Robotics Society, Varendra University (RSVU)', 
    description: 'Innovating the future through robotics and automation.',
    about: 'RSVU is the home for roboticists to explore hardware and AI.',
    iconColor: 'bg-amber-100 text-amber-500',
    bannerUrl: '/assets/images/banner.rsvu.png',
    logoUrl: '/assets/images/logo.rsvu.png',
    fbPageId: '61582446895160',
    leader: { name: 'Mobashshir Shahriar Arnab', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Alamin Hossain Pappu', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '4',
    name: 'Chhotto Swapna',
    description: 'Empowering dreams and creating opportunities for all.',
    about: 'Working towards a better future for children and the community through volunteer work and education.',
    iconColor: 'bg-rose-100 text-rose-500',
    bannerUrl: '/assets/images/banner.chhotto.png',
    logoUrl: '/assets/images/logo.chhotto.png',
    leader: { name: 'Nur A Zannat Puli', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Umme Salma Nahida', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '5',
    name: 'Varendra University Programming Club (VUPC)',
    description: 'Coding the future, one algorithm at a time.',
    about: 'VUPC is dedicated to fostering programming and problem-solving skills among students through contests and workshops.',
    iconColor: 'bg-blue-100 text-blue-500',
    bannerUrl: '/assets/images/banner.vupc.png',
    logoUrl: '/assets/images/logo.vupc.png',
    fbPageId: '61576290690283',
    leader: { name: 'Iskiak Ahmed', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Tanveer Ahmed Likhon', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '6',
    name: 'Varendra University Research Club (VURC)',
    description: 'Fostering a culture of academic and applied research.',
    about: 'A platform for students and faculty to collaborate on innovative research projects across various disciplines.',
    iconColor: 'bg-emerald-100 text-emerald-500',
    bannerUrl: '/assets/images/banner.vurc.png',
    logoUrl: '/assets/images/logo.vurc.png',
    fbPageId: '61564749554053',
    leader: { name: 'Sadekatul Shihab', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Dr. A.H.M. Rahmatullah Imon', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '7',
    name: 'Varendra University Science Club (VUSC)',
    description: 'Exploring the wonders of science and its applications.',
    about: 'VUSC aims to spread scientific awareness and encourage participation in science fairs, projects, and discussions.',
    iconColor: 'bg-purple-100 text-purple-500',
    bannerUrl: '/assets/images/banner.vusc.png',
    logoUrl: '/assets/images/logo.vusc.png',
    fbPageId: '61562186162655',
    leader: { name: 'Mobashshir Shahriar Arnab', role: 'President', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Umme Salma Nahida', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '8',
    name: 'Hult Prize at Varendra University',
    description: 'Leading a generation to change the world.',
    about: 'Organizing the annual Hult Prize on-campus event to challenge students to solve pressing social issues through entrepreneurship.',
    iconColor: 'bg-pink-100 text-pink-500',
    bannerUrl: '/assets/images/banner.hpvu.png',
    logoUrl: '/assets/images/logo.hpvu.png',
    fbPageId: '100067982506528',
    leader: { name: 'Md. Sohel Parvez', role: 'Campus Director', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Zuairia Raisa Bintay Makin', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '9',
    name: 'BDapps Varendra University Chapter',
    description: 'Creating the next big mobile applications.',
    about: 'A community for developers to build, launch, and monetize applications using BDapps resources and mentorship.',
    iconColor: 'bg-orange-100 text-orange-500',
    bannerUrl: '/assets/images/banner.bdapps.png',
    logoUrl: '/assets/images/logo.bdapps.png',
    fbPageId: '61559818112639',
    leader: { name: 'Farhan Ahmed', role: 'Campus Ambassador', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Mafikul Islam', designation: 'Mentor', imageUrl: '' }
  },
  {
    id: '10',
    name: 'BASIS Students’ Forum – Varendra University Chapter',
    description: 'Bridging the gap between academia and the IT industry.',
    about: 'Empowering students with industry knowledge, networking opportunities, and skills required for the IT sector.',
    iconColor: 'bg-indigo-100 text-indigo-500',
    bannerUrl: '/assets/images/banner.basis.png',
    logoUrl: '/assets/images/logo.basis.png',
    fbPageId: '100083123420515',
    leader: { name: 'Md. Manowar Hossain Saykat', role: 'Lead', imageUrl: '/assets/images/profile.png' },
    mentor: { name: 'Md. Nour Noby', designation: 'Mentor', imageUrl: '' }
  }
];

const INITIAL_EVENTS: ClubEvent[] = [
  { 
    id: 'e1', 
    clubId: '3', 
    clubName: 'Robotics Society (RSVU)',
    title: 'Line Follower Contest', 
    description: 'Competitive robotics event for everyone.', 
    date: '2026-04-15T10:00:00', 
    location: 'Auditorium',
    type: 'Upcoming' 
  },
  { 
    id: 'e2', 
    clubId: '1', 
    clubName: 'Web Development Club (VUWDC)',
    title: 'JS Workshop 2026', 
    description: 'A deep dive into JavaScript internals.', 
    date: '2026-05-10T14:00:00', 
    location: 'Lab 302',
    type: 'Upcoming' 
  },
  { 
    id: 'e3', 
    clubId: '2', 
    clubName: 'CSE Sports Club',
    title: 'Final Cricket Match 2025', 
    description: 'Annual inter-batch cricket tournament.', 
    date: '2025-12-25T09:00:00', 
    location: 'University Ground',
    type: 'Previous' 
  }
];

interface ClubZoneProps {
  onBack: () => void;
}

export function ClubZone({ onBack }: ClubZoneProps) {
  const { hasRole, user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('My Club');
// ... (Rest of existing code)

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [myClubIds, setMyClubIds] = useState<string[]>([]);
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [showDeleteClubModal, setShowDeleteClubModal] = useState(false);
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Club>>({});
  const [newClubName, setNewClubName] = useState('');

  // Event Detail View Component
  function EventDetailView({ event, onBack }: { event: ClubEvent, onBack: () => void }) {
    return (
       <div className="min-h-screen bg-transparent p-6 pb-32">
          <button onClick={onBack} className="mb-6 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
             <ChevronLeft size={20} />
          </button>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm">
             <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-4">{event.title}</h1>
             <img src={event.imageUrl || '/assets/images/banner.rsvu.png'} alt="Event Banner" className="w-full h-64 object-cover rounded-[2rem] mb-6" referrerPolicy="no-referrer" />
             <p className="text-slate-600 dark:text-slate-300 mb-6">{event.description}</p>
             <div className="flex items-center gap-4 mb-6 flex-wrap">
               <button 
                 onClick={() => {
                   const uids = event.interestedUids || [];
                   const newUids = uids.includes(user?.id || '') ? uids.filter(uid => uid !== user?.id) : [...uids, user?.id || ''];
                   setDoc(doc(db, `clubs/${event.clubId}/events`, event.id), { 
                     ...event,
                     interestedUids: newUids 
                   }, { merge: true });
                 }}
                 className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${event.interestedUids?.includes(user?.id || '') ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}
               >
                 Interested ({event.interestedUids?.length || 0})
               </button>
               {event.isFbPost && event.details && (
                 <a 
                   href={event.details}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-[#1877F2] text-white flex items-center gap-2 shadow-lg shadow-[#1877F2]/30 hover:scale-105 active:scale-95"
                 >
                   <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                   View on Facebook
                 </a>
               )}
             </div>
             <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                     <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(event.date).toLocaleTimeString()}</p>
                 </div>
                 <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Place</p>
                     <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{event.location}</p>
                 </div>
             </div>
             <button 
                onClick={() => {
                   const club = clubs.find(c => c.id === event.clubId);                
                   if (club) {
                       setSelectedClub(club);
                       setSelectedEvent(null);
                   }
                }}
                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic hover:underline"
             >
                Organized by: {event.clubName}
             </button>
          </div>
       </div>
    );
  }

  // ...
  // Event Detail View Component defined at 188

  // Removed lines 226-228 which were an early return
  
  // ... (Inside selectedClub block in JSX, replace event card mapping)

// Add EventDetailView in ClubZone.tsx (need to handle event navigation and data)
// ...

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      
      const mergedClubs = [...INITIAL_CLUBS];
      clubsData.forEach(newClub => {
         const index = mergedClubs.findIndex(c => c.id === newClub.id);
         if (index !== -1) {
            mergedClubs[index] = { ...mergedClubs[index], ...newClub };
         } else {
            mergedClubs.push(newClub);
         }
      });
      setClubs(mergedClubs);
    }, (error) => {
      handleFirestoreError(error, 'list', 'clubs');
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    let active = true;
    const fetchAllFbEvents = async () => {
       const accessToken = (import.meta as any).env.VITE_FB_ACCESS_TOKEN || '875778775541481|d9260bee2f1002ffd89c8b326f70f9d4';
       
       const promises = INITIAL_CLUBS.filter(c => c.fbPageId).map(async (club) => {
         try {
           const url = `https://graph.facebook.com/v19.0/${club.fbPageId}/posts?fields=message,full_picture,permalink_url,created_time&limit=20&access_token=${accessToken}`;
           const res = await fetch(url);
           const data = await res.json();
           
           if (data.error) {
             console.error(`FB API Error for ${club.name}:`, data.error.message);
             return [];
           }
           
           if (data.data) {
             return data.data
               .filter((post: any) => post.message || post.full_picture)
               .slice(0, 5)
               .map((post: any) => ({
                 id: post.id,
                 clubId: club.id,
                 clubName: club.name,
                 title: post.message ? post.message.split('\n')[0].substring(0, 40) + '...' : 'Photo Update',
                 description: post.message || 'Latest photo from ' + club.name,
                 date: post.created_time,
                 location: 'Facebook Page',
                 imageUrl: post.full_picture,
                 type: 'Previous',
                 details: post.permalink_url || `https://facebook.com/${post.id}`,
                 interestedUids: [],
                 isFbPost: true
             }));
           }
         } catch(e) { 
           console.error('Fetch error:', e);
         }
         return [];
       });

       const results = await Promise.all(promises);
       const allFbEvents = results.flat();
       
       if (active) {
          setEvents(prev => {
             const manualEvents = prev.filter(e => !(e as any).isFbPost);
             // Remove initial demo events if we want ONLY real data
             const realEvents = manualEvents.filter(e => !e.id.startsWith('e'));
             return [...realEvents, ...allFbEvents];
          });
       }
    };
    fetchAllFbEvents();
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (user?.myClubs) {
      setMyClubIds(user.myClubs);
    }
  }, [user?.myClubs]);

  const isAdmin = hasRole('Admin');
  const isClubLeader = hasRole('Club Leader');

  const myClubs = useMemo(() => clubs.filter(c => myClubIds.includes(c.id)), [clubs, myClubIds]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const previousEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date) < new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  const toggleMyClub = async (id: string) => {
    if (!user) return;
    const newMyClubs = myClubIds.includes(id) ? myClubIds.filter(cid => cid !== id) : [...myClubIds, id];
    setMyClubIds(newMyClubs);
    try {
      await updateProfile({ myClubs: newMyClubs });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteClub = async (id: string) => {
    if (!hasRole('Admin')) return;
    try {
        await deleteDoc(doc(db, 'clubs', id));
        setIsAdminMenuOpen(false);
    } catch (error) {
        handleFirestoreError(error, 'delete', `clubs/${id}`);
    }
  };

  if (selectedEvent) {
    return <EventDetailView event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  const handleAddClub = async () => {
    if (!hasRole('Admin')) return;
    if (!newClubName) return;
    const newClub: Omit<Club, 'id'> = {
      name: newClubName,
      description: 'New club added by admin.',
      iconColor: 'bg-slate-100 text-slate-500',
      about: 'No details yet.',
    };
    try {
        await addDoc(collection(db, 'clubs'), newClub);
        setNewClubName('');
        setShowAddClubModal(false);
        setIsAdminMenuOpen(false);
    } catch (error) {
        handleFirestoreError(error, 'create', 'clubs');
    }
  };

  const handleUpdateClub = async () => {
    if (selectedClub && editFormData) {
      try {
          await updateDoc(doc(db, 'clubs', selectedClub.id), editFormData);
          setSelectedClub({ ...selectedClub, ...editFormData });
          setIsEditingClub(false);
      } catch (error) {
          handleFirestoreError(error, 'update', `clubs/${selectedClub.id}`);
      }
    }
  };

  if (selectedClub) {
    const isThisClubLeader = isClubLeader && selectedClub.leader?.leaderUid === user?.id;
    const canEdit = isAdmin || isThisClubLeader;
    
    return (
      <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors overflow-x-hidden">
        <div className="relative h-64 overflow-hidden">
          <div className={`absolute inset-0 ${selectedClub.iconColor.split(' ')[0].replace('100', '500')} opacity-80`} />
          {selectedClub.bannerUrl && (
            <img 
              src={selectedClub.bannerUrl} 
              alt="Club Banner" 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl border border-white/30 overflow-hidden"
             >
                 {selectedClub.logoUrl ? (
                  <img src={selectedClub.logoUrl} alt="Club Logo" className="w-full h-full object-cover" />
                ) : (
                  <Users size={40} />
                )}
             </motion.div>
             <h1 className="text-2xl font-black mb-2 tracking-tight drop-shadow-lg uppercase">{selectedClub.name}</h1>
          </div>

          <button 
            onClick={() => setSelectedClub(null)}
            className="absolute top-12 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>

          {canEdit && (
            <button 
              onClick={() => {
                setEditFormData(selectedClub);
                setIsEditingClub(true);
              }}
              className="absolute top-12 right-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white active:scale-90 transition-transform"
            >
              <Edit3 size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 bg-transparent dark:bg-transparent -mt-12 rounded-t-[3.5rem] p-8 pb-32 relative z-10 transition-colors shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
           <button 
             onClick={() => toggleMyClub(selectedClub.id)}
             className={`w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-2 mb-10 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${
               myClubIds.includes(selectedClub.id)
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
             }`}
           >
              {myClubIds.includes(selectedClub.id) ? (
                <>
                  <Trash2 size={18} />
                  Leave Club
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  Add To My Club
                </>
              )}
           </button>

           <AnimatePresence>
             {isEditingClub && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 mb-10 border-2 border-indigo-500 shadow-xl"
               >
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                       <Edit3 size={14} /> Update Club Info
                    </h3>
                    <button onClick={() => setIsEditingClub(false)} className="text-slate-400 hover:text-rose-500">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About Club</label>
                       <textarea 
                         value={editFormData.about}
                         onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                         className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 border-none mt-1 h-24 no-scrollbar"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Image URL</label>
                       <div className="flex items-center gap-2 mt-1">
                         <input 
                           value={editFormData.bannerUrl || ''}
                           onChange={(e) => setEditFormData({ ...editFormData, bannerUrl: e.target.value })}
                           className="flex-1 w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 border-none"
                           placeholder="https://... or /banner.rsvu.png"
                         />
                         <label className="shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-500 cursor-pointer active:scale-95 transition-transform">
                            <Upload size={18} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    setEditFormData(prev => ({ ...prev, bannerUrl: URL.createObjectURL(file) }));
                                 }
                              }} 
                            />
                         </label>
                       </div>
                    </div>

                    <div className="pt-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Club Logo URL</label>
                       <div className="flex items-center gap-2 mt-1">
                         <input 
                           value={editFormData.logoUrl || ''}
                           onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                           className="flex-1 w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 border-none"
                           placeholder="https://... or /logo.rsvu.png"
                         />
                         <label className="shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-500 cursor-pointer active:scale-95 transition-transform">
                            <Upload size={18} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    setEditFormData(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
                                 }
                              }} 
                            />
                         </label>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                       <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Mentor Details</h4>
                       <div className="space-y-3">
                          <input 
                            placeholder="Mentor Name"
                            value={editFormData.mentor?.name || ''}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              mentor: { ...(editFormData.mentor || { name: '', designation: '' }), name: e.target.value } 
                            })}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none border-none"
                          />
                          <input 
                            placeholder="Mentor Image URL"
                            value={editFormData.mentor?.imageUrl || ''}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              mentor: { ...(editFormData.mentor || { name: '', designation: '' }), imageUrl: e.target.value } 
                            })}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none border-none"
                          />
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                       <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Leader Details</h4>
                       <div className="space-y-3">
                          <input 
                            placeholder="Leader Name"
                            value={editFormData.leader?.name || ''}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              leader: { ...(editFormData.leader || { name: '', role: '' }), name: e.target.value } 
                            })}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none border-none"
                          />
                          <input 
                            placeholder="Role (CA/CD/President)"
                            value={editFormData.leader?.role || ''}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              leader: { ...(editFormData.leader || { name: '', role: '' }), role: e.target.value } 
                            })}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none border-none"
                          />
                          <input 
                            placeholder="Leader Image URL"
                            value={editFormData.leader?.imageUrl || ''}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              leader: { ...(editFormData.leader || { name: '', role: '' }), imageUrl: e.target.value } 
                            })}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none border-none"
                          />
                       </div>
                    </div>

                    <div className="pt-6">
                       <button 
                         onClick={handleUpdateClub}
                         className="w-full py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-indigo-600/20"
                       >
                         Save All Changes
                       </button>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="space-y-12">
              <section>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">About Club</h3>
                 <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
                    {selectedClub.about || selectedClub.description}
                 </p>
              </section>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Leadership</h3>
                 </div>
                 <div className="space-y-4">
                    {/* Mentor Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                       <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center text-amber-500 overflow-hidden border border-amber-100 dark:border-amber-900/30">
                          {selectedClub.mentor?.imageUrl ? (
                             <img src={selectedClub.mentor.imageUrl} alt="Mentor" className="w-full h-full object-cover" />
                          ) : (
                             <User size={28} />
                          )}
                       </div>
                       <div>
                          <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest mb-1.5">Club Mentor</p>
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{selectedClub.mentor?.name || 'Prof. Sarah Jenkins'}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Faculty Member</p>
                       </div>
                    </div>
                    {/* Leader Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                       <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl flex items-center justify-center text-indigo-500 overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
                          {selectedClub.leader?.imageUrl ? (
                             <img src={selectedClub.leader.imageUrl} alt="Leader" className="w-full h-full object-cover" />
                          ) : (
                             <Star size={28} />
                          )}
                       </div>
                       <div>
                          <p className="text-[8px] text-indigo-500 font-black uppercase tracking-widest mb-1.5">{selectedClub.leader?.role || 'President'}</p>
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{selectedClub.leader?.name || 'Rafid Ahmed'}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Student, VU</p>
                       </div>
                    </div>
                 </div>
              </section>

              <section>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" /> Upcoming Events
                 </h3>
                 <div className="space-y-4">
                   {events.filter(e => e.clubId === selectedClub.id && new Date(e.date) >= new Date()).map(event => (
                      <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
                   ))}
                   {events.filter(e => e.clubId === selectedClub.id && new Date(e.date) >= new Date()).length === 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-6">No upcoming events</p>
                   )}
                 </div>
              </section>

              <section>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <History size={14} className="text-[#1877F2]" /> Facebook Activities & Updates
                 </h3>
                 <div className="space-y-4 opacity-90">
                   {events.filter(e => e.clubId === selectedClub.id && new Date(e.date) < new Date()).map(event => (
                      <EventCard key={event.id} event={event} minimal onClick={() => setSelectedEvent(event)} />
                   ))}
                   {events.filter(e => e.clubId === selectedClub.id && new Date(e.date) < new Date()).length === 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No records found</p>
                   )}
                 </div>
              </section>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors">
      <header className="p-6 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Club Zone</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Connect & Evolve</p>
            </div>
          </div>
        </div>

        {isAdmin && activeTab === 'All Clubs' && (
          <button 
            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${isAdminMenuOpen ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 shadow-sm'}`}
          >
            <MoreVertical size={20} />
          </button>
        )}
      </header>

      {/* Admin Quick Menu Popup */}
      <AnimatePresence>
        {isAdminMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col min-w-[160px]"
          >
            <button 
              onClick={() => {
                setShowAddClubModal(true);
                setIsAdminMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
            >
              <PlusCircle size={16} /> Add Club
            </button>
            <button 
              onClick={() => {
                setShowDeleteClubModal(true);
                setIsAdminMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
            >
              <Trash2 size={16} /> Delete Club
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddClubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl"
            >
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-6">Create New Club</h2>
              <div className="space-y-4">
                <input 
                  autoFocus
                  placeholder="Club Name"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowAddClubModal(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddClub}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteClubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl max-h-[80vh] flex flex-col"
            >
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-6">Delete Club</h2>
              <div className="space-y-2 overflow-y-auto no-scrollbar flex-1">
                 {clubs.map(club => (
                    <button 
                      key={club.id}
                      onClick={() => {
                        deleteClub(club.id);
                        setShowDeleteClubModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    >
                      <span className="text-xs font-bold">{club.name}</span>
                      <Trash2 size={16} />
                    </button>
                 ))}
              </div>
              <button 
                onClick={() => setShowDeleteClubModal(false)}
                className="w-full py-4 mt-6 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="px-6 mt-8">
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex transition-colors">
          {['My Club', 'All Clubs', 'Events'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-lg' 
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-6 mt-8 space-y-4 overflow-y-auto no-scrollbar pb-32">
        {activeTab === 'My Club' && (
           <div className="space-y-4">
              {myClubs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-800">
                      <Star size={32} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">No Club Joined Yet</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Explore clubs and click join!</p>
                   </div>
                   <button 
                    onClick={() => setActiveTab('All Clubs')}
                    className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                   >
                     Find Clubs
                   </button>
                </div>
              ) : (
                myClubs.map(club => (
                  <ClubCard key={club.id} club={club} onClick={() => setSelectedClub(club)} />
                ))
              )}
           </div>
        )}

        {activeTab === 'All Clubs' && (
           <div className="space-y-4">
              {clubs.map(club => (
                <ClubCard key={club.id} club={club} onClick={() => setSelectedClub(club)} />
              ))}
           </div>
        )}

        {activeTab === 'Events' && (
           <div className="space-y-10">
              <section>
                 <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 w-fit px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                    <Target size={14} /> Upcoming Events
                 </h3>
                 <div className="space-y-4">
                    {upcomingEvents.map(event => (
                       <EventCard 
                         key={event.id} 
                         event={event} 
                         onClick={() => setSelectedEvent(event)} 
                       />
                    ))}
                 </div>
              </section>

              <section>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <History size={14} className="text-[#1877F2]" /> Facebook Activities & Updates
                 </h3>
                 <div className="space-y-4">
                    {previousEvents.map(event => (
                       <EventCard key={event.id} event={event} minimal onClick={() => setSelectedEvent(event)} />
                    ))}
                 </div>
              </section>
           </div>
        )}
      </main>

      <div className="h-20" />
    </div>
  );
}

function ClubCard({ club, onClick }: { club: Club, onClick: () => void, key?: React.Key }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col shadow-sm border border-slate-50 dark:border-slate-800 group hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all cursor-pointer overflow-hidden relative"
    >
      <div className="h-24 w-full relative">
        <div className={`absolute inset-0 ${club.iconColor.split(' ')[0].replace('100', '500')} opacity-80`} />
        {club.bannerUrl && (
          <img 
            src={club.bannerUrl} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      <div className="p-5 flex items-start gap-4">
        <div className={`w-14 h-14 -mt-8 shrink-0 ${club.iconColor.split(' ')[0]} dark:bg-slate-800 rounded-2xl flex items-center justify-center ${club.iconColor.split(' ')[1]} shadow-lg overflow-hidden border-2 border-white dark:border-slate-900 z-10 relative`}>
          {club.logoUrl ? (
            <img src={club.logoUrl} alt="Logo" className="w-full h-full object-cover bg-white" />
          ) : (
            <Users size={28} />
          )}
        </div>
        <div className="flex-1 min-w-0 -mt-1 pt-0.5">
          <h4 className="font-black text-slate-800 dark:text-slate-100 text-[13px] tracking-tight uppercase leading-tight line-clamp-1">{club.name}</h4>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1.5 line-clamp-2">{club.description.length > 75 ? club.description.substring(0, 75) + '...' : club.description}</p>
        </div>
        <div className="w-8 h-8 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors ml-2 mt-1">
          <ChevronRight size={16} />
        </div>
      </div>
    </motion.div>
  );
}

function EventCard({ event, onClick, minimal = false }: { event: ClubEvent, onClick?: () => void, minimal?: boolean, key?: React.Key }) {
  const { user } = useAuth();

  const toggleInterested = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const uids = event.interestedUids || [];
    const newUids = uids.includes(user.id) ? uids.filter(uid => uid !== user.id) : [...uids, user.id];
    
    try {
        await setDoc(doc(db, `clubs/${event.clubId}/events`, event.id), { 
          ...event,
          interestedUids: newUids 
        }, { merge: true });
    } catch (error) {
        handleFirestoreError(error, 'update', `clubs/${event.clubId}/events/${event.id}`);
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-indigo-100' : ''}`}
    >
       {!minimal && <div className="absolute top-0 right-0 p-4 opacity-5"><Calendar size={80} /></div>}
       <div className="relative z-10 flex gap-4 items-center">
          {event.imageUrl && (
             <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
               <img src={event.imageUrl} alt="Visual" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             </div>
          )}
          <div className="flex-1">
             <div className="flex items-start justify-between mb-2">
                <h4 className={`font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase ${minimal ? 'text-xs line-clamp-2' : 'text-sm'}`}>{event.title}</h4>
                {!minimal && (
                  <button 
                    onClick={toggleInterested}
                    className={`shrink-0 ml-4 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${event.interestedUids?.includes(user?.id || '') ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'}`}
                  >
                    Interested ({event.interestedUids?.length || 0})
                  </button>
                )}
             </div>
             <p className="text-indigo-500 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-[0.2em] mb-4">{event.clubName}</p>
             <div className={`flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest ${minimal ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>
                <span className="flex items-center gap-1.5"><Calendar size={12} className={minimal ? 'text-slate-400' : 'text-emerald-500'} /> {new Date(event.date).toLocaleDateString()}</span>
                {!minimal && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-rose-500" /> {event.location}</span>}
                {event.isFbPost && event.details && (
                   <a 
                     href={event.details}
                     target="_blank"
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()}
                     className="ml-auto px-3 py-1.5 rounded-lg bg-[#1877F2]/10 dark:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#4B93FF] flex items-center gap-1.5 hover:bg-[#1877F2]/20 dark:hover:bg-[#1877F2]/30 transition-colors"
                   >
                     <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                     VIEW ON FACEBOOK
                   </a>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}


