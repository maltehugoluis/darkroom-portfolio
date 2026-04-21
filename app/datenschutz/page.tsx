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

export default function Datenschutz() {
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

      <div className="custom-cursor hidden md:block" />
      
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
        className="relative z-10 max-w-3xl space-y-12 pb-40 pointer-events-auto"
        onMouseEnter={(e) => { e.stopPropagation(); setIsHoveringBackground(false); }}
        onMouseLeave={(e) => { e.stopPropagation(); setIsHoveringBackground(true); }}
        onClick={(e) => e.stopPropagation()} 
      >
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl font-black italic tracking-tighter uppercase mb-16"
        >
          Datenschutz&shy;erklärung
        </motion.h1>
        
        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[12px] tracking-[0.4em] uppercase font-bold text-white/80">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase mt-4">Allgemeine Hinweise</h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
        </section>

        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[12px] tracking-[0.4em] uppercase font-bold text-white/80">2. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3 className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase mt-4">Datenschutz</h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>
          <h3 className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase mt-4">Hinweis zur verantwortlichen Stelle</h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
            Malte Breuer<br />
            Ehinger-Tor-Straße 10<br />
            88400 Biberach an der Riß<br />
            E-Mail: breuermalte@icloud.com
          </p>
        </section>

        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[12px] tracking-[0.4em] uppercase font-bold text-white/80">3. Datenerfassung auf dieser Website</h2>
          <h3 className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase mt-4">Server-Log-Dateien & Hosting (Vercel)</h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Diese Website wird extern bei Vercel Inc. gehostet. Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <ul className="list-disc list-inside text-xs text-zinc-300 ml-4 space-y-1">
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse</li>
          </ul>
          <p className="text-xs leading-relaxed text-zinc-300 mt-2">
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website.
          </p>
        </section>

        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[12px] tracking-[0.4em] uppercase font-bold text-white/80">4. Plugins und Tools</h2>
          <h3 className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase mt-4">Supabase (Datenbank & Storage)</h3>
          <p className="text-xs leading-relaxed text-zinc-300">
            Wir nutzen für die Bereitstellung von Inhalten (z. B. Bildern und Texten) den Dienst Supabase. Anbieter ist Supabase Inc. Wenn Sie unsere Website besuchen, wird eine direkte Verbindung zu den Servern von Supabase hergestellt, um die Inhalte des Portfolios abzurufen. Dabei wird Ihre IP-Adresse an Supabase übertragen. Dies stellt ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO dar (zuverlässige, sichere und schnelle Bereitstellung unseres Portfolios).
          </p>
        </section>

        <section className="space-y-4 font-mono">
          <h2 className="text-zinc-600 text-[12px] tracking-[0.4em] uppercase font-bold text-white/80">5. Ihre Rechte</h2>
          <p className="text-xs leading-relaxed text-zinc-300">
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
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