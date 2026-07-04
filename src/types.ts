/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Student' | 'CR' | 'Club Leader' | 'Admin';

export interface UserProfile {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  roles: UserRole[];
  batch?: string;
  section?: string;
  semester?: string;
  department?: string;
  cgpa?: number;
  avatarUrl?: string;
  streakDays?: number;
  savedNotesCount?: number;
  points?: number;
  myClubs?: string[];
}

export type ScreenId = 
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'study'
  | 'clubs'
  | 'chat'
  | 'profile'
  | 'slide-analyzer'
  | 'code-explainer'
  | 'cgpa-calculator'
  | 'all-slides'
  | 'routine'
  | 'paper-finder'
  | 'lr-cover'
  | 'notices'
  | 'smart-study'
  | 'smart-navigation'
  | 'resume-builder'
  | 'skill-roadmap';

export interface ClubEvent {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  description: string;
  date: string; // ISO format for easy sorting
  location: string;
  imageUrl?: string;
  type: 'Upcoming' | 'Previous';
  details?: string;
  isFbPost?: boolean;
  guests?: string[];
  interestedUids?: string[];
}

export interface Club {
  id: string;
  name: string;
  description: string;
  about?: string;
  iconColor: string;
  bannerUrl?: string;
  logoUrl?: string;
  fbPageId?: string;
  mentor?: {
    name: string;
    designation: string;
    imageUrl?: string;
  };
  leader?: {
    name: string;
    role: string; // CA/CD/President
    imageUrl?: string;
    leaderUid?: string;
  };
}
