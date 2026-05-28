/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#001f3f] flex flex-col items-center justify-center text-white overflow-hidden p-8">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: -40 }}
        animate={{ scale: 1, opacity: 1, y: -40 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative w-48 h-48 mb-8">
          <motion.img
            src="/assets/images/logo.png"
            alt="Academic X Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
               const target = e.currentTarget;
               target.onerror = null;
               target.src = "https://raw.githubusercontent.com/abirmahmudpritam001/Academic-X/main/assets/logo.png";
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl"
          />
        </div>

        <motion.h1 
          className="text-5xl font-bold mb-4 tracking-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Academic X
        </motion.h1>

        <motion.div
          className="px-4 py-1.5 xs:px-6 xs:py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-[11px] xs:text-xs sm:text-sm font-medium tracking-wide opacity-80 whitespace-nowrap text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Your Smart AI Study & Club Companion
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute bottom-16 text-center italic max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p className="text-sm opacity-60 mb-2 whitespace-nowrap">Tap anywhere to continue</p>
        <p className="text-sm font-medium leading-relaxed">
          "Low CGPA can never stop the desire to grow or the passion to create something."
        </p>
      </motion.div>

      <motion.div 
        className="absolute bottom-8 w-32 h-1.5 bg-white/10 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="h-full bg-cyan-400"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
}
