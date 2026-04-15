"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ExifReader from 'exifreader';
import ChemistryTimer from '@/components/ChemistryTimer';
import DevelopingImage from '@/components/DevelopingImage';
import Lightbox from '@/components/Lightbox';

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

function DarkroomContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [leftZoneHovered, setLeftZoneHovered] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Sofortiges Umschalten bei Rückkehr von Impressum/Datenschutz
  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'kontakt') {
      setCurrentCategory('KONTAKT');
    }
  }, [searchParams]);

  const playClickSound = () => {
    const audio = new Audio('/click.mp3'); 
    audio.volume = 0.3; 
    audio.play().catch(() => {});
  };

  const playAutofocusSound = () => {
    const audio = new Audio('/autofocus.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLeftZoneHovered(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [currentCategory]);

  // Horizontales Scrollen für Desktop
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && !isMobile && currentCategory) {
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY * 2.5;
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [currentCategory, isMobile]);

  const checkAndEnrichExif = async (imgObj: any) => {
    if (imgObj.camera && imgObj.camera !== "Unknown Camera") return imgObj;
    try {
      const response = await fetch(imgObj.url);
      const arrayBuffer = await response.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);
      const exifData = {
        camera: tags['Model']?.description || "Unknown Camera",
        lens: tags['LensModel']?.description || "Unknown Lens",
        iso: tags['ISOSpeedRatings']?.description?.toString() || "---",
        fstop: tags['FNumber']?.description || "---",
        shutter: tags['ExposureTime']?.description || "---"
      };
      await supabase.from('images').update(exifData).eq('url', imgObj.url);
      setImages(prev => prev.map(img => img.url === imgObj.url ? { ...img, ...exifData } : img));
      return { ...imgObj, ...exifData };
    } catch (err) {
      return imgObj;
    }
  };

  const selectCategory = async (label: string) => {
    playClickSound();
    playAutofocusSound();
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
      const { data, error } = await supabase.from('images').select('*').eq('category', label);
      if (!error && data) {
        const potentialImages = data.filter(img => img && img.url && typeof img.url === 'string');
        const validImages = (await Promise.all(
          potentialImages.map(async (img) => {
            const exists = await new Promise(resolve => {
              const image = new window.Image();
              image.onload = () => resolve(true);
              image.onerror = () => resolve(false);
              image.src = img.url;
            });
            return exists ? img : null;
          })
        )).filter(Boolean);
        setImages(validImages);
      }
    }
    setTimeout(() => { setLoading(false); setCurrentCategory(label); }, 1500);
  };

  const handleBackAction = () => {
    playClickSound();
    if (selectedImage) {
      setSelectedImage(null);
    } else {
      // FIX: URL bereinigen, damit das Hauptmenü wieder erscheint
      if (currentCategory === "KONTAKT") {
        window.history.replaceState(null, '', '/');
      }
      setCurrentCategory(null);
    }
  };

  useEffect(() => {
    let rafId: number;
    const updatePosition = (x: number, y: number) => {
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);
      if (!currentCategory && canvasRef.current) {
        rafId = requestAnimationFrame(() => {
          const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const radius = isMobile ? 45 : 100;
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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(rafId);
    };
  }, [currentCategory, isMobile]);

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
      setCanvasReady(true);
    };
    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, [currentCategory]);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative selection:bg-red-600 selection:text-white">
      <AnimatePresence>
        {loading && <ChemistryTimer onComplete={() => {}} />}
      </AnimatePresence>

      {(!isMobile || !currentCategory) && !leftZoneHovered && <div className="custom-cursor" />}

      {(currentCategory || selectedImage) && (
        <>
          <div 
            className="hidden md:block fixed top-0 left-0 w-32 xl:w-48 h-full z-[250] cursor-none"
            onMouseEnter={() => setLeftZoneHovered(true)}
            onMouseLeave={() => setLeftZoneHovered(false)}
            onClick={handleBackAction}
          />
          <AnimatePresence>
            {leftZoneHovered && !isMobile && !selectedImage && currentCategory && (
              <motion.div 
                initial={{ opacity: 0, x: -10, y: "-50%" }} 
                animate={{ opacity: 1, x: 0, y: "-50%" }} 
                exit={{ opacity: 0, x: -10, y: "-50%" }}
                className="fixed pointer-events-none z-[260] text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
                style={{ left: 'calc(var(--x) + 25px)', top: 'var(--y)' }}>
                ← ZURÜCK
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button initial={{ opacity: 0, scale: 0.8, x: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%' }}
            whileTap={{ scale: 0.75, rotate: 45 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={handleBackAction} 
            className="md:hidden fixed bottom-10 left-1/2 z-[300] w-16 h-16 rounded-full border-2 border-dashed border-red-600/40 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-red-600/20 flex items-center justify-center">
              <span className="text-red-600 font-mono text-lg">←</span>
            </div>
          </motion.button>
        </>
      )}

      {/* RENDER LOGIK FÜR HAUPTMENÜ / DARKROOM */}
      {!currentCategory ? (
        // FIX: Nur schwarz rendern, wenn wir gerade wirklich von Impressum laden
        searchParams.get('from') === 'kontakt' && currentCategory === null ? (
          <div className="h-screen w-screen bg-black" />
        ) : (
          <div className="relative h-full w-full bg-black touch-none">
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-6 p-4 transition-opacity duration-500 ${canvasReady ? 'opacity-100' : 'opacity-0'}`}>
              {MENU.map((item) => (
                <button key={item.id} onClick={() => selectCategory(item.label)}
                  className="text-[clamp(3.5rem,10vw,6.5rem)] font-black text-white tracking-tighter leading-none hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] active:text-red-600 transition-all duration-500 uppercase select-none outline-none">
                  {item.label}
                </button>
              ))}
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />
            <div className="absolute bottom-10 left-0 w-full text-center z-[40] px-6 pointer-events-none">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} 
                className="font-mono text-[10px] md:text-[9px] text-white tracking-[0.4em] md:tracking-[0.6em] uppercase">
                {isMobile ? "Wische, um das Archiv zu belichten" : "Bewege die Maus, um das Archiv zu belichten"}
              </motion.p>
            </div>
            <div className="pointer-events-none fixed inset-0 z-30 mix-blend-screen" 
              style={{ background: `radial-gradient(circle ${isMobile ? '200px' : '550px'} at var(--x) var(--y), rgba(255, 30, 30, 0.45) 0%, rgba(0,0,0,0) 70%)` }} 
            />
          </div>
        )
      ) : currentCategory === "KONTAKT" ? (
        <div className="p-4 md:p-16 h-full flex flex-col justify-center items-center relative bg-black text-center">
          <h1 className="text-[clamp(3.5rem,10vw,6.75rem)] font-black mb-8 text-white uppercase italic tracking-tighter transition-all duration-500 hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] font-mono">
            SAY HELLO
          </h1>
          <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-xs md:max-w-none mb-24 font-mono">
            <a href="mailto:breuermalte@icloud.com" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText("breuermalte@icloud.com"); setCopied(true); setTimeout(() => setCopied(false), 2000); playClickSound(); }} 
              className="text-xs md:text-xl font-mono text-zinc-500 tracking-[0.2em] uppercase transition-all duration-300 hover:text-red-600">
              {copied ? "KOPIERT!" : "breuermalte@icloud.com"}
            </a>
            <a href="https://www.instagram.com/breuermalte" target="_blank" rel="noopener noreferrer" onClick={playClickSound}
              className="text-xs md:text-xl font-mono text-zinc-500 tracking-[0.2em] uppercase transition-all duration-300 hover:text-red-600">
              INSTAGRAM
            </a>
          </div>

          <div className="absolute bottom-40 md:bottom-10 left-0 w-full px-6 flex flex-col items-center gap-5">
            <div className="flex gap-8">
              <Link href="/impressum?from=kontakt" className="text-[11px] font-mono text-zinc-600 hover:text-red-600 tracking-[0.2em] uppercase transition-colors">Impressum</Link>
              <Link href="/datenschutz?from=kontakt" className="text-[11px] font-mono text-zinc-600 hover:text-red-600 tracking-[0.2em] uppercase transition-colors">Datenschutz</Link>
            </div>
            <p className="text-[11px] font-mono text-zinc-700 tracking-[0.3em] uppercase">© 2026 MALTE BREUER — ALL RIGHTS RESERVED</p>
          </div>
        </div>
      ) : (
        <div 
          ref={scrollContainerRef} 
          className="h-full w-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto flex flex-col md:flex-row items-center hide-scrollbar relative bg-black"
        >
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-start pb-40 md:pb-0 px-8 md:px-[15vw]">
            <div className="flex-shrink-0 pt-6 pb-0 md:py-0 md:mr-20 flex items-center justify-center font-mono">
              <h1 className="text-[clamp(3.5rem,10vw,6.75rem)] font-black text-white uppercase italic tracking-tighter transition-all duration-500 hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)]">
                {currentCategory}
              </h1>
            </div>
            {images.map((img, index) => (
              <div key={index} className="flex-shrink-0 w-full md:w-auto h-auto md:h-[60vh] flex items-center justify-center transition-transform duration-500 hover:scale-[1.02]"
                onClick={() => { setSelectedImage(img.url); checkAndEnrichExif(img); playClickSound(); }}>
                <div className="w-full md:w-auto md:h-full"><DevelopingImage src={img.url} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence>
        {selectedImage && (
          <Lightbox src={selectedImage} exif={images.find(i => i.url === selectedImage)} onClose={() => { setSelectedImage(null); playClickSound(); }} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function DarkroomCanvas() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      <DarkroomContent />
    </Suspense>
  );
}