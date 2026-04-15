"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxProps {
  src: string;
  onClose: () => void;
  imageData?: {
    location?: string;
    camera_model?: string;
    year?: string;
  };
}

export default function Lightbox({ src, onClose, imageData }: LightboxProps) {
  const [isHoveringBackground, setIsHoveringBackground] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onMouseEnter={() => setIsHoveringBackground(true)}
      onMouseLeave={() => setIsHoveringBackground(false)}
      className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 md:p-12 md:cursor-none"
    >
      {isHoveringBackground && !isMobile && (
        <style>{`.custom-cursor { opacity: 0 !important; }`}</style>
      )}

      {/* CUSTOM CURSOR ZUM SCHLIESSEN */}
      <AnimatePresence>
        {isHoveringBackground && !isMobile && (
          <div 
            className="fixed top-0 left-0 pointer-events-none z-[600]"
            style={{ 
              transform: 'translate3d(var(--x), var(--y), 0) translate(-50%, -50%)' 
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
            >
              SCHLIESSEN
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col md:flex-row items-center justify-center w-full max-w-6xl h-full gap-8 md:gap-16 z-[210] pointer-events-none">
        
        {/* BILD-CONTAINER */}
        <div 
          className="flex-[3] flex items-center justify-center w-full h-full max-h-[55vh] md:max-h-[80vh] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHoveringBackground(false)}
          onMouseLeave={() => setIsHoveringBackground(true)}
        >
          <motion.img
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={src}
            className="max-h-full max-w-full object-contain shadow-2xl border border-zinc-900"
            alt="Selected Work"
          />
        </div>

        {/* METADATEN SEITENLEISTE (MANUELL GEFPLEGT) */}
        <div 
          className="flex-1 md:max-w-[250px] w-full flex md:flex-col justify-between md:justify-center gap-8 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-12 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHoveringBackground(false)}
          onMouseLeave={() => setIsHoveringBackground(true)}
        >
          <div className="space-y-6">
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-[0.2em]">Location</p>
              <p className="text-[12px] md:text-[14px] text-white font-mono tracking-widest uppercase italic leading-tight">
                {imageData?.location || "Unknown Location"}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-[0.2em]">Camera</p>
                <p className="text-[11px] text-red-600 font-mono tracking-[0.15em] uppercase">
                  {imageData?.camera_model || "N/A"}
                </p>
              </div>
              
              <div>
                <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-[0.2em]">Year</p>
                <p className="text-[11px] text-zinc-400 font-mono tracking-widest">
                  {imageData?.year || "----"}
                </p>
              </div>
            </div>
          </div>

          {/* Deko-Element für Darkroom-Vibe */}
          <div className="hidden md:block mt-12 border-t border-zinc-900 pt-4">
            <p className="text-[24px] font-black text-zinc-800 leading-none font-mono tracking-tighter select-none">
              {imageData?.year ? `REF-${imageData.year.slice(-2)}` : "FRAME"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}