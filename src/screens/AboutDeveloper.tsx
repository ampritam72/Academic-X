import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Code, Mail, Github, Globe, MapPin, Award } from 'lucide-react';

interface AboutDeveloperProps {
  onBack: () => void;
}

const DEVELOPERS = [
  {
    name: 'Abir Mahmud Pritam',
    role: 'Project Lead, UI/UX Design, Backend & Firebase, AI Integration',
    batch: '32nd',
    section: 'B',
    studentId: '231311070',
    imageUrl: '/assets/images/profile.png',
    website: 'https://portfolio-six-psi-d1i7n9gk5l.vercel.app/',
    github: 'https://github.com/ampritam72'
  },
  {
    name: 'Ahnaf Shakil',
    role: 'App Logic & Frontend Components',
    batch: '32nd',
    section: 'B',
    studentId: '231311060',
    imageUrl: '/assets/images/ahnaf.jpeg',
    website: '#',
    github: '#'
  },
  {
    name: 'Samiha Farjana',
    role: 'Documentation & Testing',
    batch: '32nd',
    section: 'A',
    studentId: '231311023',
    imageUrl: '/assets/images/samiha.jpeg',
    website: '#',
    github: '#'
  }
];

export function AboutDeveloper({ onBack }: AboutDeveloperProps) {
  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pb-24 transition-colors">
      <div className="pt-12 px-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">About Developers</h1>
        </div>

        {DEVELOPERS.map((dev, idx) => (
            <div key={idx} className="glass-card rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 flex flex-col items-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10" />
            
            <div className="relative mb-6 mt-4">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative z-10">
                <img 
                    src={dev.imageUrl}
                    alt={dev.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + dev.name;
                    }}
                />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-slate-900 z-20">
                <Code size={18} />
                </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{dev.name}</h2>
            <p className="text-xs font-bold text-indigo-500 tracking-wide mb-6 text-center px-4 leading-relaxed">{dev.role}</p>

            <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl text-center">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Batch</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{dev.batch}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl text-center">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Section</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{dev.section}</p>
                </div>
            </div>

            <div className="space-y-4 w-full">
                <div className="glass-card p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500">
                    <Award size={22} />
                    </div>
                    <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{dev.studentId}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <a href={dev.website} target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Globe size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Website</span>
                    </a>
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="glass-card p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Github size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">GitHub</span>
                    </a>
                </div>
            </div>
            </div>
        ))}
        
        <div className="bg-indigo-500/10 rounded-[2.5rem] p-6 border border-indigo-500/20">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed italic text-center">
            "Coding dreams into reality to empower the students of Varendra University."
          </p>
        </div>
      </div>
    </div>
  );
}
