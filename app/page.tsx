"use client";
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import ChemistryTimer from '@/components/ChemistryTimer';
import DevelopingImage from '@/components/DevelopingImage';

const MENU = [
  { id: "events", label: "EVENTS" },
  { id: "landschaft", label: "LANDSCHAFT" },
  { id: "street", label: "STREET" },
  { id: "personen", label: "PERSONEN" }
];

let globalCanvasBuffer: ImageData | null = null;
let bufferWidth = 0;
let bufferHeight = 0;

export default function DarkroomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [images, setImages] = useState<{ url: string }[]>([]);

  useEffect(() => {
    let rafId: number;
    
    const updatePosition = (x: number, y: number) => {
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);

      if (!currentCategory && canvasRef.current) {
        rafId = requestAnimationFrame(() => {
          const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100); 
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 100, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); 

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(rafId);
    };
  }, [currentCategory]);

  useEffect(() => {
    if (currentCategory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const init = () => {
      if (!ctx) return; 

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (globalCanvasBuffer && bufferWidth === canvas.width && bufferHeight === canvas.height) {
        ctx.putImageData(globalCanvasBuffer, 0, 0);
      } else {
        ctx.fillStyle = 'black'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        globalCanvasBuffer = null;
      }
      ctx.globalCompositeOperation = 'destination-out';
    };
    
    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, [currentCategory]);

  const selectCategory = async (label: string) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        globalCanvasBuffer = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        bufferWidth = canvasRef.current.width;
        bufferHeight = canvasRef.current.height;
      }
    }
    setLoading(true);
    const { data, error } = await supabase.from('images').select('url').eq('category', label);
    if (!error) setImages(data || []);
    setTimeout(() => { setLoading(false); setCurrentCategory(label); }, 2300);
  };

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative">
      <AnimatePresence>
        {loading && <ChemistryTimer onComplete={() => {}} />}
      </AnimatePresence>

      <div className="custom-cursor" />

      {!currentCategory ? (
        <div className="relative h-full w-full bg-black touch-none">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 md:gap-12 p-4">
            {MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => selectCategory(item.label)}
                className="text-4xl md:text-9xl font-black text-white tracking-tighter hover:text-red-600 transition-colors duration-500 uppercase select-none"
              >
                {item.label}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />
          <div className="pointer-events-none fixed inset-0 z-30 opacity-20" style={{ background: `radial-gradient(circle 150px at var(--x) var(--y), rgba(220, 38, 38, 0.4) 0%, transparent 100%)` }} />
          <div className="absolute bottom-10 w-full text-center z-40 px-6">
            <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }} className="font-mono text-[9px] md:text-[10px] text-white tracking-[0.4em] md:tracking-[0.6em] uppercase">
              Wische, um das Archiv zu belichten
            </motion.p>
          </div>
        </div>
      ) : (
        <div className="p-4 md:p-16 overflow-y-auto h-full hide-scrollbar relative bg-black">
          <button 
            onClick={() => setCurrentCategory(null)} 
            className="text-red-600 font-mono text-[9px] md:text-[10px] mb-8 md:mb-12 tracking-widest uppercase border border-red-600/30 px-4 md:px-6 py-2 hover:bg-red-600 hover:text-white transition-all rounded-sm relative z-50"
          >
            ← Zurück
          </button>

          <h1 className="text-5xl md:text-[8rem] font-black mb-10 md:mb-16 tracking-tighter leading-none text-white uppercase italic">
            {currentCategory}
          </h1>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto pb-40">
            {images.map((img, index) => (
              <div key={index} className="break-inside-avoid">
                <DevelopingImage src={img.url} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}