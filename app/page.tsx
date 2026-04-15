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
  { id: "personen", label: "PERSONEN" },
  { id: "kontakt", label: "KONTAKT" }
];

let globalCanvasBuffer: ImageData | null = null;
let bufferWidth = 0;
let bufferHeight = 0;

export default function DarkroomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [images, setImages] = useState<{ url: string }[]>([]);
  
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const playClickSound = () => {
    const audio = new Audio('/click.mp3'); 
    audio.volume = 0.4; 
    audio.play().catch(err => console.log("Audio play blocked:", err));
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    let rafId: number;
    
    const updatePosition = (x: number, y: number) => {
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);

      if (!currentCategory && canvasRef.current) {
        rafId = requestAnimationFrame(() => {
          const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const radius = window.innerWidth < 768 ? 45 : 100;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius); 
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
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

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
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
    playClickSound();

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        globalCanvasBuffer = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        bufferWidth = canvasRef.current.width;
        bufferHeight = canvasRef.current.height;
      }
    }
    
    setLoading(true);

    if (label !== "KONTAKT") {
      const { data, error } = await supabase.from('images').select('url').eq('category', label);
      if (!error) setImages(data || []);
    }
    
    setTimeout(() => { setLoading(false); setCurrentCategory(label); }, 1500);
  };

  const handleCopy = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); 
    navigator.clipboard.writeText("breuermalte@icloud.com"); 
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative">
      <AnimatePresence>
        {loading && <ChemistryTimer onComplete={() => {}} />}
      </AnimatePresence>

      <div className="custom-cursor" />

      {currentCategory && (
        <button 
          onClick={() => {
            playClickSound(); 
            setCurrentCategory(null);
          }} 
          className="fixed top-6 left-6 md:top-10 md:left-10 z-[100] group flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 bg-black/60 backdrop-blur-md border border-red-900/40 text-red-600 font-mono text-[10px] md:text-xs tracking-widest uppercase hover:bg-red-950/40 hover:text-red-400 hover:border-red-600/60 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300 rounded-sm"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          <span>Zurück</span>
        </button>
      )}

      {!currentCategory ? (
        <div className="relative h-full w-full bg-black touch-none">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(1rem,3vh,3rem)] p-4">
            {MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => selectCategory(item.label)}
                // HIER: Minimalgröße auf 3.5rem (wie text-6xl) hochgesetzt, wächst bis 6.5rem
                className="text-[clamp(3.5rem,10vw,6.5rem)] font-black text-white tracking-tighter leading-none hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] transition-all duration-500 uppercase select-none"
              >
                {item.label}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />
          <div 
            className="pointer-events-none fixed inset-0 z-30 opacity-20" 
            style={{ 
              background: `radial-gradient(circle ${isMobile ? '60px' : '150px'} at var(--x) var(--y), rgba(220, 38, 38, 0.4) 0%, transparent 100%)` 
            }} 
          />
          <div className="absolute bottom-10 w-full text-center z-40 px-6">
            <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }} className="font-mono text-[12px] md:text-[10px] text-white tracking-[0.4em] md:tracking-[0.6em] uppercase">
              Wische, um das Archiv zu belichten
            </motion.p>
          </div>
        </div>
      ) : currentCategory === "KONTAKT" ? (
        
        <div className="p-4 md:p-16 pt-32 h-full flex flex-col justify-center items-center relative bg-black">
          <h1 className="text-[clamp(3.5rem,min(10vw,14vh),6.75rem)] font-black mb-[clamp(1.5rem,5vh,4rem)] tracking-tighter leading-none text-white uppercase italic text-center hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] transition-all duration-500">
            SAY HELLO
          </h1>

          <div className="flex flex-col items-center gap-[clamp(1rem,4vh,2.5rem)]">
            <a 
              href="mailto:breuermalte@icloud.com" 
              onClick={handleCopy}
              className="group relative text-[clamp(1rem,min(3vw,4vh),25.5px)] font-mono text-zinc-500 hover:text-white hover:[text-shadow:0_0_15px_rgba(255,255,255,0.5)] transition-all tracking-[0.2em] uppercase cursor-none"
            >
              {copied ? "KOPIERT!" : "breuermalte@icloud.com"}
              
              <span className={`absolute -bottom-3 left-0 h-[2px] bg-red-600 transition-all duration-500 ${copied ? 'w-full shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'w-0 group-hover:w-full group-hover:shadow-[0_0_15px_rgba(220,38,38,0.8)]'}`}></span>
            </a>

            <a 
              href="https://www.instagram.com/mhlensvisuals/" 
              target="_blank" 
              rel="noreferrer"
              className="group relative text-[clamp(1rem,min(3vw,4vh),25.5px)] font-mono text-zinc-500 hover:text-white hover:[text-shadow:0_0_15px_rgba(255,255,255,0.5)] transition-all tracking-[0.2em] uppercase cursor-none"
            >
              @instagram
              <span className="absolute -bottom-3 left-0 w-0 h-[2px] bg-red-600 group-hover:w-full group-hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all duration-500"></span>
            </a>
          </div>
        </div>

      ) : (

        <div className="p-4 pt-28 md:p-16 md:pt-32 overflow-y-auto h-full hide-scrollbar relative bg-black">
          <h1 className="text-[clamp(3.5rem,min(10vw,14vh),6.75rem)] font-black mb-[clamp(1.5rem,5vh,4rem)] tracking-tighter leading-none text-white uppercase italic hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] transition-all duration-500">
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