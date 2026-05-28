/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppContent from './AppContent';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
          
          {/* Animated Vibrant Background Layer */}
          <div className="vibrant-bg-wrapper">
            <div className="glow-orb glow-orb-1" />
            <div className="glow-orb glow-orb-2" />
            <div className="glow-orb glow-orb-3" />
            <div className="wave-overlay" />
          </div>

          <div className="relative z-10 w-full h-full min-h-screen">
            <AppContent />
          </div>
          
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
