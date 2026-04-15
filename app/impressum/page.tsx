"use client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Impressum() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleBack = () => {
    // Sound abspielen
    const audio = new Audio('/click.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});

    // Navigation zurück zur Kontakt-Sektion
    router.push('/?from=kontakt');
  };

  return (
    <main 
      className="min-h-screen bg-black text-zinc-400 font-mono p-8 md:p-24 selection:bg-red-600 selection:text-white md:cursor-none overflow-y-auto md:overflow-hidden relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleBack}
    >
      <style>{`.custom-cursor { opacity: 0 !important; }`}</style>
      
      {/* Desktop Morph-Cursor mit flüssigerer Animation */}
      <AnimatePresence>
        {isHovering && (
          <div 
            className="hidden md:block fixed top-0 left-0 pointer-events-none z-[600]" 
            style={{ transform: 'translate3d(var(--x), var(--y), 0) translate(-50%, -50%)' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
            >
              ← ZURÜCK
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobiler Zurück-Button mit haptischem Feedback */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8, x: '-50%' }} 
        animate={{ opacity: 1, scale: 1, x: '-50%' }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => { e.stopPropagation(); handleBack(); }}
        className="md:hidden fixed bottom-10 left-1/2 z-[300] w-16 h-16 rounded-full border-2 border-dashed border-red-600/40 bg-black/20 backdrop-blur-sm flex items-center justify-center"
      >
        <div className="w-10 h-10 rounded-full border border-red-600/20 flex items-center justify-center">
          <span className="text-red-600 font-mono text-lg">←</span>
        </div>
      </motion.button>

      <div className="relative z-10 max-w-2xl space-y-12 pointer-events-none pb-40 md:pb-0">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl font-black italic tracking-tighter uppercase mb-16"
        >
          Impressum
        </motion.h1>
        
        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">Angaben gemäß § 5 TMG</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Malte Breuer<br />
            [DEINE STRASSE]<br />
            [DEINE PLZ & STADT]
          </p>
        </section>

        <section className="space-y-4 pt-12 border-t border-zinc-900 font-mono">
          <p className="text-[10px] leading-relaxed text-zinc-700 italic">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Malte Breuer
          </p>
        </section>
      </div>
    </main>
  );
}