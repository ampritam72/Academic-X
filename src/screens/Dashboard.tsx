/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, ChevronDown, Edit3, BookOpen, Clock, Sparkles, PieChart, Hash, UserCircle, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_CARDS } from '../constants';
import { getRoutineForDay, getRoutineForSemester } from '../services/routineService';
import { getRolesForStudent } from '../lib/chatService';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, updateProfile } = useAuth();
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"
      
      const urgent = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((asgn: any) => asgn.deadline === tomorrowStr);
        
      setUpcomingReminders(urgent);
    });
  }, []);

  useEffect(() => {
    async function loadTodayRoutine() {
      if (!user) return;
      const sem = user.semester || '7th'; 
      const sec = user.section || 'B';
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let todayStr = dayNames[new Date().getDay()];
      // Default to Sunday if weekend to show something useful
      if (todayStr === 'Fri' || todayStr === 'Sat') todayStr = 'Sun';
      
      await getRoutineForSemester(sem);
      const classes = getRoutineForDay(todayStr, sem, sec);
      setTodayClasses(classes);
    }
    loadTodayRoutine();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 transition-colors">
      {/* Top Bar */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl z-30 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Hello, {user.fullName.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium tracking-tight">Let's achieve greatness today</p>
        </div>
        <button 
          onClick={() => onNavigate('/profile')}
          className="relative cursor-pointer hover:scale-105 transition-transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/images/profile.png';
                }}
              />
            ) : (
              <img 
                src="/assets/images/profile.png" 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('profile.png') && user.fullName) {
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
                  }
                }}
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-0.5 rounded-full shadow-sm">
            <div className="bg-emerald-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
        </button>
      </div>

      {/* 1-Day Deadline Reminder Banner */}
      <AnimatePresence>
        {upcomingReminders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="px-6 mb-6"
          >
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-5 rounded-[2rem] text-white shadow-xl shadow-rose-500/10 flex items-start gap-4 border border-rose-400/20">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-2 py-0.5 rounded-md">Urgent Alert</span>
                  <span className="text-[10px] font-bold opacity-90 uppercase tracking-wider">Due Tomorrow!</span>
                </div>
                <h4 className="text-sm font-black tracking-tight truncate leading-snug">
                  {upcomingReminders[0].type === 'ct' ? 'Class Test' : 'Assignment'}: {upcomingReminders[0].title}
                </h4>
                <p className="text-[10px] font-bold opacity-85 uppercase tracking-widest mt-0.5">
                  Course: {upcomingReminders[0].course}
                </p>
              </div>
              <button 
                onClick={() => onNavigate('/notices')}
                className="self-center bg-white/20 hover:bg-white/30 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shrink-0 active:scale-95"
              >
                View
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Card */}
      <div className="px-6 mb-8">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="glass-card rounded-[2rem] p-6 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl transition-colors">
                <Bell className="text-emerald-500 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Today's Schedule</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {todayClasses.length > 0 ? `${todayClasses.length} classes scheduled` : 'No classes today'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('/routine')}
              className="text-slate-400 dark:text-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {todayClasses.length > 0 ? (
              todayClasses.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-1.5 h-12 ${item.type === 'lab' ? 'bg-amber-500' : 'bg-cyan-500'} rounded-full shadow-lg`} />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.code}</h4>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium tracking-tight transition-colors">{item.time} • {item.room}</p>
                  </div>
                  <ChevronRight className="text-slate-200 dark:text-slate-800" size={16} />
                </div>
              ))
            ) : (
              <div className="py-2 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Free Day!</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Smart Study Suite Feature Card */}
      <div className="px-6 mb-8">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('/smart-study')}
          className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-xl shadow-indigo-500/20 relative group overflow-hidden"
        >
          <div className="text-left relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">AI Powered</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-1">Smart Study Suite</h2>
            <p className="text-[11px] font-bold text-indigo-100 opacity-80 uppercase tracking-widest">Notes • Planner • Mock Viva</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10">
            <ChevronRight size={24} />
          </div>
        </motion.button>
      </div>

      {/* Quick Access Grid */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Quick Access</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {DASHBOARD_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                whileTap={{ scale: 0.9 }}
                whileHover="hover"
                onClick={() => onNavigate(card.path)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`${card.color} p-3.5 rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-none relative group overflow-hidden transition-all duration-300 ring-1 ring-white/20 dark:ring-white/10 hover:scale-105`}>
                  <motion.div variants={{
                    hover: { 
                      scale: [1, 1.15, 1],
                      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                    }
                  }}>
                    <Icon className="text-white drop-shadow-md" size={24} strokeWidth={2.5} />
                  </motion.div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight text-center max-w-[64px] transition-colors">
                  {card.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Role-Based Special Dashboards */}
      {(user.roles.includes('CR') || user.roles.includes('Admin') || user.roles.includes('Club Leader')) && (
        <div className="px-6 mb-8">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 uppercase">Specialized Modes</h2>
          <div className="grid grid-cols-1 gap-4">
            {user.roles.includes('CR') && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/notices')}
                className="bg-indigo-600 p-6 rounded-[2.5rem] flex items-center justify-between text-white shadow-xl shadow-indigo-200 dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Edit3 size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black uppercase tracking-tight">CR Dashboard</h4>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Manage Section Updates</p>
                  </div>
                </div>
                <ChevronRight size={20} className="opacity-50" />
              </motion.button>
            )}

            {user.roles.includes('Club Leader') && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/clubs')}
                className="bg-purple-600 p-6 rounded-[2.5rem] flex items-center justify-between text-white shadow-xl shadow-purple-200 dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black uppercase tracking-tight">Club Leader Mode</h4>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Manage Events & Posts</p>
                  </div>
                </div>
                <ChevronRight size={20} className="opacity-50" />
              </motion.button>
            )}

            {user.roles.includes('Admin') && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/admin')}
                className="bg-slate-900 dark:bg-white p-6 rounded-[2.5rem] flex items-center justify-between text-white dark:text-slate-900 shadow-xl shadow-slate-200 dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 dark:bg-slate-100 rounded-2xl flex items-center justify-center">
                    <PieChart size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black uppercase tracking-tight">System Admin</h4>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Full Data Control</p>
                  </div>
                </div>
                <ChevronRight size={20} className="opacity-50" />
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Recent Activity</h2>
          <button 
            onClick={() => onNavigate('/recent-activities')}
            className="text-cyan-500 dark:text-cyan-400 font-bold text-[10px] uppercase tracking-widest p-2 active:scale-95 transition-transform"
          >
            SHOW ALL
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { 
              title: 'Data Structures Notes', 
              shortTitle: 'Data Structures N...',
              type: 'AI generated', 
              time: '2h ago', 
              icon: 'file',
              details: 'Generated a comprehensive study guide covering Arrays, Linked Lists, Trees, and Graph algorithms with code examples.'
            },
            { 
              title: 'Python Code Review', 
              shortTitle: 'Python Code Revi...',
              type: 'Explained', 
              time: '5h ago', 
              icon: 'code',
              details: 'The AI Assistant reviewed your Python script, identified performance bottlenecks in loops, and provided an optimized version.'
            },
          ].map((activity, idx) => (
             <motion.div 
               layout
               key={idx} 
               onClick={() => setExpandedActivity(expandedActivity === idx ? null : idx)}
               className="relative glass-card rounded-2xl p-4 flex flex-col cursor-pointer transition-colors overflow-hidden"
             >
                <div className="flex items-center gap-4 w-full pr-8">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex shrink-0 items-center justify-center text-slate-400 dark:text-slate-600 transition-colors">
                     {activity.icon === 'file' ? <Bell size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                      {expandedActivity === idx ? activity.title : activity.shortTitle}
                    </h4>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium tracking-tight">{activity.type} • {activity.time}</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedActivity(expandedActivity === idx ? null : idx);
                  }}
                  className="absolute top-4 right-4 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                  aria-label="Toggle details"
                >
                  <ChevronDown 
                    className={`transition-transform duration-300 ${expandedActivity === idx ? 'rotate-180' : ''}`} 
                    size={16} 
                  />
                </button>
                
                <AnimatePresence>
                  {expandedActivity === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4"
                    >
                      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                          {activity.details}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest hover:text-cyan-600 active:scale-95 transition-all">
                          View Full Thread
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
