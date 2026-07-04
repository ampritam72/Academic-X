/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, Upload, File, FileText, ImageIcon, X, Sparkles, CheckCircle2, Download } from 'lucide-react';
import { useState, ChangeEvent } from 'react';
import { generateStudyNotesPDF } from '../utils/pdfGenerator';
import { extractTextFromFile } from '../utils/fileExtractor';

interface SlideAnalyzerProps {
  onBack: () => void;
}

export function SlideAnalyzer({ onBack }: SlideAnalyzerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      // Extract material text from each slide file
      let slideContentsText = '';
      let base64Image: string | undefined = undefined;

      const firstFile = files[0];
      if (firstFile && firstFile.type.startsWith('image/')) {
        const reader = new FileReader();
        base64Image = await new Promise<string | undefined>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(firstFile);
        });
      }

      for (const file of files) {
        const text = await extractTextFromFile(file);
        if (text && text.trim().length > 0) {
          slideContentsText += `\n--- START OF FILE: ${file.name} ---\n${text}\n--- END OF FILE: ${file.name} ---\n`;
        }
      }

      const { generateContent } = await import('../services/geminiService');
      const prompt = `Act as an academic assistant. I have uploaded slides/notes.
${slideContentsText ? `Here is the actual content/text extracted from the slides:\n${slideContentsText}` : `Note: Could not extract deep text from files directly. File names: ${files.map(f => f.name).join(', ')}`}

Generate a highly detailed summary, core concepts, and key learning points based strictly on the material provided above. Format the output with clear typographic layout, bold headings, code snippet highlights if any, and clear bullet points. Keep it engaging, educational, and highly tailored to undergraduate study.`;

      const result = await generateContent(prompt, base64Image);
      setResult(result || "No analysis generated.");
    } catch (error: any) {
      console.error(error);
      setResult("Error: " + (error.message || "Failed to analyze slides. Please check your connection."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Slide_Notes_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!result) return;
    const fileNames = files.map(f => f.name);
    const title = fileNames[0] || 'Slides Notes';
    generateStudyNotesPDF(title, result, fileNames);
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
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Slide Analyzer</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">AI-powered notes from your slides</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <motion.div
           onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
           onDragLeave={() => setIsDragging(false)}
           onDrop={(e) => {
             e.preventDefault();
             setIsDragging(false);
             if (e.dataTransfer.files) {
               setFiles([...files, ...Array.from(e.dataTransfer.files)]);
             }
           }}
           className={`flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden ${
             isDragging ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-100 dark:border-slate-800'
           }`}
        >
          <div className="relative mb-6">
             <div className="w-24 h-24 bg-cyan-50 dark:bg-cyan-950 rounded-full flex items-center justify-center">
               <Upload className="text-cyan-500" size={40} />
             </div>
             <motion.div 
               animate={{ y: [0, -5, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-50 dark:border-slate-700"
             >
               <ImageIcon className="text-blue-500" size={16} />
             </motion.div>
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Drop your slides here</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mb-8">Supports PDF, PNG, JPG</p>

          <label className="gradient-btn px-10 py-4 rounded-2xl shadow-lg shadow-cyan-500/30 cursor-pointer text-sm font-bold active:scale-95 transition-all">
            Browse Files
            <input type="file" className="hidden" multiple onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
          </label>

          {files.length > 0 && (
            <div className="absolute inset-0 bg-white dark:bg-slate-900 p-6 overflow-y-auto transition-colors">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Selected Files ({files.length})</h3>
                 <button onClick={() => setFiles([])} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Clear All</button>
               </div>
               <div className="space-y-3">
                 {files.map((file, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={idx} 
                      className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 group transition-colors"
                    >
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 border border-slate-100 dark:border-slate-700">
                        <File size={20} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                         onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                         className="text-slate-300 hover:text-rose-500 transition-colors"
                       >
                        <X size={16} />
                      </button>
                    </motion.div>
                 ))}
               </div>
               
               <div className="mt-8 space-y-4">
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full gradient-btn py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <SparklesIcon size={18} />
                        Analyze & Generate Notes
                      </>
                    )}
                  </button>
                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-6 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800 rounded-3xl text-left">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="text-cyan-500" size={16} />
                            <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">AI Content Insight</h4>
                          </div>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap">
                          {result}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={handleExportPDF}
                          style={{ cursor: 'pointer' }}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                        >
                          <Download size={18} />
                          Download PDF
                        </button>
                        <button 
                          onClick={handleExportMarkdown}
                          style={{ cursor: 'pointer' }}
                          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all"
                        >
                          <FileText size={18} className="text-cyan-500" />
                          Markdown
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <button 
                    onClick={() => setFiles([])}
                    className="w-full py-4 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
               </div>
            </div>
          )}
        </motion.div>
      </div>

      <div className="h-20" />
    </div>
  );
}

function SparklesIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
