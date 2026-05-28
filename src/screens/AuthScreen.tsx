/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Github, User, Hash, Globe, Moon, Sun, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<'EN' | 'BN'>('EN');
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    fullName: '',
    studentId: '',
    batch: '',
    section: '',
    semester: '',
  });
  
  // Using direct setter from mock for UI test
  const { loginWithGoogle, loginWithEmail, registerWithEmail, isLoading } = useAuth();
  
  // We'll use a local mock login for the UI mood
  const [localLoading, setLocalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLocalLoading(true);
    
    try {
      const identifierChecked = formData.identifier.trim();
      if (!identifierChecked) {
        throw new Error('Email or Student ID is required');
      }

      if (mode === 'signin') {
        await loginWithEmail(identifierChecked, formData.password);
      } else {
        const studentIdChecked = formData.studentId.trim();
        if (!studentIdChecked || studentIdChecked.length < 5) {
          throw new Error('Valid Student ID is required.');
        }

        if (!identifierChecked.includes('@')) {
           throw new Error('A valid Email is required for registration.');
        }

        await registerWithEmail(
          identifierChecked, 
          formData.password, 
          formData.fullName, 
          studentIdChecked, 
          formData.batch, 
          formData.section, 
          formData.semester
        );
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setAuthError('Invalid credentials. Please make sure Email and Password are correct, and checking Firebase Authentication sign in options.');
      } else {
        setAuthError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-6 pb-12 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-cyan-200/30 dark:bg-cyan-900/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-200/30 dark:bg-blue-900/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-sm relative z-10">
        {/* Top Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 px-4 rounded-full flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-white dark:border-slate-700 transition-colors">
            <Globe size={14} />
            {lang}
          </button>
          <button onClick={toggleTheme} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 px-2 rounded-full text-slate-500 dark:text-slate-400 shadow-sm border border-white dark:border-slate-700 transition-colors">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} fill="currentColor" />}
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center mt-8 mb-8">
          <div className="relative">
             <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-150" />
             <img
              src="/assets/images/logo.png"
              alt="Academic X Logo"
              className="w-32 h-32 object-contain relative z-10"
              onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.src = "https://raw.githubusercontent.com/abirmahmudpritam001/Academic-X/main/assets/logo.png";
              }}
            />
          </div>
          <h1 className="text-4xl font-black text-[#1E293B] dark:text-white mt-4 tracking-tight transition-colors">Academic X</h1>
          <p className="text-slate-400 dark:text-slate-400 text-sm font-medium mt-1">Your Smart AI Study & Club Companion</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl shadow-blue-500/10 border border-white dark:border-slate-800 transition-colors">
          {/* Tab Switcher */}
          <div className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-3xl flex mb-8">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all ${
                mode === 'signin' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-md' : 'text-slate-400 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-4 rounded-2xl text-xs font-bold transition-all ${
                mode === 'register' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-md' : 'text-slate-400 dark:text-slate-400'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 p-3 rounded-2xl text-xs font-semibold text-center mt-2 border border-red-100 dark:border-red-500/20">
                {authError}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 pl-12 pr-4 text-xs font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                        <input
                          type="text"
                          placeholder="Student ID"
                          className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 pl-12 pr-4 text-xs font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <select
                            className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 px-4 text-xs font-semibold text-slate-700 dark:text-white transition-all shadow-sm appearance-none"
                            value={formData.batch}
                            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                            required
                          >
                            <option value="" disabled className="dark:bg-slate-800">Select Batch</option>
                            <option value="31" className="dark:bg-slate-800">31st</option>
                            <option value="32" className="dark:bg-slate-800">32nd</option>
                            <option value="33" className="dark:bg-slate-800">33rd</option>
                            <option value="34" className="dark:bg-slate-800">34th</option>
                            <option value="35" className="dark:bg-slate-800">35th</option>
                            <option value="36" className="dark:bg-slate-800">36th</option>
                            <option value="37" className="dark:bg-slate-800">37th</option>
                            <option value="38" className="dark:bg-slate-800">38th</option>
                            <option value="39" className="dark:bg-slate-800">39th</option>
                          </select>
                        </div>
  
                        <div className="relative group">
                          <select
                            className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 px-4 text-xs font-semibold text-slate-700 dark:text-white transition-all shadow-sm appearance-none"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            required
                          >
                            <option value="" disabled className="dark:bg-slate-800">Select Semester</option>
                            <option value="1st" className="dark:bg-slate-800">1st Sem</option>
                            <option value="2nd" className="dark:bg-slate-800">2nd Sem</option>
                            <option value="3rd" className="dark:bg-slate-800">3rd Sem</option>
                            <option value="4th" className="dark:bg-slate-800">4th Sem</option>
                            <option value="5th" className="dark:bg-slate-800">5th Sem</option>
                            <option value="6th" className="dark:bg-slate-800">6th Sem</option>
                            <option value="7th" className="dark:bg-slate-800">7th Sem</option>
                            <option value="8th" className="dark:bg-slate-800">8th Sem</option>
                          </select>
                        </div>
                      </div>
  
                      <div className="relative group">
                        <select
                          className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 px-4 text-xs font-semibold text-slate-700 dark:text-white transition-all shadow-sm appearance-none"
                          value={formData.section}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          required
                        >
                          <option value="" disabled className="dark:bg-slate-800">Select Section</option>
                          <option value="A" className="dark:bg-slate-800">Section A</option>
                          <option value="B" className="dark:bg-slate-800">Section B</option>
                          <option value="C" className="dark:bg-slate-800">Section C</option>
                          <option value="D" className="dark:bg-slate-800">Section D</option>
                          <option value="E" className="dark:bg-slate-800">Section E</option>
                          <option value="F" className="dark:bg-slate-800">Section F</option>
                        </select>
                      </div>
                  </>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder={mode === 'signin' ? "Email Address or Student ID" : "Email Address"}
                    className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 pl-12 pr-4 text-xs font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-100 dark:focus:border-cyan-900 rounded-3xl py-4.5 pl-12 pr-12 text-xs font-semibold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between px-2 text-[10px] font-bold">
              <label className="flex items-center gap-2 text-slate-400 dark:text-slate-400 cursor-pointer transition-colors">
                <input type="checkbox" className="rounded-md border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-transparent outline-none" />
                Remember me
              </label>
              <button type="button" className="text-cyan-500 hover:underline">Forgot Password?</button>
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4.5 rounded-[1.5rem] mt-6 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {localLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800" /></div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[2px] transition-colors">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={loginWithGoogle} className="flex items-center justify-center gap-3 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-800 active:scale-[0.98]">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-800 active:scale-[0.98]">
              <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">GitHub</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-xs font-semibold text-slate-400 dark:text-slate-300">
          {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
            className="text-cyan-500 font-black hover:underline"
          >
            {mode === 'signin' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
