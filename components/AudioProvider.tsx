"use client";
import { useEffect, useRef } from "react";

export default function AudioProvider() {
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
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

    // FIX: Sound stoppen, wenn die App in den Hintergrund geht (Handy aus/Tab gewechselt)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        ambientAudioRef.current?.pause();
      } else {
        // Nur wieder abspielen, wenn er vorher schon lief (vom User gestartet wurde)
        if (ambientAudioRef.current && ambientAudioRef.current.readyState >= 2) {
            ambientAudioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", startAmbient);
      window.removeEventListener("touchstart", startAmbient);
    };
  }, []);

  return null;
}