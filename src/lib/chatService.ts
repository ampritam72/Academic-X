/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  db, 
  auth 
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion,
  getDoc,
  setDoc,
  limit
} from 'firebase/firestore';

/**
 * Ensures a user is joined to their section-specific group chat based on their student ID.
 */
export async function ensureUserJoinedSectionGroup(userId: string, studentId: string, profile?: any) {
  if (!studentId || !profile) return;

  try {
    // 1. Join Semester + Section group
    const sem = profile.semester || '7th';
    const sec = profile.section || 'B';
    const groupName = `${sem} Semester - Section ${sec}`;
    const groupChatId = `group_sem_${sem}_sec_${sec}`;

    const groupRef = doc(db, 'chats', groupChatId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      await setDoc(groupRef, {
        type: 'group',
        participants: [userId],
        name: groupName,
        section: sec,
        semester: sem,
        lastMessage: 'Welcome to your section group!',
        lastMessageAt: serverTimestamp()
      });
    } else {
      const data = groupSnap.data();
      if (!data.participants.includes(userId)) {
        await updateDoc(groupRef, { participants: arrayUnion(userId) });
      }
    }

    // 2. Join "All CR's" if CR
    if (profile.roles?.includes('CR')) {
      const crRef = doc(db, 'chats', 'group_all_crs');
      const crSnap = await getDoc(crRef);
      if (!crSnap.exists()) {
        await setDoc(crRef, {
          type: 'group',
          participants: [userId],
          name: "All CR's",
          lastMessage: 'Welcome to CR discussion!',
          lastMessageAt: serverTimestamp()
        });
      } else {
        const data = crSnap.data();
        if (!data.participants.includes(userId)) {
          await updateDoc(crRef, { participants: arrayUnion(userId) });
        }
      }
    }

    // 3. Join "All Club Leaders" if Club Leader
    if (profile.roles?.includes('Club Leader')) {
      const leaderRef = doc(db, 'chats', 'group_all_club_leaders');
      const leaderSnap = await getDoc(leaderRef);
      if (!leaderSnap.exists()) {
        await setDoc(leaderRef, {
          type: 'group',
          participants: [userId],
          name: "All Club Leaders",
          lastMessage: 'Welcome to Club Leaders discussion!',
          lastMessageAt: serverTimestamp()
        });
      } else {
        const data = leaderSnap.data();
        if (!data.participants.includes(userId)) {
          await updateDoc(leaderRef, { participants: arrayUnion(userId) });
        }
      }
    }

    return groupChatId;
  } catch (err) {
    console.error('Error joining section group:', err);
  }
}

/**
 * Assigns student ID ranges to sections in the database (Admin only)
 */
export async function setupSectionConfigs() {
  const configs = [
    { section: 'A', batch: '60', semester: '1', minId: '100', maxId: '200' },
    { section: 'B', batch: '60', semester: '1', minId: '201', maxId: '300' },
    { section: 'C', batch: '60', semester: '1', minId: '301', maxId: '400' },
  ];

  for (const config of configs) {
    const id = `${config.batch}_${config.section}`;
    await setDoc(doc(db, 'sectionConfigs', id), config);
  }
}

/**
 * Maps specific student IDs to roles as requested by the user
 */
const STUDENT_ROLE_MAP: Record<string, string[]> = {
  '231311049': ['Student', 'CR'],
  '231311070': ['Student', 'Admin'],
  '231311055': ['Student'],
  '231311060': ['Student', 'Club Leader'],
};

/**
 * Checks if a student ID should have specific roles and returns them
 */
export function getRolesForStudent(studentId: string): string[] {
  return STUDENT_ROLE_MAP[studentId] || ['Student'];
}
