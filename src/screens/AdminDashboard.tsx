/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, Shield, Users, Database, Settings, Search, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setupSectionConfigs } from '../lib/chatService';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, addDoc, query, where, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ManageRoles } from './ManageRoles';
import { SystemDashboard } from './SystemDashboard';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isInitializingChats, setIsInitializingChats] = useState(false);
  const [chatSuccess, setChatSuccess] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showManageRoles, setShowManageRoles] = useState(false);
  const [showSystemActions, setShowSystemActions] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', studentId: '', role: 'Student' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });
    return unsub;
  }, []);

  if (showManageRoles) {
    return <ManageRoles onBack={() => setShowManageRoles(false)} />;
  }

  if (showSystemActions) {
    return <SystemDashboard onBack={() => setShowSystemActions(false)} />;
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveChanges = async () => {
    try {
        const updatePromises = Object.entries(pendingChanges).map(([userId, role]) =>
            updateDoc(doc(db, 'users', userId), { roles: [role] })
        );
        await Promise.all(updatePromises);
        setPendingChanges({});
        alert('Changes saved successfully!');
    } catch (err) {
        console.error("SaveChanges error", err);
        alert('Failed to save changes.');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.studentId) return;

    try {
        // Step 1: Check if user exists in Database 1 (users)
        const q = query(collection(db, 'users'), where('studentId', '==', String(newUser.studentId).trim()));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            alert('ID not found in user database. The student must register first.');
            return;
        }

        const userDoc = snap.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Step 2: Save/Update Role in Database 2 (userRoles)
        // We use studentId as the document ID in userRoles for easy lookup
        await setDoc(doc(db, 'userRoles', String(newUser.studentId).trim()), {
            uid: userId,
            studentId: String(newUser.studentId).trim(),
            fullName: userData.fullName || newUser.name,
            roles: [newUser.role],
            updatedAt: serverTimestamp()
        });

        // Also sync it to the main user profile for backward compatibility if needed, 
        // but the user requested Database 2 to be the primary source for roles.
        await updateDoc(doc(db, 'users', userId), {
            roles: [newUser.role]
        });

        alert(`Role "${newUser.role}" successfully assigned to ${userData.fullName || newUser.name}`);
        setIsAddingUser(false);
        setNewUser({ name: '', studentId: '', role: 'Student' });
    } catch (err) {
        console.error("AddUser error", err);
        alert('Failed to process role assignment.');
    }
  };

  const handleSetupChats = async () => {
    setIsInitializingChats(true);
    try {
      await setupSectionConfigs();
      setChatSuccess(true);
      setTimeout(() => setChatSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitializingChats(false);
    }
  };

  if (!user || !user.roles.includes('Admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <Shield className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-xl font-black uppercase">Access Denied</h2>
          <p className="text-slate-500 text-xs mt-2">Only system administrators can access this area.</p>
          <button onClick={onBack} className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Return Home</button>
        </div>
      </div>
    );
  }

  const totalStudents = users.length;
  const dataUsagePercentage = Math.min(Math.round((users.length / 2000) * 100), 100);

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col p-6 transition-colors">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Admin Terminal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tracking-wide">System Management</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard icon={<Users size={20} />} label="Total Students" value={totalStudents.toString()} color="text-blue-500" />
        <StatCard icon={<Database size={20} />} label="Data Usage" value={`${dataUsagePercentage}%`} color="text-purple-500" />
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">User Management</h3>
            <div className="flex gap-2">
                <button 
                  onClick={() => setIsAddingUser(true)}
                  className="text-indigo-500 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl"
                >
                    Add User Role
                </button>
                <button 
                  onClick={() => setShowManageRoles(true)}
                  className="text-indigo-500 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl"
                >
                    Manage All
                </button>
            </div>
            
            {isAddingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-sm">
                        <h2 className="text-xl font-black mb-4">Add User Role</h2>
                        <input className="w-full p-3 mb-1 rounded-xl border dark:bg-slate-800 dark:border-slate-700" placeholder="Student ID (Compulsory)" value={newUser.studentId} onChange={e => {
                            const id = e.target.value;
                            // Search in local state (ensuring string comparison)
                            const foundUser = users.find(u => String(u.studentId).trim() === String(id).trim());
                            setNewUser({...newUser, studentId: id, name: foundUser ? foundUser.fullName : (newUser.name || '')});
                        }} required />
                        {newUser.studentId && !users.find(u => String(u.studentId).trim() === String(newUser.studentId).trim()) && (
                            <p className="text-rose-500 text-[10px] mb-4 px-1 font-bold">⚠️ ID not found in Database 1</p>
                        )}
                        <input className="w-full p-3 mb-4 rounded-xl border dark:bg-slate-800 dark:border-slate-700" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Assign Role</label>
                            <select className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="Student">Student</option>
                                <option value="CR">CR</option>
                                <option value="Club Leader">Club Leader</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsAddingUser(false)} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                            <button 
                                onClick={handleAddUser} 
                                disabled={!newUser.studentId}
                                className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                {users.find(u => String(u.studentId).trim() === String(newUser.studentId).trim()) ? 'Update Role' : 'Create & Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
            {users.filter(u => u.roles?.some((r: string) => ['Admin', 'CR', 'Club Leader', 'Faculty'].includes(r))).map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[2rem] transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center font-bold text-indigo-500 overflow-hidden uppercase text-[10px]">
                     {u.fullName?.[0] || 'U'}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-0.5">ID: {u.studentId || 'N/A'} • {u.roles?.[0] || 'Student'}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2 mb-4">System Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleSetupChats}
              disabled={isInitializingChats}
              className="w-full bg-white dark:bg-slate-900 p-4 rounded-[2rem] flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                    {chatSuccess ? <CheckCircle className="text-emerald-500" /> : <MessageSquare className="text-indigo-500" />}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {isInitializingChats ? 'Configuring...' : chatSuccess ? 'Configs Active' : 'Setup Chat Sections'}
                  </span>
               </div>
               <ChevronLeft className="text-slate-200 dark:text-slate-800 rotate-180" size={18} />
            </button>
            <ActionItem icon={<Settings className="text-slate-400" />} label="Database Configuration" onClick={() => setShowSystemActions(true)} />
            <ActionItem icon={<Shield className="text-emerald-500" />} label="Security Protocol" onClick={() => setShowSystemActions(true)} />
            <ActionItem icon={<Search className="text-blue-500" />} label="System Audit Logs" onClick={() => setShowSystemActions(true)} />
          </div>
        </section>
      </div>

      <div className="h-24" />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm">
       <div className={`${color} mb-3 opacity-80`}>{icon}</div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{value}</p>
    </div>
  );
}

function ActionItem({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full bg-white dark:bg-slate-900 p-4 rounded-[2rem] flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">{icon}</div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
       </div>
       <ChevronLeft className="text-slate-200 dark:text-slate-800 rotate-180" size={18} />
    </button>
  );
}
