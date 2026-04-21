"use client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

if (typeof window !== 'undefined') {
  if (!(window as any).clickAudio) {
    (window as any).clickAudio = new Audio('/click.mp3');
    (window as any).clickAudio.volume = 0.3;
  }
}

export default function Impressum() {
  const router = useRouter();
  const [isHoveringBackground, setIsHoveringBackground] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleBack = () => {
    const audio: HTMLAudioElement | null = (window as any).clickAudio;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
    setTimeout(() => router.push('/?from=kontakt'), 150);
  };

  return (
    <main 
      className={`h-[100dvh] bg-black text-zinc-400 font-mono p-8 md:p-24 selection:bg-red-600 selection:text-white md:cursor-none overflow-y-auto relative`}
      onMouseEnter={() => setIsHoveringBackground(true)}
      onMouseLeave={() => setIsHoveringBackground(false)}
      onClick={handleBack}
    >
      {/* CSS-Hack: Blendet den custom-cursor aus, wenn wir auf dem Hintergrund sind */}
      <style>{`
        .custom-cursor { 
          opacity: ${isHoveringBackground ? '0' : '1'} !important; 
          transition: opacity 0.2s ease;
        }
      `}</style>

      {/* DER ORIGINALE ROTE CURSOR (Punkt) */}
      <div className="custom-cursor hidden md:block" />
      
      {/* DER "ZURÜCK" TEXT (Erscheint nur auf dem Hintergrund) */}
      <AnimatePresence>
        {isHoveringBackground && (
          <div 
            className="hidden md:block fixed top-0 left-0 pointer-events-none z-[600]" 
            style={{ transform: 'translate3d(var(--x), var(--y), 0) translate(-50%, -50%)' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
            >
              ← ZURÜCK
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div 
        className="relative z-10 max-w-2xl space-y-12 pb-40 pointer-events-auto"
        onMouseEnter={(e) => { e.stopPropagation(); setIsHoveringBackground(false); }}
        onMouseLeave={(e) => { e.stopPropagation(); setIsHoveringBackground(true); }}
        onClick={(e) => e.stopPropagation()} 
      >
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl font-black italic tracking-tighter uppercase mb-16"
        >
          Impressum
        </motion.h1>
        
        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">Angaben gemäß § 5 DDG</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Malte Breuer<br />
            Ehinger-Tor-Straße 10<br />
            88400 Biberach an der Riß
          </p>
        </section>

        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">Kontakt</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            E-Mail: breuermalte@icloud.com
          </p>
        </section>

        <section className="space-y-4 pt-12 border-t border-zinc-900 font-mono text-zinc-500">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">Haftung & Urheberrecht</h2>
          <p className="text-[11px] leading-relaxed">
            Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. 
            Vervielfältigung, Bearbeitung und jede Art der Verwertung bedürfen meiner schriftlichen Zustimmung.
          </p>
          <p className="text-[10px] italic pt-4">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: Malte Breuer
            <br />
            Private Portfolio Website gemäß § 5 DDG
          </p>
        </section>
      </div>

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
    </main>
  );
}