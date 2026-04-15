"use client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Datenschutz() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setIsHovering(true);
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main 
      className="min-h-screen bg-black text-zinc-400 font-mono p-8 md:p-24 selection:bg-red-600 selection:text-white cursor-none overflow-hidden relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => router.push('/?from=kontakt')}
    >
      <style>{`.custom-cursor { opacity: 0 !important; }`}</style>
      <AnimatePresence>
        {isHovering && (
          <div className="fixed top-0 left-0 pointer-events-none z-[600]" style={{ transform: 'translate3d(var(--x), var(--y), 0) translate(-50%, -50%)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap">
              ← ZURÜCK
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="relative z-10 max-w-3xl space-y-12 pointer-events-none">
        <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase mb-16">Datenschutz</h1>
        <section className="space-y-4 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">1. Hosting</h2>
          <p>Diese Website wird bei Vercel gehostet. Technisch notwendige Daten werden verarbeitet.</p>
        </section>
        <section className="space-y-4 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">2. Infrastruktur</h2>
          <p>Bilder werden über Supabase bereitgestellt. Es werden keine Nutzerprofile erstellt.</p>
        </section>
      </div>
    </main>
  );
}