/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseAuthProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, studentId: string, batch: string, section: string, semester: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let roles = data.roles || ['Student'];

            // Check Database 2 (userRoles) for overriding roles
            if (data.studentId) {
              try {
                const roleDocRef = doc(db, 'userRoles', String(data.studentId).trim());
                const roleSnap = await getDoc(roleDocRef);
                if (roleSnap.exists()) {
                  roles = roleSnap.data().roles || roles;
                }
              } catch (e) {
                console.warn("Could not fetch roles from Database 2:", e);
              }
            }

            setUser({ 
              id: firebaseUser.uid, 
              ...data,
              roles: roles
            } as UserProfile);
          } else {
            // Handle new user creation/fallback if needed
            setUser({
              id: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'Anonymous User',
              email: firebaseUser.email || '',
              roles: ['Student'],
              studentId: '',
            } as UserProfile);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setIsLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        const initialRoles: UserRole[] = ['Student'];
        // Initial check for Admin status during registration
        // Note: Real security should be on server/rules
        
        await setDoc(userRef, {
          fullName: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
          roles: initialRoles,
          studentId: '', 
          batch: '',
          section: '',
          semester: '',
          points: 0,
          streakDays: 0,
          cgpa: 0,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      let emailToLogin = cleanIdentifier;
      
      // If identifier doesn't look like an email, find it by Student ID
      if (!cleanIdentifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('studentId', '==', cleanIdentifier));
        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
        } catch (error) {
          handleFirestoreError(error, 'list' as any, 'users');
          throw error;
        }
        
        if (querySnapshot.empty) {
          throw new Error('This Student ID / Email is not registered yet. Please sign up.');
        }
        
        const userData = querySnapshot.docs[0].data();
        emailToLogin = userData.email;
        if (!emailToLogin) throw new Error('User record found but email is missing. Please contact support.');
      }
      
      try {
        await signInWithEmailAndPassword(auth, emailToLogin, pass);
      } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-password') {
          throw new Error('Incorrect password. Please try again.');
        } else if (error.code === 'auth/user-not-found') {
          throw new Error('No account found with this email/ID.');
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Email Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, studentId: string, batch: string, section: string, semester: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = studentId.trim();

    try {
      // Check if studentId is already in use
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('studentId', '==', cleanId));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        handleFirestoreError(error, 'list' as any, 'users');
        throw error;
      }
      
      if (!querySnapshot.empty) {
        throw new Error(`Student ID ${cleanId} is already registered. If this is you, please Login instead.`);
      }

      const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      await updateFirebaseAuthProfile(result.user, { displayName: name.trim() });
      
      const userRef = doc(db, 'users', result.user.uid);
      
      const initialRoles: UserRole[] = ['Student'];
      try {
        await setDoc(userRef, {
          fullName: name.trim() || 'Anonymous User',
          email: cleanEmail,
          roles: initialRoles,
          studentId: cleanId,
          batch: batch.trim(),
          section: section.trim(),
          semester: semester.trim(),
          points: 0,
          streakDays: 0,
          cgpa: 0,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, 'write' as any, `users/${result.user.uid}`);
        throw error;
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use. Try logging in.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      }
      console.error("Email Register error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("updateProfile error", error);
      throw error;
    }
  };

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    if (user.email === 'abirmahmudpritam001@gmail.com' || user.email === 'abirmahmudpritam@gmail.com') return true;
    if (user.roles.includes('Admin')) return true;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
