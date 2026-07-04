/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, History, FileText, CheckCircle, Clock, BookOpen, MessageSquare } from 'lucide-react';

interface RecentActivitiesProps {
  onBack: () => void;
}

export function RecentActivities({ onBack }: RecentActivitiesProps) {
  const activities = [
    { type: 'file', label: 'Slide Analyzed', detail: 'CSE 301 - Algorithm Design', time: '2h ago', icon: <FileText size={16} />, color: 'text-blue-500' },
    { type: 'check', label: 'Quiz Completed', detail: 'MAT 201 - Linear Algebra', time: '5h ago', icon: <CheckCircle size={16} />, color: 'text-emerald-500' },
    { type: 'study', label: 'Study Goal Met', detail: '3 hours of deep focus', time: 'Yesterday', icon: <Clock size={16} />, color: 'text-amber-500' },
    { type: 'doc', label: 'Note Created', detail: 'Database Systems Chapter 4', time: 'Yesterday', icon: <BookOpen size={16} />, color: 'text-purple-500' },
    { type: 'chat', label: 'AI Interaction', detail: 'Code Explainer: Recursion', time: '2 days ago', icon: <MessageSquare size={16} />, color: 'text-cyan-500' },
    { type: 'file', label: 'Slide Analyzed', detail: 'HUM 101 - Art of Living', time: '3 days ago', icon: <FileText size={16} />, color: 'text-blue-500' },
    { type: 'check', label: 'Assignment Submitted', detail: 'C Programming Project', time: '4 days ago', icon: <CheckCircle size={16} />, color: 'text-emerald-500' },
    { type: 'study', label: 'Study Session', detail: '2 hours of group study', time: '5 days ago', icon: <Clock size={16} />, color: 'text-amber-500' },
    { type: 'doc', label: 'Note Shared', detail: 'Algorithms Final Prep', time: '6 days ago', icon: <BookOpen size={16} />, color: 'text-purple-500' },
    { type: 'chat', label: 'Career Consultant AI', detail: 'Internship Advice', time: '1 week ago', icon: <MessageSquare size={16} />, color: 'text-cyan-500' },
  ];

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col p-6 transition-colors">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
            <History size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Activities</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Last 10 records tracking</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
        {activities.map((activity, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center gap-4 group transition-colors"
          >
            <div className={`w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center ${activity.color} transition-colors`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{activity.label}</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{activity.time}</span>
               </div>
               <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium truncate mt-0.5">{activity.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="h-20" />
    </div>
  );
}
