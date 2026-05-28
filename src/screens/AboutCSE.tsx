import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Info, Globe, LogIn, GraduationCap, ChevronRight } from 'lucide-react';

interface AboutCSEProps {
  onBack: () => void;
}

export function AboutCSE({ onBack }: AboutCSEProps) {
  const links = [
    {
      title: 'Overview',
      subtitle: 'Program details & curriculum',
      icon: <Info className="text-white" size={20} />,
      color: 'bg-blue-500 text-blue-500',
      iconBg: 'bg-blue-500',
      url: 'https://vu.edu.bd/academics/programs/6/b-sc-in-cse'
    },
    {
      title: 'Visit Website',
      subtitle: 'Official VU & department pages',
      icon: <Globe className="text-white" size={20} />,
      color: 'bg-emerald-500 text-emerald-500',
      iconBg: 'bg-emerald-500',
      url: 'https://vu.edu.bd/academics/departments/computer-science-and-engineering'
    },
    {
      title: 'Student Log In',
      subtitle: 'Portal for results, notices & more',
      icon: <LogIn className="text-white" size={20} />,
      color: 'bg-cyan-500 text-cyan-500',
      iconBg: 'bg-cyan-500',
      url: 'http://160.187.25.3:8083/front/student/login'
    },
    {
      title: 'University Home',
      subtitle: 'Varendra University main site',
      icon: <GraduationCap className="text-white" size={20} />,
      color: 'bg-orange-500 text-orange-500',
      iconBg: 'bg-orange-500',
      url: 'https://vu.edu.bd/'
    }
  ];

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pb-24 transition-colors">
      <div className="pt-12 px-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Dept. of CSE, VU</h1>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
          Computer Science & Engineering at Varendra University — programs, resources, and links.
        </p>

        <div className="space-y-4">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${link.iconBg} shadow-inner`}>
                    {link.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{link.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{link.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600 mr-2" size={20} />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 text-left">
          <p className="text-xs text-slate-400 dark:text-slate-500 italic font-medium">
            — Abir Mahmud Pritam · Batch 32nd · Dept. of CSE, VU
          </p>
        </div>
      </div>
    </div>
  );
}
