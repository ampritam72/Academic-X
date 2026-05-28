import { motion } from 'motion/react';
import { ChevronLeft, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface ManageRolesProps {
  onBack: () => void;
}

export function ManageRoles({ onBack }: ManageRolesProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData.filter(u => ['Admin', 'CR', 'Club Leader'].includes(u.roles?.[0] || '')));
    });
    return unsub;
  }, []);

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveChanges = async () => {
    try {
        const updatePromises = Object.entries(pendingChanges).map(([userId, role]) =>
            // If role is set to Student, we might want to handle it differently, 
            // but for now, we just update the roles array in the user document.
            updateDoc(doc(db, 'users', userId), { roles: [role === 'Student' ? 'Student' : role] })
        );
        await Promise.all(updatePromises);
        setPendingChanges({});
        alert('Changes saved successfully!');
    } catch (err) {
        console.error("SaveChanges error", err);
        alert('Failed to save changes.');
    }
  };

  const deleteUserRole = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user\'s access (set to Student)?')) {
        try {
            await updateDoc(doc(db, 'users', userId), { roles: ['Student'] });
            alert('User role set to Student.');
        } catch (err) {
            alert('Failed to update role.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase">Manage Roles</h1>
        <button onClick={saveChanges} className="ml-auto text-indigo-500 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl">
          Save Changes
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 shadow-sm border border-slate-50 dark:border-slate-800">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 border-b last:border-0 border-slate-100 dark:border-slate-800">
             <div>
               <p className="font-bold">{u.fullName}</p>
               <p className="text-[10px] text-slate-400">ID: {u.studentId}</p>
             </div>
             <div className="flex items-center gap-2">
                <select 
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold uppercase rounded-lg p-2"
                    value={pendingChanges[u.id] || u.roles?.[0] || 'Student'}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                    <option value="CR">CR</option>
                    <option value="Club Leader">Club Leader</option>
                    <option value="Admin">Admin</option>
                </select>
                <button onClick={() => deleteUserRole(u.id)} className="text-rose-500 p-2">
                    <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
