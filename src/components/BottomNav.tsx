/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, BookOpen, Users, MessageCircle, User, WifiOff, Wifi, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showToast, setShowToast] = useState(!navigator.onLine);
  const [toastType, setToastType] = useState<'offline' | 'online' | null>(!navigator.onLine ? 'offline' : null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleOnline = () => {
      setIsOffline(false);
      setToastType('online');
      setShowToast(true);
      // Auto-hide the online success toast after 3.5 seconds
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setToastType('offline');
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[480px] mx-auto relative px-4">
        <AnimatePresence>
          {showToast && toastType && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute bottom-20 left-4 right-4 z-50 pointer-events-auto"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.012, 1],
                  boxShadow: toastType === 'offline' 
                    ? [
                        "0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 8px 10px -6px rgba(245, 158, 11, 0.15)",
                        "0 15px 30px -5px rgba(245, 158, 11, 0.35), 0 10px 15px -6px rgba(245, 158, 11, 0.25)",
                        "0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 8px 10px -6px rgba(245, 158, 11, 0.15)"
                      ]
                    : [
                        "0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.15)",
                        "0 15px 30px -5px rgba(16, 185, 129, 0.35), 0 10px 15px -6px rgba(16, 185, 129, 0.25)",
                        "0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.15)"
                      ]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut"
                }}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-colors",
                  toastType === 'offline'
                    ? "bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200"
                    : "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-1.5 rounded-lg relative flex items-center justify-center",
                    toastType === 'offline' ? "bg-amber-100 dark:bg-amber-900/45" : "bg-emerald-100 dark:bg-emerald-900/45"
                  )}>
                    {/* Low-profile ping wave */}
                    <div className={cn(
                      "absolute inset-0 rounded-lg animate-ping opacity-30",
                      toastType === 'offline' ? "bg-amber-400" : "bg-emerald-400"
                    )} />
                    {toastType === 'offline' ? <WifiOff size={16} className="relative z-10" /> : <Wifi size={16} className="relative z-10" />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">
                      {toastType === 'offline' ? 'Offline Mode' : 'Connection Restored'}
                    </span>
                    <span className="text-[10px] opacity-80 font-medium leading-normal">
                      {toastType === 'offline'
                        ? 'App is offline. Using local cache key-value states.'
                        : 'You are back online. All features are active.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className={cn(
                    "p-1 rounded-lg transition-all active:scale-90",
                    toastType === 'offline' 
                      ? "hover:bg-amber-100 dark:hover:bg-amber-900/45 text-amber-500" 
                      : "hover:bg-emerald-100 dark:hover:bg-emerald-900/45 text-emerald-500"
                  )}
                >
                  <X size={14} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="max-w-[480px] mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-3 flex justify-between items-center safe-bottom transition-colors pointer-events-auto">
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

