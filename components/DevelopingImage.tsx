"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

// Interface erweitert um isHighPriority
interface DevelopingImageProps {
  src: string;
  isHighPriority?: boolean;
}

export default function DevelopingImage({ src, isHighPriority = false }: DevelopingImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-zinc-900 rounded-sm shadow-2xl w-full h-full flex items-center justify-center">
      <motion.img
        src={src}
        onLoad={() => setIsLoaded(true)}
        // Hybrid-Loading: Prio 1 lädt sofort ("eager"), der Rest verzögert ("lazy")
        loading={isHighPriority ? "eager" : "lazy"}
        initial={{ opacity: 0, filter: "brightness(0) contrast(1.2)" }}
        animate={isLoaded ? { 
          opacity: 1, 
          filter: "brightness(1) contrast(1)" 
        } : {}}
        transition={{ 
          duration: 2.5, 
          ease: "easeOut" 
        }}
        className="h-full w-auto block object-contain select-none pointer-events-none"
        style={{ 
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Rotes "Entwickler"-Overlay für den Effekt */}
      <motion.div 
        initial={{ opacity: 0.6 }}
        animate={isLoaded ? { opacity: 0 } : { opacity: 0.6 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-red-900/20 pointer-events-none"
      />

      {/* Lade-Indikator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-4 h-4 border border-zinc-800 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}