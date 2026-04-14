import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ChemistryTimer({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    "ENTWICKLER ANSETZEN...",
    "STOPPBAD AKTIV...",
    "FIXIERER ARBEITET...",
    "BILD WIRD SICHTBAR..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 550); 

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-red-600 overflow-hidden"
    >
      {/* Noise-Overlay für Textur */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
        }} 
      />

      {/* Roter Glow-Anstieg von unten */}
      <motion.div 
        initial={{ height: "0%" }}
        animate={{ height: "100%" }}
        transition={{ duration: 2.3, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-900/30 to-transparent"
      />

      {/* Pulsierendes Licht im Raum */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(220,38,38,0.05)_100%)] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        {/* Kreis-Animation */}
        <div className="relative w-24 h-24 mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2.3, ease: "circInOut" }}
            className="absolute inset-0 border-[3px] border-red-900 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 2.3, ease: "circInOut" }}
            className="absolute inset-0 border-[3px] border-transparent border-t-red-600 border-b-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            />
          </div>
        </div>
        
        {/* Text-Container (Höhe vergrößert auf h-16, damit nichts abschneidet) */}
        <div className="h-16 overflow-hidden relative w-full max-w-md flex justify-center items-center">
          <motion.div
            key={step}
            initial={{ y: 30, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -30, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-mono text-lg md:text-2xl tracking-[0.4em] font-bold text-red-600 absolute text-center w-full py-2"
            style={{ textShadow: '0 0 15px rgba(220,38,38,0.6)' }}
          >
            {steps[step]}
          </motion.div>
        </div>
        
        {/* Technische Daten (unten drunter) */}
        <div className="mt-8 font-mono text-[9px] md:text-xs text-red-800 tracking-[0.3em] flex gap-4 opacity-70">
          <span>T: 20°C</span>
          <span>AGITATION: CONT</span>
          <span>ISO: 400</span>
        </div>
      </div>
    </motion.div>
  );
}