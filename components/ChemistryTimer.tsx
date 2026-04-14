"use client";
import { motion } from 'framer-motion';

export default function ChemistryTimer({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-40 h-40">
        <svg className="w-full h-full rotate-[-90deg]">
          <circle
            cx="80" cy="80" r="70"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-zinc-900"
          />
          <motion.circle
            cx="80" cy="80" r="70"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-red-600"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, ease: "linear" }}
            onAnimationComplete={onComplete}
          />
        </svg>
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[1px] h-16 bg-red-600 origin-bottom"
          style={{ x: "-50%", y: "-100%" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, ease: "linear" }}
        />
      </div>
      <motion.p 
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-10 font-mono text-red-600 tracking-[0.6em] text-[10px] uppercase"
      >
        Entwicklungsphase...
      </motion.p>
    </motion.div>
  );
}