"use client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, Fragment } from 'react';
import { supabase } from '@/lib/supabase';

export default function About() {
  const router = useRouter();
  const [isHoveringBackground, setIsHoveringBackground] = useState(false);
  const [isImageLifted, setIsImageLifted] = useState(false);
  const [isHoveringClose, setIsHoveringClose] = useState(false);
  const [meImageUrl, setMeImageUrl] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageLifted(true);
    const audio: HTMLAudioElement | null = typeof window !== 'undefined' ? (window as any).clickAudio : null;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.2;
      clone.play().catch(() => {});
    }
  };

  const closeLiftedImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const audio: HTMLAudioElement | null = typeof window !== 'undefined' ? (window as any).clickAudio : null;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.2;
      clone.play().catch(() => {});
    }
    setTimeout(() => {
      setIsImageLifted(false);
      setIsHoveringClose(false);
    }, 150);
  };

  useEffect(() => {
    // Supabase Bild mit Kategorie "ME" laden
    const fetchMeImage = async () => {
      const { data } = await supabase
        .from('images')
        .select('url')
        .eq('category', 'ME')
        .limit(1);
        
      if (data && data.length > 0) {
        setMeImageUrl(data[0].url);
      }
    };
    fetchMeImage();

    // Audio sauber innerhalb der Komponente initialisieren
    if (typeof window !== 'undefined') {
      if (!(window as any).clickAudio) {
        (window as any).clickAudio = new Audio('/click.mp3');
        (window as any).clickAudio.volume = 0.3;
      }
    }

    let rafId: number | null = null;
    let targetX = -100;
    let targetY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--x', `${targetX}px`);
          document.documentElement.style.setProperty('--y', `${targetY}px`);
          
          rafId = null;
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleBack = () => {
    const audio: HTMLAudioElement | null = typeof window !== 'undefined' ? (window as any).clickAudio : null;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
    setTimeout(() => router.push('/?from=kontakt'), 150);
  };

  return (
    <main 
      className="h-[100dvh] w-full bg-[#0a0a0a] text-zinc-400 font-mono px-4 md:px-12 selection:bg-red-950 selection:text-white md:cursor-none overflow-x-hidden overflow-y-auto relative flex flex-col items-center"
      onClick={handleBack}
      onMouseEnter={() => setIsHoveringBackground(true)}
      onMouseLeave={() => setIsHoveringBackground(false)}
    >
      {/* Hintergrund-Textur (Fotokarton mit Rauschen) */}
      <div className="fixed inset-0 bg-[#0a0a0a] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20250%20250%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%226%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.015] pointer-events-none -z-10" />

      {/* Cursor-Hack: Laser verschwindet bei Background-Hover */}
      <style>{`
        .custom-cursor { 
          opacity: ${(isHoveringBackground && !isImageLifted) || isHoveringClose ? '0' : '1'} !important; 
          transition: opacity 0.2s ease;
        }
      `}</style>

      <div className="custom-cursor hidden md:block" />
      
      <AnimatePresence>
        {isHoveringBackground && !isImageLifted && (
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

      <AnimatePresence>
        {isHoveringClose && isImageLifted && (
          <div 
            className="hidden md:block fixed top-0 left-0 pointer-events-none z-[800]" 
            style={{ transform: 'translate3d(var(--x), var(--y), 0) translate(-50%, -50%)' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
            >
              ✕ SCHLIESSEN
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer Top für sicheres vertikales Zentrieren trotz Scroll */}
      <div className="flex-1 min-h-[4rem] md:min-h-[6rem] shrink-0 pointer-events-none" />

      {/* --- DIE PERGAMIN-HÜLLE (Glassine Sleeve) --- */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 2, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl aspect-[4/5] sm:aspect-square md:aspect-[4/3] bg-black/60 backdrop-blur-md shadow-[0_30px_80px_rgba(0,0,0,0.7)] rounded-sm p-6 md:p-12 pointer-events-auto overflow-hidden border border-white/5 shrink-0"
        onClick={(e) => e.stopPropagation()} 
        onMouseEnter={(e) => { e.stopPropagation(); setIsHoveringBackground(false); }}
        onMouseLeave={(e) => { e.stopPropagation(); setIsHoveringBackground(true); }}
      >
        <div 
          className="absolute inset-6 md:inset-12 pointer-events-auto"
          style={{ visibility: isImageLifted ? 'hidden' : 'visible' }}
        >
          <TextContent imageUrl={meImageUrl} onImageClick={handleImageClick} />
        </div>

      </motion.div>

      {/* Spacer Bottom (etwas größer auf Mobile für den Zurück-Button) */}
      <div className="flex-1 min-h-[8rem] md:min-h-[6rem] shrink-0 pointer-events-none" />

      <AnimatePresence>
        {isImageLifted && meImageUrl && (
          <motion.div
            className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer md:cursor-none"
            onClick={closeLiftedImage}
            onMouseEnter={() => setIsHoveringClose(true)}
            onMouseLeave={() => setIsHoveringClose(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              layoutId="profile-image"
              className="w-auto h-[60vh] max-w-[80vw] md:h-[75vh] md:max-w-[50vw] shadow-2xl rounded-md border-2 border-white/20 p-1 bg-white/5 md:cursor-none relative"
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => { e.stopPropagation(); setIsHoveringClose(false); }}
              onMouseLeave={(e) => { e.stopPropagation(); setIsHoveringClose(true); }}
            >
              <img 
                src={meImageUrl} 
                alt="Operator" 
                className="w-full h-full object-cover rounded-sm"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Back Button */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8, x: '-50%' }} 
        animate={{ opacity: 1, scale: 1, x: '-50%' }}
        whileTap={{ scale: 0.75, rotate: 45 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isImageLifted) {
            closeLiftedImage(e);
          } else {
            handleBack(); 
          }
        }}
        className="md:hidden fixed bottom-10 left-1/2 z-[900] w-16 h-16 rounded-full border-2 border-dashed border-red-600/40 bg-black/20 backdrop-blur-sm flex items-center justify-center"
      >
        <div className="w-10 h-10 rounded-full border border-red-600/20 flex items-center justify-center">
          <span className="text-red-600 font-mono text-lg">{isImageLifted ? "✕" : "←"}</span>
        </div>
      </motion.button>
    </main>
  );
}

/* --- DIE TEXT INHALTE --- */
function TextContent({ imageUrl, onImageClick }: { imageUrl: string | null, onImageClick: (e: React.MouseEvent) => void }) {
  const baseTextColor = 'text-zinc-200';
  const highlightColor = 'text-white';
  const quoteColor = 'text-zinc-100';

  return (
    <div className={`flex flex-col w-full h-full font-mono transition-colors duration-200 text-[10px] md:text-[13px] ${baseTextColor} overflow-y-auto hide-scrollbar pr-2 pb-4`}>
      
      <div className="flex justify-between items-start border-b border-dashed border-white/20 mb-4 md:mb-6 pb-3 md:pb-4">
        <div className={`tracking-[0.1em] ${highlightColor} pt-1`}>
          FILE_ID: MB_LOG_2026
        </div>
        {imageUrl && (
          <motion.div 
            layoutId="profile-image"
            className="w-12 h-16 md:w-16 md:h-20 shrink-0 border border-white/20 p-0.5 bg-white/5 shadow-md pointer-events-auto cursor-pointer"
            style={{ rotate: 6 }}
            onClick={onImageClick}
          >
            <img 
              src={imageUrl} 
              alt="Operator" 
              className="w-full h-full object-cover transition-colors duration-500 grayscale-[0.3] contrast-110"
            />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-[90px_1fr] md:grid-cols-[140px_1fr] gap-y-1 mb-4 md:mb-6">
        <span className={highlightColor}>OPERATOR:</span><span>Malte</span>
        <span className={highlightColor}>ORIGIN:</span><span>Biberach, DE</span>
        <span className={highlightColor}>ACTIVE_SINCE:</span><span>2023</span>
        <span className={highlightColor}>PROCESS:</span><span>Digital / Visual Archive</span>
      </div>

      <div className="mb-4 md:mb-6">
        <span className={`${highlightColor} block mb-1`}>OBJECTIVE:</span>
        <p className="leading-relaxed pr-2 md:pr-4">
          Drei Jahre aktive Beobachtung. Von der kontrollierten Atmosphäre einer Hochzeit bis zur rohen Energie eines Festivals.
        </p>
      </div>

      <div className="mb-4 md:mb-8">
        <span className="block mb-1">Focusing on:</span>
        <ul className="space-y-0.5">
          <li><span className={highlightColor}>&gt;</span> Event & Festival Documentation</li>
          <li><span className={highlightColor}>&gt;</span> Travel Photography</li>
          <li><span className={highlightColor}>&gt;</span> Street Fragments</li>
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-3 md:gap-4">
        <p className={`italic leading-relaxed ${quoteColor}`}>
          "Die Kamera ist das Werkzeug, um das Chaos der Wirklichkeit in ein geordnetes Archiv zu überführen."
        </p>
        
        <div className="flex justify-between items-center border-t border-white/10 pt-3 md:pt-4 text-[9px] md:text-xs tracking-[0.2em] uppercase mt-2">
          <span className={highlightColor}>[ SYSTEM_READY ]</span>
          <div className="flex gap-3 md:gap-4">
          <a 
            href="mailto:breuermalte@icloud.com" 
            className={`pointer-events-auto ${highlightColor} hover:text-red-500 transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            [MAIL]
          </a>
          <a 
            href="https://www.instagram.com/mhlensvisuals" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`pointer-events-auto ${highlightColor} hover:text-red-500 transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            [IG]
          </a>
          </div>
        </div>
      </div>

    </div>
  );
}
