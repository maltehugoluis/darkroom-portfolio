"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

interface DevelopingImageProps {
  src: string;
  isHighPriority?: boolean;
}

export default function DevelopingImage({ src, isHighPriority = false }: DevelopingImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-zinc-900 rounded-sm shadow-2xl w-full h-full flex items-center justify-center pointer-events-auto">
      <motion.img
        src={src}
        onLoad={() => setIsLoaded(true)}
        loading={isHighPriority ? "eager" : "lazy"}
        initial={{ opacity: 0, filter: "brightness(0)" }}
        animate={isLoaded ? { 
          opacity: 1, 
          filter: "brightness(1)" 
        } : {}}
        transition={{ 
          duration: 2, 
          ease: "easeOut" 
        }}
        /* FIX: Diese Klassen erzwingen die GPU-Nutzung und verhindern Layout-Sprünge */
        className="h-full w-auto block object-contain select-none will-change-transform transform-gpu"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      />
      
      {/* Rotes Overlay: Wir nutzen Opacity statt komplexer Filter für bessere Performance */}
      <motion.div 
        initial={{ opacity: 0.4 }}
        animate={isLoaded ? { opacity: 0 } : { opacity: 0.4 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-red-950/10 pointer-events-none"
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-4 h-4 border border-zinc-800 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}