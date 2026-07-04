/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, Download, Plus, Star, Target, ChevronDown, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';

interface CGPACalculatorProps {
  onBack: () => void;
}

interface Semester {
  id: number;
  gpa: string;
}

export function CGPACalculator({ onBack }: CGPACalculatorProps) {
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: 1, gpa: '3.58' },
    { id: 2, gpa: '3.63' },
  ]);

  const currentCGPA = useMemo(() => {
    if (semesters.length === 0) return '0.00';
    const validGPAs = semesters.map(s => parseFloat(s.gpa)).filter(n => !isNaN(n));
    if (validGPAs.length === 0) return '0.00';
    const total = validGPAs.reduce((acc, g) => acc + g, 0);
    return (total / validGPAs.length).toFixed(2);
  }, [semesters]);

  const addSemester = () => {
    const nextId = semesters.length > 0 ? Math.max(...semesters.map(s => s.id)) + 1 : 1;
    setSemesters([...semesters, { id: nextId, gpa: '' }]);
  };

  const updateGPA = (id: number, value: string) => {
    const gpa = parseFloat(value);
    if (value !== '' && !isNaN(gpa) && (gpa < 0 || gpa > 4.0)) return;
    setSemesters(prev => prev.map(sem => sem.id === id ? { ...sem, gpa: value } : sem));
  };

  const removeSemester = (id: number) => {
    setSemesters(prev => prev.filter(sem => sem.id !== id));
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent p-6 flex flex-col transition-colors">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white">
              <Star size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">CGPA Calculator</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Track and simulate your grades</p>
            </div>
          </div>
        </div>
        <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform">
          <Download size={20} />
        </button>
      </header>

      {/* Main Stats Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 mb-6 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 dark:bg-cyan-900/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Current CGPA</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-black text-slate-800 dark:text-slate-100">{currentCGPA}</h2>
            {parseFloat(currentCGPA) >= 3.5 && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                DEAN'S LIST ⭐
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Semesters</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{semesters.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{parseFloat(currentCGPA) >= 3.5 ? 'Excellent' : 'Good'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GPA Trend */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 mb-6 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-6 px-2">GPA Trend</h3>
        <div className="flex items-end justify-around h-32 px-4 gap-2">
          {semesters.map((sem, idx) => {
            const val = parseFloat(sem.gpa) || 0;
             return (
               <div key={sem.id} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / 4) * 100}%` }}
                    className="w-full max-w-[32px] bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t-2xl relative group min-h-[4px]"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {sem.gpa || '0.00'}
                    </div>
                  </motion.div>
                  <span className="text-[10px] font-bold text-slate-400">S{sem.id}</span>
               </div>
             );
          })}
        </div>
      </div>

      {/* Semesters List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
           <h3 className="font-bold text-slate-800 dark:text-slate-100">Semester Grades</h3>
        </div>
        
        <div className="space-y-4">
           {semesters.map((sem, idx) => (
             <div key={sem.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800 group hover:shadow-md transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-950 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs ring-1 ring-cyan-100 dark:ring-cyan-900/50">
                    S{sem.id}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="GPA (e.g. 3.75)"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      value={sem.gpa}
                      onChange={(e) => updateGPA(sem.id, e.target.value)}
                    />
                    <p className="text-slate-400 text-[10px] font-medium">Semester {sem.id} point</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => removeSemester(sem.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronDown className="text-slate-300" size={16} />
                </div>
             </div>
           ))}
           <button 
            onClick={addSemester}
            className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
           >
             <Plus size={18} />
             Add Semester
           </button>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
