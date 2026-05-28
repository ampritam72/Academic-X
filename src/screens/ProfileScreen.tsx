/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronRight, Edit2, Lock, Moon, Globe, Languages, Bell, Info, LogOut, Award, Star, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, ReactNode, useEffect, ChangeEvent, FormEvent } from 'react';
import { auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { useTheme } from '../context/ThemeContext';
import { AboutCSE } from './AboutCSE';
import { AboutDeveloper } from './AboutDeveloper';
import { requestNotificationPermission } from '../services/notificationService';

export function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedMood, setSelectedMood] = useState('Study');
  const [showCSEAbout, setShowCSEAbout] = useState(false);
  const [showDevAbout, setShowDevAbout] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : {
      language: true,
      aiTranslation: false,
      classReminders: true,
    };
  });
  
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    studentId: user?.studentId || '',
    batch: user?.batch || '',
    section: user?.section || '',
    semester: user?.semester || '',
    avatarUrl: user?.avatarUrl || '',
  });

  // Reset scroll to top when toggling subpages or edit state
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' as any });
    document.body.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [showCSEAbout, showDevAbout, isEditing]);

  useEffect(() => {
    if (user && isEditing) {
      setEditData({
        fullName: user?.fullName || '',
        studentId: user?.studentId || '',
        batch: user?.batch || '',
        section: user?.section || '',
        semester: user?.semester || '',
        avatarUrl: user?.avatarUrl || '',
      });
      setImageError(null);
    }
  }, [isEditing, user]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setImageError("Please upload a standard PNG or JPEG/JPG photo.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be under 2MB to ensure smooth storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditData(prev => ({ ...prev, avatarUrl: result }));
    };
    reader.onerror = () => {
      setImageError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      if (updateProfile) {
        await updateProfile(editData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!auth.currentUser) {
      setPasswordError("You must be logged in to change your password.");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Reauthenticate user
      const userEmail = auth.currentUser.email;
      if (!userEmail) {
        throw new Error("User email not found.");
      }
      
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Change password
      await updatePassword(auth.currentUser, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError("Incorrect current password.");
      } else {
        setPasswordError(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) return null;

  if (showCSEAbout) {
    return <AboutCSE onBack={() => setShowCSEAbout(false)} />;
  }

  if (showDevAbout) {
    return <AboutDeveloper onBack={() => setShowDevAbout(false)} />;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    if (key === 'classReminders' && newValue) {
      await requestNotificationPermission();
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pb-24 transition-colors">
      {/* Profile Header Card */}
      <div className="px-6 pt-16 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 flex flex-col items-center">
           <div className="relative mb-6">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/assets/images/profile.png';
                  }}
                />
              ) : (
                <img 
                  src="/assets/images/profile.png" 
                  alt="Profile" 
                  className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 to-blue-500 border-4 border-white dark:border-slate-800 shadow-xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('profile.png') && user.fullName) {
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
                    }
                  }}
                />
              )}
           </div>

           <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{user.fullName}</h2>
           <div className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 mb-6 ring-1 ring-cyan-100 dark:ring-cyan-800 uppercase transition-colors text-center font-sans tracking-wider leading-none">
              <Award size={12} />
              {user.roles.join(', ')}
           </div>

           <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col items-center justify-center transition-colors">
                 <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mb-1">Student ID</p>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.studentId || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col items-center justify-center transition-colors">
                 <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mb-1">Batch</p>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.batch || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col items-center justify-center transition-colors">
                 <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mb-1">Section</p>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.section || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex flex-col items-center justify-center transition-colors">
                 <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter mb-1">Semester</p>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.semester || 'N/A'}</p>
              </div>
           </div>

           <div className="w-full mt-6 flex items-center justify-center py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-2xl font-black text-sm ring-1 ring-emerald-100 dark:ring-emerald-800 transition-colors">
              <Star className="mr-2" size={16} />
              Academic Profile
           </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-6 space-y-6 mt-4">
        <section>
           <h3 className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2 mb-4">Account Settings</h3>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 space-y-1 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
              <ProfileItem onClick={() => setIsEditing(true)} icon={<Edit2 className="text-blue-500" size={18} />} label="Edit Profile Picture" />
              <ProfileItem onClick={() => {
                setIsChangingPassword(true);
                setPasswordError(null);
                setPasswordSuccess(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }} icon={<Lock className="text-purple-500" size={18} />} label=" Change Password" />
           </div>
        </section>

        <section>
           <h3 className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2 mb-4">Settings & Preferences</h3>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 space-y-1 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
              <ToggleItem 
                icon={<Moon className="text-amber-500" size={18} />} 
                label="Dark Mode" 
                subtext={theme === 'dark' ? 'On' : 'Off'}
                active={theme === 'dark'} 
                onToggle={toggleTheme} 
              />
              <ToggleItem 
                icon={<Bell className="text-rose-400" size={18} />} 
                label="Class Reminders" 
                active={settings.classReminders} 
                onToggle={() => toggleSetting('classReminders')} 
              />
              <ProfileItem onClick={() => setShowDevAbout(true)} icon={<Code className="text-indigo-500" size={18} />} label="About Developers" />
              <ProfileItem onClick={() => setShowCSEAbout(true)} icon={<Info className="text-teal-500" size={18} />} label="About Dept. of CSE, VU" />
           </div>
        </section>

        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-white dark:bg-slate-900 py-5 rounded-[2.5rem] text-rose-500 font-bold shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>

        <div className="text-center pt-4 opacity-50 dark:opacity-30 transition-opacity">
          <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-400">Academic X v1.0.0</p>
          
        </div>
      </div>

      <div className="h-24" />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
              <LogOut className="text-rose-500" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">Sign Out?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Are you sure you want to sign out of your account? You will need to log in again to access your academic resources.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-[1.5] flex justify-center items-center py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoggingOut ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Full Interactive Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 relative my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 text-center mb-6">Edit Profile Picture</h3>

            {/* Profile Avatar Picker */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {editData.avatarUrl ? (
                  <img 
                    src={editData.avatarUrl} 
                    alt="Upload Preview" 
                    className="w-28 h-28 rounded-[2rem] border-4 border-cyan-500 shadow-xl object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/assets/images/profile.png';
                    }}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-500 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-white font-bold text-3xl">
                    {editData.fullName ? editData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              <label 
                htmlFor="photo-upload-input" 
                className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 text-xs font-black rounded-xl cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/60 active:scale-95 transition-all text-center border border-cyan-100 dark:border-cyan-900/30 uppercase tracking-wider"
              >
                Choose Photo (PNG / JPG)
              </label>
              <input 
                type="file" 
                id="photo-upload-input" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              {imageError ? (
                <p className="text-[11px] text-rose-500 font-bold mt-2 text-center">{imageError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center font-medium">JPEG or PNG under 2MB to save cleanly.</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm active:scale-95 transition-all outline-none"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-[1.5] flex justify-center items-center py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog Overlay/Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 relative my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 text-center mb-6">Change Password</h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Current Password</label>
                <input 
                  type="password"
                  required
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none text-slate-800 dark:text-white transition-all"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">New Password (Min 6 chars)</label>
                <input 
                  type="password"
                  required
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none text-slate-800 dark:text-white transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none text-slate-800 dark:text-white transition-all"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <p className="text-[11px] text-rose-500 font-bold text-center bg-rose-50 dark:bg-rose-950/20 py-2.5 px-3 rounded-xl border border-rose-100/30 dark:border-rose-900/40">{passwordError}</p>
              )}

              {passwordSuccess && (
                <p className="text-[11px] text-emerald-500 font-bold text-center bg-emerald-50 dark:bg-emerald-950/20 py-2.5 px-3 rounded-xl border border-emerald-100/30 dark:border-emerald-900/40">✓ Password changed successfully! Closing...</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={isUpdatingPassword}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-sm active:scale-95 transition-all outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingPassword || passwordSuccess}
                  className="flex-[1.5] flex justify-center items-center py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                >
                  {isUpdatingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileItem({ icon, label, onClick }: { icon: ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[2rem] transition-colors group">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center ring-1 ring-slate-100 dark:ring-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
       </div>
       <ChevronRight className="text-slate-200 dark:text-slate-700" size={18} />
    </button>
  );
}

function ToggleItem({ icon, label, subtext, active, onToggle }: { icon: ReactNode, label: string, subtext?: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="w-full flex items-center justify-between p-4 rounded-[2rem]">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center ring-1 ring-slate-100 dark:ring-slate-800 transition-colors">
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
            {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{subtext}</p>}
          </div>
       </div>
       <button 
        onClick={onToggle}
        className={`w-12 h-7 rounded-full p-1 transition-all relative ${active ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-800'}`}
       >
         <div className={`w-5 h-5 bg-white dark:bg-slate-200 rounded-full transition-transform shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
       </button>
    </div>
  );
}
