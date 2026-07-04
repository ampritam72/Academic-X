import { motion } from 'motion/react';
import { ChevronLeft, MessageSquare, Database, Shield, FileText } from 'lucide-react';

interface SystemDashboardProps {
  onBack: () => void;
}

export function SystemDashboard({ onBack }: SystemDashboardProps) {
  const actions = [
    { name: 'Setup Chat Sections', icon: MessageSquare, description: 'Manage chat rooms' },
    { name: 'Database Configuration', icon: Database, description: 'Manage DB structure' },
    { name: 'Security Protocol', icon: Shield, description: 'Firebase Rules' },
    { name: 'System Audit Logs', icon: FileText, description: 'View system logs' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase">System Actions</h1>
      </header>

      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.name} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 rounded-2xl">
                <action.icon size={20} />
              </div>
              <div>
                <p className="font-black text-sm">{action.name}</p>
                <p className="text-[10px] text-slate-400">{action.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
