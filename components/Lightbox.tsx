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
      // Der gesamte Hintergrund schließt die Lightbox
      onClick={onClose}
      onMouseEnter={() => setIsHoveringBackground(true)}
      onMouseLeave={() => setIsHoveringBackground(false)}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 md:p-12 cursor-none"
    >
      {/* Hover-Text folgt dem Cursor überall auf dem Hintergrund */}
      <AnimatePresence>
        {isHoveringBackground && !isMobile && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed pointer-events-none z-[220] text-red-600 font-mono text-[10px] tracking-widest whitespace-nowrap"
            style={{ 
              left: 'calc(var(--x) + 20px)', 
              top: 'var(--y)', 
              transform: 'translateY(-50%)' 
            }}
          >
            ✕ SCHLIESSEN
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="relative flex flex-col md:flex-row items-center justify-center w-full max-w-5xl h-full gap-8 md:gap-16 z-[210]"
        // Verhindert, dass Klicks auf das Bild oder die EXIF-Daten die Lightbox schließen
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsHoveringBackground(false)}
        onMouseLeave={() => setIsHoveringBackground(true)}
      >
        
        {/* BILD-CONTAINER */}
        <div className="flex-[2] flex items-center justify-center w-full h-full max-h-[50vh] md:max-h-[70vh]">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={src}
            className="max-h-full max-w-full object-contain shadow-2xl border border-zinc-900"
            alt="Fullscreen"
          />
        </div>

        {/* EXIF SEITENLEISTE */}
        <div className="flex-1 md:max-w-[200px] w-full flex md:flex-col justify-between md:justify-center gap-6 border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-10">
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