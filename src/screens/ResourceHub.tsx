/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, Download, Search, FileText, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

interface ResourceHubProps {
  onBack: () => void;
}

const SEMESTERS = [
  '1st Semester Slides',
  '2nd Semester Slides',
  '3rd Semester Slides',
  '4th Semester Slides',
  '5th Semester Slides',
  '6th Semester Slides',
  '7th Semester Slides',
  '8th Semester Slides',
];

export function ResourceHub({ onBack }: ResourceHubProps) {
  const [activeTab, setActiveTab] = useState('Slides');
  const [syncingIndex, setSyncingIndex] = useState<number | null>(null);

  const handleSync = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncingIndex !== null) return;
    setSyncingIndex(idx);
    
    // Simulate syncing process
    setTimeout(() => {
      setSyncingIndex(null);
    }, 2500);
  };

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
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Slides</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide transition-colors">Academic Materials Repository</p>
          </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex mb-8 transition-colors">
        <button
          onClick={() => setActiveTab('Slides')}
          className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'Slides' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          Slides (1-8)
        </button>
        <button
          onClick={() => setActiveTab('Saved')}
          className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'Saved' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          Offline Files
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
        {activeTab === 'Slides' ? (
          SEMESTERS.map((sem, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800 group hover:shadow-md transition-all cursor-pointer ring-1 ring-transparent hover:ring-emerald-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-lg transition-colors">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{sem}</h4>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tap to sync Drive</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => handleSync(idx, e)}
                  disabled={syncingIndex === idx}
                  className={`${syncingIndex === idx ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-emerald-500'} transition-colors`}
                >
                  {syncingIndex === idx ? (
                    <div className="w-[18px] h-[18px] border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </button>
                <ChevronRight className="text-slate-200 dark:text-slate-800" size={20} />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
             <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mb-8">
               <Download className="text-emerald-500 dark:text-emerald-400" size={48} />
             </div>
             <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">No offline slides</h3>
             <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-[200px]">Slides you save for offline viewing will appear here automatically.</p>
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
