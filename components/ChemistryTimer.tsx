import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function ChemistryTimer({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // 1.5 Sekunden Übergang - genug Zeit für das "Fokussieren"
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020202]"
    >
      {/* Kamera-Sucher Rahmen (Viewfinder) */}
      <div className="absolute inset-4 md:inset-12 border border-white/5 pointer-events-none">
        {/* Ecken-Markierungen */}
        <div className="absolute top-0 left-0 w-6 h-6 md:w-10 md:h-10 border-t-2 border-l-2 border-red-800/60" />
        <div className="absolute top-0 right-0 w-6 h-6 md:w-10 md:h-10 border-t-2 border-r-2 border-red-800/60" />
        <div className="absolute bottom-0 left-0 w-6 h-6 md:w-10 md:h-10 border-b-2 border-l-2 border-red-800/60" />
        <div className="absolute bottom-0 right-0 w-6 h-6 md:w-10 md:h-10 border-b-2 border-r-2 border-red-800/60" />
        
        {/* Fadenkreuz subtil im Hintergrund */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-900/20 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-red-900/20 -translate-x-1/2" />
      </div>

      <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48">
        {/* Fokus-Ring (rotiert leicht beim "Scharfstellen") */}
        <motion.div
          initial={{ rotate: -45, scale: 1.1, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 border border-dashed border-red-900/40 rounded-full"
        />

        {/* Fokus-Klammern (snappen in die Mitte) */}
        <motion.div 
          initial={{ width: "120px", opacity: 0 }}
          animate={{ width: "40px", opacity: 1 }}
          // backOut lässt die Klammern kurz über das Ziel hinausschießen (wie echter Autofokus)
          transition={{ duration: 0.4, delay: 0.2, ease: "backOut" }}
          className="flex justify-between items-center h-8 md:h-10 absolute"
        >
          <div className="w-2 h-full border-l-2 border-t-2 border-b-2 border-red-600 rounded-l-sm shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
          <div className="w-2 h-full border-r-2 border-t-2 border-b-2 border-red-600 rounded-r-sm shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
        </motion.div>

        {/* Fokus-Bestätigung (roter Punkt leuchtet auf, wenn scharfgestellt ist) */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.1 }}
          className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_15px_rgba(220,38,38,1)]"
        />
      </div>

      {/* Kamera-Display Infos am unteren Rand */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-8 md:bottom-16 flex justify-between w-full max-w-xs px-6 font-mono text-[10px] md:text-xs text-red-700/60 tracking-[0.2em]"
      >
        <motion.span 
          animate={{ opacity: [1, 0.4, 1] }} 
          transition={{ duration: 0.5, delay: 0.6 }} // Blinkt kurz auf, wenn Fokus sitzt
          className="text-red-500 font-bold"
        >
          AF-S
        </motion.span>
        <span>f/1.4</span>
        <span>1/125</span>
        <span>ISO400</span>
      </motion.div>
    </motion.div>
  );
}