/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RefreshCcw, MapPin, TouchpadIcon, User, School, Filter as FilterIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRoutineForDay, syncRoutine, ROUTINE_CONFIG, getRoutineForSemester, RoutineItem, getAvailableSections } from '../services/routineService';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

interface RoutineScreenProps {
  onBack: () => void;
}

export function RoutineScreen({ onBack }: RoutineScreenProps) {
  const { user } = useAuth();
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let todayStr = dayNames[new Date().getDay()];
  if (todayStr === 'Fri' || todayStr === 'Sat') todayStr = 'Sun';

  const [activeDay, setActiveDay] = useState(todayStr);
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || '7th');
  const [selectedSection, setSelectedSection] = useState(user?.section || 'B');
  const [routineData, setRoutineData] = useState<RoutineItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSemesterSelect, setShowSemesterSelect] = useState(false);
  const [showSectionSelect, setShowSectionSelect] = useState(false);

  const [availableSections, setAvailableSections] = useState<string[]>(ROUTINE_CONFIG.sections);

  useEffect(() => {
    async function init() {
       await getRoutineForSemester(selectedSemester);
       const secs = getAvailableSections(selectedSemester);
       setAvailableSections(secs);
       
       // Only reset section if current one isn't in new set
       if (secs.length > 0 && !secs.includes(selectedSection)) {
         setSelectedSection(secs[0]);
       }
       
       loadRoutine();
    }
    init();
  }, [activeDay, selectedSemester, selectedSection]);

  const loadRoutine = async () => {
    const data = getRoutineForDay(activeDay, selectedSemester, selectedSection);
    setRoutineData(data);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncRoutine();
    await getRoutineForSemester(selectedSemester);
    loadRoutine();
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors">
      <header className="p-6 pb-2">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Schedule</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Spring 2026 • {selectedSemester}</p>
              </div>
           </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setShowSemesterSelect(true)}
               className="h-10 px-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center text-slate-400 gap-2 transition-colors"
             >
                <School size={16} />
                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100">{selectedSemester}</span>
             </button>
             <button 
               onClick={() => setShowSectionSelect(true)}
               className="h-10 px-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center text-slate-400 gap-2 transition-colors"
             >
                <FilterIcon size={16} />
                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100">{selectedSection}</span>
             </button>
          </div>
        </div>

        {/* Semester Selector Overlay */}
        <AnimatePresence>
          {showSemesterSelect && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end"
              onClick={() => setShowSemesterSelect(false)}
            >
               <motion.div 
                 initial={{ y: "100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                 className="w-full bg-white dark:bg-slate-950 rounded-t-[3rem] p-8 pb-12 transition-colors"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-6 text-center">Select Semester</h3>
                  <div className="grid grid-cols-3 gap-3">
                     {ROUTINE_CONFIG.sheetNames.map(sem => (
                        <button
                          key={sem}
                          onClick={() => {
                            setSelectedSemester(sem);
                            setShowSemesterSelect(false);
                          }}
                          className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            selectedSemester === sem 
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          {sem}
                        </button>
                     ))}
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Selector Overlay */}
        <AnimatePresence>
          {showSectionSelect && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end"
              onClick={() => setShowSectionSelect(false)}
            >
               <motion.div 
                 initial={{ y: "100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                 className="w-full bg-white dark:bg-slate-950 rounded-t-[3rem] p-8 pb-12 transition-colors"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-6 text-center">Select Section</h3>
                  <div className="grid grid-cols-4 gap-3">
                     {availableSections.map(sec => (
                        <button
                          key={sec}
                          onClick={() => {
                            setSelectedSection(sec);
                            setShowSectionSelect(false);
                          }}
                          className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            selectedSection === sec 
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          {sec}
                        </button>
                     ))}
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Selector */}
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex items-center justify-between gap-1 transition-colors">
           {DAYS.map((day) => (
             <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeDay === day ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm' : 'text-slate-400'
                }`}
             >
               {day}
             </button>
           ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-transparent dark:bg-transparent p-6 transition-colors">
        <div className="max-w-2xl mx-auto space-y-8 relative">

          {routineData.length > 0 ? (
            routineData.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx} 
                className="flex items-center gap-6 group"
              >
                {/* Left Side: Time with Vertical Bar */}
                <div className="flex flex-col items-center justify-center min-w-[90px]">
                   <div className="bg-[#b3e0e5] dark:bg-[#72b4bb] rounded-xl px-4 py-1 mb-3 text-sm font-bold text-slate-900">
                      Slot {idx + 1}
                   </div>
                   <div className="text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight">{item.time}</div>
                   <div className="w-[2px] h-6 bg-[#b3e0e5] dark:bg-[#72b4bb] my-2 rounded-full" />
                   <div className="text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight">{item.endTime || 'End Time'}</div>
                </div>

                {/* Right Side: Course Card */}
                <div className="flex-1 bg-[#b3e0e5] dark:bg-[#72b4bb] p-6 rounded-2xl shadow-sm border border-transparent transition-all hover:scale-[1.02]">
                   <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
                      {item.code} 
                   </h3>
                   <div className="flex flex-col gap-1 items-start">
                      <p className="text-[15px] text-slate-900 italic font-medium">
                         {item.teacher}
                      </p>
                      {item.teacher2 && (
                        <p className="text-[15px] text-slate-900 italic font-medium">
                           {item.teacher2}
                        </p>
                      )}
                   </div>
                   <div className="mt-3 text-[15px] text-slate-900 italic font-medium">
                      Room No : {item.room}
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <School size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-100 font-black uppercase tracking-tight text-lg mb-2">No Classes Found</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium max-w-[200px] mx-auto">There are no classes scheduled for {activeDay} in this section.</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-24 right-6">
         <button 
           onClick={handleSync}
           disabled={isSyncing}
           className="w-14 h-14 gradient-btn rounded-2xl shadow-xl shadow-cyan-500/40 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
         >
           <RefreshCcw size={24} className={isSyncing ? 'animate-spin' : ''} />
         </button>
      </div>

      <div className="h-20" />
    </div>
  );
}

function CalendarIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function SparklesIcon({ size, className }: { size?: number, className?: string }) {
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
    </svg>
  );
}
