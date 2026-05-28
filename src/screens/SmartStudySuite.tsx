/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromFile } from '../utils/fileExtractor';
import { 
  ChevronLeft, Sparkles, BookOpen, Calendar, Zap, 
  FileText, Upload, FileUp, ClipboardList, PenTool,
  Clock, Target, ListChecks, ArrowRight, CheckCircle2,
  Brain, Languages, Pen, FileQuestion, Image
} from 'lucide-react';

interface SmartStudySuiteProps {
  onBack: () => void;
}

type SuiteFeature = 'notes' | 'planner' | 'viva' | null;

export function SmartStudySuite({ onBack }: SmartStudySuiteProps) {
  const [activeFeature, setActiveFeature] = useState<SuiteFeature>(null);

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col transition-colors overflow-hidden">
      {!activeFeature ? (
        <SuiteHome onBack={onBack} onSelect={setActiveFeature} />
      ) : (
        <div className="flex-1 flex flex-col">
           <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <button 
                onClick={() => setActiveFeature(null)}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  {activeFeature === 'notes' && 'PDF to Smart Notes'}
                  {activeFeature === 'planner' && 'AI Study Planner'}
                  {activeFeature === 'viva' && 'AI Viva Preparation'}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {activeFeature === 'notes' && 'Intelligent summarization'}
                  {activeFeature === 'planner' && 'Custom schedule generator'}
                  {activeFeature === 'viva' && 'Real-time practice mode'}
                </p>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {activeFeature === 'notes' && <PDBSmartNotes />}
              {activeFeature === 'planner' && <AIStudyPlanner />}
              {activeFeature === 'viva' && <AIVivaPrep />}
           </div>
        </div>
      )}
    </div>
  );
}

function SuiteHome({ onBack, onSelect }: { onBack: () => void, onSelect: (f: SuiteFeature) => void }) {
  return (
    <div className="flex-1 p-6 flex flex-col">
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Study Suite</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Academic Assistant</p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <FeatureCard 
          icon={<FileText className="text-cyan-500" />}
          title="PDF to Smart Notes"
          desc="Convert slides and PDFs into concise, readable exam notes."
          onClick={() => onSelect('notes')}
          color="cyan"
        />
        <FeatureCard 
          icon={<Calendar className="text-indigo-500" />}
          title="AI Study Planner"
          desc="Get a personalized routine based on your exams and weak areas."
          onClick={() => onSelect('planner')}
          color="indigo"
        />
        <FeatureCard 
          icon={<Zap className="text-amber-500" />}
          title="AI Viva Prep"
          desc="Generate viva questions from your documents or images."
          onClick={() => onSelect('viva')}
          color="amber"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, onClick, color }: { icon: any, title: string, desc: string, onClick: () => void, color: string }) {
  const colors: any = {
    cyan: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30'
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full p-6 text-left rounded-[2.5rem] border transition-all active:scale-[0.98] group ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </button>
  );
}

/* Sub-Feature: Smart Notes */
function PDBSmartNotes() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'short' | 'suggestion'>('short');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isHandwritten, setIsHandwritten] = useState(false);

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const fileText = await extractTextFromFile(file);

      const { generateContent } = await import('../services/geminiService');
      const topic = mode === 'suggestion' ? 'exam suggestions' : 'short notes';
      
      const prompt = `Act as an academic expert. Based on the uploaded slide/file content below:
${fileText ? `--- START OF MATERIAL: ${file.name} ---\n${fileText}\n--- END OF MATERIAL ---` : `[File: ${file.name} - content could not be converted to text]`}

Please generate ${topic}. Use clear bullet points and bold, beautifully stylized markdown headings. Ensure the output is highly educational, accurate to the material, and academically professional.`;

      const result = await generateContent(prompt);
      setOutput(result || "Failed to generate notes.");
    } catch (error: any) {
      console.error(error);
      setOutput("Error: " + (error.message || "Failed to connect to AI service."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
       <div className={`p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center transition-colors ${file ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200' : ''}`}>
          <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
             <FileUp className={file ? 'text-indigo-500' : 'text-slate-400'} size={32} />
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {file ? file.name : 'Upload PDF or Slides'}
          </p>
          <input type="file" className="hidden" id="pdf-upload" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <label htmlFor="pdf-upload" className="mt-4 inline-block px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-transform">
            Select File
          </label>
       </div>

       <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Generation Mode</label>
          <div className="grid grid-cols-2 gap-2">
             {[
               { id: 'short', label: 'Short Notes', icon: <ClipboardList size={14} /> },
               { id: 'suggestion', label: 'Sugges.', icon: <Pen size={14} /> }
             ].map((m) => (
               <button 
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  mode === m.id 
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                }`}
               >
                  {m.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
               </button>
             ))}
          </div>
       </div>

       <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
             <PenTool size={18} className="text-purple-500" />
             <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono uppercase tracking-widest">Handwritten Style</span>
          </div>
          <button 
             onClick={() => setIsHandwritten(!isHandwritten)}
             className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${isHandwritten ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isHandwritten ? 'translate-x-6' : ''}`} />
          </button>
       </div>

       <button 
          onClick={handleGenerate}
          disabled={!file || isGenerating}
          className="w-full py-5 bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 disabled:opacity-50 active:scale-95 transition-all"
       >
          {isGenerating ? 'Analyzing Material...' : 'Generate Notes'}
       </button>

       {output && (
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className={`p-6 rounded-[2.5rem] border ${
             isHandwritten 
               ? 'bg-[#fcfaf0] border-[#e8e4d8] shadow-[0_4px_0_#e8e4d8]' 
               : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
           }`}
         >
            <div className="flex items-center justify-between mb-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Reveal</h4>
               <CheckCircle2 className="text-emerald-500" size={16} />
            </div>
            <div className={`text-sm leading-loose text-slate-800 dark:text-slate-200 whitespace-pre-wrap ${isHandwritten ? 'font-serif italic' : 'font-sans'}`}>
               {output}
            </div>
         </motion.div>
       )}
    </div>
  );
}

/* Sub-Feature: Study Planner */
function AIStudyPlanner() {
  const [plannerData, setPlannerData] = useState({
    subjects: '',
    examDate: '',
    weakTopics: '',
    availableTime: '3'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const { generateContent } = await import('../services/geminiService');
      const context = `Subjects: ${plannerData.subjects}\nExam on: ${plannerData.examDate}\nWeak Topics: ${plannerData.weakTopics}\nTime per day: ${plannerData.availableTime} hours.`;
      const prompt = `Create a detailed student study routine based on the following context. ${context}. Output: A daily plan, revision steps, and key focus items. Use bold headings.`;
      const result = await generateContent(prompt);
      setPlan(result || "Failed to generate plan.");
    } catch (error: any) {
      console.error(error);
      setPlan("Error: " + (error.message || "Failed to generate plan."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
       <div className="space-y-4">
          <InputGroup label="Subjects to Study" placeholder="e.g. DSP, Networking, Math" value={plannerData.subjects} onChange={(v) => setPlannerData({...plannerData, subjects: v})} />
          <InputGroup label="Target Exam Date" type="date" value={plannerData.examDate} onChange={(v) => setPlannerData({...plannerData, examDate: v})} />
          <InputGroup label="Weak Topics" placeholder="What are you struggling with?" value={plannerData.weakTopics} onChange={(v) => setPlannerData({...plannerData, weakTopics: v})} />
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Available Time (Hours/Day)</label>
             <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-transparent">
                <Clock className="text-indigo-500" size={18} />
                <input 
                  type="range" min="1" max="12" step="1"
                  className="flex-1 accent-indigo-500" 
                  value={plannerData.availableTime}
                  onChange={(e) => setPlannerData({...plannerData, availableTime: e.target.value})}
                />
                <span className="text-sm font-black text-slate-800 dark:text-white w-8">{plannerData.availableTime}h</span>
             </div>
          </div>
       </div>

       <button 
          onClick={handleGeneratePlan}
          className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-400/10 active:scale-95 transition-all"
       >
          {isGenerating ? 'Personalizing Strategy...' : 'Construct My Plan'}
       </button>

       {plan && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 shadow-xl"
         >
            <div className="flex items-center gap-2 mb-6">
                <Target className="text-rose-500" size={18} />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tailored Study Protocol</h4>
            </div>
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:uppercase prose-headings:tracking-widest text-slate-600 dark:text-slate-300 leading-relaxed">
               <div dangerouslySetInnerHTML={{ __html: plan.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
         </motion.div>
       )}
    </div>
  );
}

function InputGroup({ label, type = "text", placeholder, value, onChange }: { label: string, type?: string, placeholder?: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 border border-transparent dark:text-slate-100 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* Sub-Feature: Viva Prep */
function AIVivaPrep() {
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const fileText = await extractTextFromFile(file);

      const { generateContent } = await import('../services/geminiService');
      const prompt = `Based on the provided document/file content below, generate exactly 5 highly likely academic Viva (oral exam) questions:
${fileText ? `--- START OF DOCUMENT: ${file.name} ---\n${fileText}\n--- END OF DOCUMENT ---` : `[Filename: ${file.name}]`}

Format: Return ONLY the questions, line by line, one question per line. Do not add numbers, introductions, bullet points, asterisks, or extra characters. Just 5 questions separated by newlines.`;

      const text = await generateContent(prompt);
      
      const lines = text.split('\n')
        .map((l: string) => l.trim().replace(/^\d+\.\s+/, '').replace(/^-\s+/, '').trim())
        .filter((l: string) => l.length > 5)
        .slice(0, 5) || [];
      setQuestions(lines);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
       {!questions.length ? (
         <div className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-50 dark:border-slate-800 shadow-sm text-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center text-amber-500 mb-6">
               <FileQuestion size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Viva Ready?</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-[200px]">
              Upload notes or slides to generate potential questions.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-2"
            >
               {file ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Upload size={14} />}
               {file ? 'File Attached' : 'Attach Document'}
            </button>

            {file && (
               <button 
                onClick={handleProcess}
                disabled={isGenerating}
                className="mt-4 w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20"
               >
                 {isGenerating ? 'Extracting Questions...' : 'Start Extraction'}
               </button>
            )}
         </div>
       ) : (
         <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Expected Questions</h3>
            {questions.map((q, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-amber-50 dark:border-amber-950/20 shadow-sm flex items-start gap-4"
              >
                 <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 font-black text-xs flex-shrink-0">
                    {idx + 1}
                 </div>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                    "{q.replace(/^\d+\.\s*/, '')}"
                 </p>
              </motion.div>
            ))}
            <button 
              onClick={() => setQuestions([])}
              className="w-full py-4 mt-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Reset Session
            </button>
         </div>
       )}
    </div>
  );
}
