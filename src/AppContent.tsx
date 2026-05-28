/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { Dashboard } from './screens/Dashboard';
import { SlideAnalyzer } from './screens/SlideAnalyzer';
import { CGPACalculator } from './screens/CGPACalculator';
import { RoutineScreen } from './screens/RoutineScreen';
import { CodeExplainer } from './screens/CodeExplainer';
import { ResourceHub } from './screens/ResourceHub';
import { ClubZone } from './screens/ClubZone';
import { ProfileScreen } from './screens/ProfileScreen';
import { ChatScreen } from './screens/ChatScreen';
import { NoticeBoard } from './screens/NoticeBoard';
import { RecentActivities } from './screens/RecentActivities';
import { AdminDashboard } from './screens/AdminDashboard';
import { SmartStudySuite } from './screens/SmartStudySuite';
import { RoadmapGenerator } from './screens/RoadmapGenerator';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles as SparklesIcon, ChevronLeft } from 'lucide-react';
import { startClassReminderService } from './services/notificationService';
import { AskAIModal } from './components/AskAIModal';

function ExternalRedirect({ url, onComplete }: { url: string, onComplete: () => void }) {
  useEffect(() => {
    window.location.href = url;
    onComplete();
  }, [url, onComplete]);
  return null;
}

export default function AppContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab ] = useState('home');
  const [currentSubPage, setCurrentSubPage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    startClassReminderService();
  }, []);

  // Reset scroll to top on tab or subpage selection
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' as any });
    document.body.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [activeTab, currentSubPage]);

  const handleNavigate = (path: string) => {
    if (path === '/profile') {
      setActiveTab('profile');
      setCurrentSubPage(null);
    } else {
      setCurrentSubPage(path);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  if (showSplash || isAuthLoading) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div ref={dragConstraintsRef} className="relative min-h-screen transition-colors overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!currentSubPage ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'home' && <Dashboard onNavigate={handleNavigate} />}
            {activeTab === 'clubs' && <ClubZone onBack={() => setActiveTab('home')} />}
            {activeTab === 'chat' && <ChatScreen onBack={() => setActiveTab('home')} />}
            {activeTab === 'profile' && <ProfileScreen />}
            
            {/* Study Tab Placeholder */}
            {activeTab === 'study' && (
              <SlideAnalyzer onBack={() => setActiveTab('home')} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key={currentSubPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-40 overflow-y-auto no-scrollbar"
          >
            {currentSubPage === '/slide-analyzer' && (
              <SlideAnalyzer onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/cgpa-calculator' && (
              <CGPACalculator onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/routine' && (
              <RoutineScreen onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/code-explainer' && (
              <CodeExplainer onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/all-slides' && (
              <ResourceHub onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/notices' && (
              <NoticeBoard onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/admin' && (
              <AdminDashboard onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/smart-study' && (
              <SmartStudySuite onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/skill-roadmap' && (
              <RoadmapGenerator onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/clubs' && (
              <ClubZone onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/recent-activities' && (
              <RecentActivities onBack={() => setCurrentSubPage(null)} />
            )}
            {currentSubPage === '/lr-cover' && (
              <ExternalRedirect 
                url="https://vucover.vercel.app/?fbclid=IwdGRzaARXhSljbGNrBFeFH2V4dG4DYWVtAjExAHNydGMGYXBwX2lkDDM1MDY4NTUzMTcyOAABHpT_NVnh1IAj-bvWhYBCxh_cRP2AAOb3jEtCiC9jQe0lhpRSgA6i_29L8esr_aem_-I59RywFZMGm-VoQDkrq8w" 
                onComplete={() => setCurrentSubPage(null)} 
              />
            )}
            
            {/* Universal Fallback for Coming Soon Modules */}
            {!['/slide-analyzer', '/cgpa-calculator', '/routine', '/code-explainer', '/all-slides', '/clubs', '/notices', '/recent-activities', '/lr-cover', '/admin', '/smart-study', '/skill-roadmap'].includes(currentSubPage) && (
              <div className="min-h-screen p-6 flex flex-col transition-colors">
                <header className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setCurrentSubPage(null)}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white">
                      <SparklesIcon size={20} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                         {currentSubPage.replace('/', '').replace('-', ' ')}
                      </h1>
                      <p className="text-[10px] text-slate-400 font-medium tracking-wide">Academic X Enhancement</p>
                    </div>
                  </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                   <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center mb-8 relative">
                      <SparklesIcon className="text-cyan-500 animate-pulse" size={48} />
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full ring-4 ring-white dark:ring-slate-900 uppercase tracking-widest">WIP</div>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-tight">Module Reconstructing</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium max-w-xs leading-relaxed">
                      We're currently building this feature based on your sitemap and screenshots for a perfect mobile experience.
                   </p>
                   <button 
                     onClick={() => setCurrentSubPage(null)}
                     className="mt-10 gradient-btn px-12 py-5 rounded-[2rem] shadow-xl shadow-cyan-500/20 text-xs font-black uppercase tracking-[0.2em] active:scale-95 transition-all"
                   >
                     System Home
                   </button>
                </div>
                <div className="h-20" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!currentSubPage && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Floating Draggable Ask AI Brand Logo Button */}
      <motion.button
        drag
        dragConstraints={{ left: -340, right: 20, top: -650, bottom: 20 }}
        dragElastic={0.15}
        dragMomentum={true}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          // Add a small delay to avoid triggering click immediately after release
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        onClick={() => {
          if (!isDraggingRef.current) {
            setIsAiModalOpen(true);
          }
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, cursor: "grabbing", boxShadow: "0 0 30px rgba(6,182,212,1)", borderColor: "rgba(34,211,238,1)" }}
        className="fixed bottom-24 right-4 md:right-[calc(50%-240px+1rem)] z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-900 dark:bg-slate-950 shadow-2xl border-2 border-cyan-500/30 cursor-grab select-none p-1 shrink-0 group before:absolute before:-inset-8 before:content-[''] before:rounded-full before:bg-transparent touch-none"
      >
        {/* Animated attention-getting speech bubble above the button */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-cyan-500/20 border border-white/20 whitespace-nowrap animate-bounce pointer-events-none tracking-wide select-none">
          Ask me!
          {/* Small Bubble Arrow pointing down */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-white/10" />
        </div>

        <div className="relative w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center p-1.5 border border-cyan-500/20 group-hover:border-cyan-400 transition-colors">
          <img 
            src="/assets/images/logo.png" 
            alt="Ask AI" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            onError={(e) => {
              e.currentTarget.src = "https://raw.githubusercontent.com/abirmahmudpritam001/Academic-X/main/assets/logo.png";
            }}
          />
        </div>
        {/* Glow pulsing ring around */}
        <span className="absolute inset-0 rounded-full border border-cyan-500/30 animate-pulse pointer-events-none" />
      </motion.button>

      <AnimatePresence>
        {isAiModalOpen && (
          <AskAIModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal Sparkles icon for placeholder
function Sparkles({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
