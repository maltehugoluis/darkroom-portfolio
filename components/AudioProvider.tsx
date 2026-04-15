"use client";
import { useEffect, useRef } from "react";

export default function AudioProvider() {
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio nur einmal initialisieren
    if (!ambientAudioRef.current) {
      ambientAudioRef.current = new Audio("/ambient-hum.mp3");
      ambientAudioRef.current.loop = true;
      ambientAudioRef.current.volume = 0.15;
    }

    const startAmbient = () => {
      ambientAudioRef.current?.play().catch(() => {});
      window.removeEventListener("click", startAmbient);
      window.removeEventListener("touchstart", startAmbient);
    };

    window.addEventListener("click", startAmbient);
    window.addEventListener("touchstart", startAmbient);

    // Kein pause() hier – so läuft der Sound über alle Seiten hinweg weiter
  }, []);

  return null; // Diese Komponente rendert nichts Sichtbares
}