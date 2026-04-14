"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DevelopingImage({ src }: { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-zinc-900 rounded-sm shadow-2xl mb-6 w-full">
      {/* WICHTIG: Das 'aspect-ratio' wurde entfernt, 
         damit das Bild seine natürliche Höhe behält. 
      */}
      <motion.img
        src={src}
        onLoad={() => setIsLoaded(true)}
        initial={{ opacity: 0 }}
        animate={isLoaded ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-full h-auto block object-contain"
        style={{ 
          transform: 'translateZ(0)',
          // Verhindert das Flackern beim Laden
          minHeight: isLoaded ? 'auto' : '200px' 
        }}
      />
      
      {/* Lade-Indikator (Sichtbar solange das Bild lädt) */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="w-6 h-6 border border-zinc-700 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}