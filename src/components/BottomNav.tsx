/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, BookOpen, Users, MessageCircle, User, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'study', label: 'Slide Analyzer', icon: BookOpen },
    { id: 'clubs', label: 'Clubs', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {isOffline && (
        <div className="max-w-[480px] mx-auto bg-amber-500 text-white text-[10px] font-bold text-center py-1 flex items-center justify-center gap-1">
          <WifiOff size={12} />
          <span>Offline Mode</span>
        </div>
      )}
      <nav className="max-w-[480px] mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-3 flex justify-between items-center safe-bottom transition-colors">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-cyan-500 scale-110" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive && "bg-cyan-50 dark:bg-cyan-900/30"
              )}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium transition-colors">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-cyan-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

