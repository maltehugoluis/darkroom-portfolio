"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxProps {
  src: string;
  onClose: () => void;
  exif?: {
    camera: string;
    lens: string;
    iso: string;
    fstop: string;
    shutter: string;
  };
}

export default function Lightbox({ src, onClose, exif = {
  camera: "LEICA M10",
  lens: "35MM SUMMICRON",
  iso: "400",
  fstop: "F/2.0",
  shutter: "1/250"
} }: LightboxProps) {
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
      // Schließt die Lightbox beim Klick auf den Hintergrund
      onClick={onClose}
      onMouseEnter={() => setIsHoveringBackground(true)}
      onMouseLeave={() => setIsHoveringBackground(false)}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 md:p-12 cursor-none"
    >
      {isHoveringBackground && !isMobile && (
        <style>{`.custom-cursor { opacity: 0 !important; }`}</style>
      )}

      <AnimatePresence>
        {isHoveringBackground && !isMobile && (
          <div 
            className="fixed top-0 left-0 pointer-events-none z-[220]"
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

      <div className="relative flex flex-col md:flex-row items-center justify-center w-full max-w-5xl h-full gap-8 md:gap-16 z-[210] pointer-events-none">
        
        {/* BILD-CONTAINER */}
        <div 
          className="flex-[2] flex items-center justify-center w-full h-full max-h-[50vh] md:max-h-[70vh] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHoveringBackground(false)}
          onMouseLeave={() => setIsHoveringBackground(true)}
        >
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={src}
            className="max-h-full max-w-full object-contain shadow-2xl border border-zinc-900"
            alt="Fullscreen"
          />
        </div>

        {/* EXIF SEITENLEISTE */}
        <div 
          className="flex-1 md:max-w-[200px] w-full flex md:flex-col justify-between md:justify-center gap-6 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-10 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHoveringBackground(false)}
          onMouseLeave={() => setIsHoveringBackground(true)}
        >
          <div className="space-y-5">
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-tighter">Device</p>
              <p className="text-[11px] text-red-600 font-mono tracking-widest uppercase italic">{exif.camera}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-tighter">Optics</p>
              <p className="text-[11px] text-zinc-300 font-mono tracking-widest uppercase">{exif.lens}</p>
            </div>
          </div>

          <div className="flex md:flex-col gap-6">
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-tighter">ISO</p>
              <p className="text-[11px] text-zinc-400 font-mono">{exif.iso}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-tighter">Aperture</p>
              <p className="text-[11px] text-zinc-400 font-mono">{exif.fstop}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-600 font-mono mb-1 uppercase tracking-tighter">Exposure</p>
              <p className="text-[11px] text-zinc-400 font-mono">{exif.shutter}</p>
            </div>
          </div>

          <div className="hidden md:block mt-10 opacity-20">
            <p className="text-[30px] font-black text-white leading-none font-mono">01A</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}