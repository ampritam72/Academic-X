/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, Code, Sparkles, Trash2, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeExplainerProps {
  onBack: () => void;
}

const LANGUAGES = ['C', 'C++', 'Java', 'Python', 'JavaScript'];

export function CodeExplainer({ onBack }: CodeExplainerProps) {
  const [activeLang, setActiveLang] = useState('Python');
  const [activeTab, setActiveTab] = useState('Code');
  const [code, setCode] = useState(`def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async () => {
    if (!code.trim()) return;
    setIsExplaining(true);
    setExplanation(null);
    setActiveTab('Explanation');
    try {
      const { generateContent } = await import('../services/geminiService');
      const prompt = `Explain the following ${activeLang} code in detail but keep it student-friendly. Use clear headings and bullet points. Also, describe how a flowchart for this logic would look. Code:\n${code}`;
      const result = await generateContent(prompt);
      setExplanation(result || "Failed to generate explanation.");
    } catch (error: any) {
      console.error(error);
      setExplanation("Error: " + (error.message || "Failed to explain code."));
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent p-6 flex flex-col transition-colors">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
            <Code size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Code Explainer</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Paste code → Get explanation + flowchart</p>
          </div>
        </div>
      </header>

      {/* Language Selector */}
      <div className="flex flex-wrap gap-2 mb-6 transition-colors">
         {LANGUAGES.map(lang => (
           <button
             key={lang}
             onClick={() => setActiveLang(lang)}
             className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
               activeLang === lang ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-transparent dark:border-slate-800'
             }`}
           >
             {lang}
           </button>
         ))}
      </div>

      <div className="flex-1 flex flex-col">
         {/* Tabs */}
         <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex mb-6 transition-colors">
            {['Code', 'Explanation', 'Flowchart'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                  activeTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>

         {/* Editor Container */}
         <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 p-8 flex flex-col relative overflow-hidden transition-all">
            {activeTab === 'Code' ? (
              <>
                <textarea
                  className="flex-1 w-full font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your source code here..."
                  autoFocus
                />
                
                <div className="mt-8 flex items-center gap-4">
                   <button 
                     onClick={handleExplain}
                     disabled={isExplaining}
                     className="flex-1 gradient-btn py-5 rounded-[1.5rem] shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest disabled:opacity-50"
                   >
                     {isExplaining ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>
                         <Sparkles size={18} />
                         Explain Logic
                       </>
                     )}
                   </button>
                   <button 
                     onClick={() => setCode('')}
                     className="p-5 bg-slate-50 dark:bg-slate-800 text-rose-500 rounded-[1.5rem] transition-colors ring-1 ring-slate-100 dark:ring-slate-700"
                    >
                     <Trash2 size={20} />
                   </button>
                </div>

                <div className="absolute top-6 right-6">
                   <button 
                     onClick={() => {navigator.clipboard.writeText(code)}}
                     className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors shadow-sm"
                   >
                     <Copy size={18} />
                   </button>
                </div>
              </>
            ) : explanation ? (
              <div className="flex-1 overflow-y-auto no-scrollbar text-left">
                 <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-indigo-500" size={16} />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Breakdown</h4>
                 </div>
                 <div className="text-sm leading-loose text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {explanation}
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                 <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse">
                   <Sparkles className="text-indigo-500 dark:text-indigo-400" size={48} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">AI Analysis</h3>
                 <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Processing your instructions to generate a detailed {activeTab.toLowerCase()}.</p>
              </div>
            )}
         </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
