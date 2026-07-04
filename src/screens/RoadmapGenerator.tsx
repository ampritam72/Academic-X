/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, GraduationCap, Map, Target, 
  Code2, Layout, ShieldCheck, Cpu, Database, 
  LineChart, Sparkles, ArrowRight, CheckCircle2,
  BookOpen, Terminal, Code
} from 'lucide-react';

interface RoadmapGeneratorProps {
  onBack: () => void;
}

type TechTrack = 'App Development' | 'Web Development' | 'UI/UX' | 'AI/ML' | 'Cyber Security' | 'Competitive Programming';

export function RoadmapGenerator({ onBack }: RoadmapGeneratorProps) {
  const [selectedTrack, setSelectedTrack] = useState<TechTrack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);

  const tracks: { id: TechTrack, icon: any, color: string }[] = [
    { id: 'App Development', icon: < Terminal />, color: 'bg-blue-500' },
    { id: 'Web Development', icon: < Code2 />, color: 'bg-emerald-500' },
    { id: 'UI/UX', icon: < Layout />, color: 'bg-purple-500' },
    { id: 'AI/ML', icon: < Sparkles />, color: 'bg-indigo-500' },
    { id: 'Cyber Security', icon: < ShieldCheck />, color: 'bg-rose-500' },
    { id: 'Competitive Programming', icon: < Cpu />, color: 'bg-amber-500' },
  ];

  const handleGenerate = async (track: TechTrack) => {
    setSelectedTrack(track);
    setIsGenerating(true);
    try {
      const { generateContent } = await import('../services/geminiService');
      const prompt = `Create a professional learning roadmap for ${track}. Divide it into: 1. Beginner 2. Intermediate 3. Advanced 4. Recommended Tools & Projects. Format with bold headings and emoji bullet points. Keep it clear and academic.`;
      const result = await generateContent(prompt);
      setRoadmap(result || "Failed to generate roadmap.");
    } catch (error) {
      console.error(error);
      setRoadmap("Error: Failed to generate roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors overflow-hidden">
      <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={roadmap ? () => setRoadmap(null) : onBack}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Skill Matrix</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Growth Blueprint</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {!roadmap ? (
            <motion.div 
               key="selection"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="space-y-6"
            >
               <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Choose Your Track</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em]">Select a path to generate your AI learning roadmap</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleGenerate(track.id)}
                      disabled={isGenerating}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm text-left group hover:border-indigo-200 transition-all active:scale-[0.98]"
                    >
                       <div className={`${track.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          {track.icon}
                       </div>
                       <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-tight">
                          {track.id}
                       </h3>
                    </button>
                  ))}
               </div>

               {isGenerating && (
                 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-10">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] text-center max-w-xs shadow-2xl">
                       <div className="relative w-20 h-20 mx-auto mb-6">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full border-t-indigo-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Sparkles size={24} className="text-indigo-500" />
                          </div>
                       </div>
                       <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">AI Synthesizing</h4>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Mapping out the perfect career path for {selectedTrack}...</p>
                    </div>
                 </div>
               )}
            </motion.div>
          ) : (
            <motion.div 
               key="roadmap"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-6 pb-24"
            >
               <div className="flex items-center gap-4 bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-500/20 mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                     <Target size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">{selectedTrack}</h3>
                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest opacity-80">Full Horizon Roadmap</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm p-8">
                  <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:uppercase prose-headings:tracking-widest text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                     <div dangerouslySetInnerHTML={{ __html: roadmap.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
               </div>

               <button 
                  onClick={() => setRoadmap(null)}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
               >
                  Generate Different Path
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="h-20" />
    </div>
  );
}
