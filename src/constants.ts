/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Code, PieChart, FileText, Calendar, Search, FileEdit, Bell, Sparkles, Navigation, UserCircle, Briefcase, Map } from 'lucide-react';

export const COLORS = {
  primary: '#0ea5e9', // Blue
  secondary: '#2dd4bf', // Teal/Cyan
  accent: '#a855f7', // Purple
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
};

export const DASHBOARD_CARDS = [
  {
    id: 'notices',
    title: 'Notices',
    description: 'Official & Section updates',
    icon: Bell,
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50',
    iconColor: 'text-teal-500',
    path: '/notices',
  },
  {
    id: 'lr-cover',
    title: 'LR Cover/Index Maker',
    description: 'Generate Lab Report covers',
    icon: FileEdit,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    path: '/lr-cover',
  },
  {
    id: 'slide-analyzer',
    title: 'Slide Analyzer',
    description: 'AI-powered notes from your slides',
    icon: BookOpen,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    path: '/slide-analyzer',
  },
  {
    id: 'code-explainer',
    title: 'Code Explainer',
    description: 'Paste code → Get explanation',
    icon: Code,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
    path: '/code-explainer',
  },
  {
    id: 'all-slides',
    title: 'All Slides',
    description: 'Academic Materials Repository',
    icon: FileText,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    path: '/all-slides',
  },
  {
    id: 'cgpa-calculator',
    title: 'CGPA Calculator',
    description: 'Track and simulate your grades',
    icon: PieChart,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    iconColor: 'text-rose-500',
    path: '/cgpa-calculator',
  },
  {
    id: 'smart-study',
    title: 'Smart Study Suite',
    description: 'AI notes & study planner',
    icon: Sparkles,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
    path: '/smart-study',
  },
  {
    id: 'skill-roadmap',
    title: 'Skill Roadmap',
    description: 'Learning paths & projects',
    icon: Map,
    color: 'bg-cyan-600',
    lightColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    path: '/skill-roadmap',
  },
];
