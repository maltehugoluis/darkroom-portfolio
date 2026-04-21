"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ChemistryTimer from '@/components/ChemistryTimer';
import Lightbox from '@/components/Lightbox';

const MENU = [
  { id: "events", label: "EVENTS" },
  { id: "landschaft", label: "LANDSCHAFT" },
  { id: "street", label: "STREET" },
  { id: "personen", label: "PERSONEN" },
  { id: "kontakt", label: "KONTAKT" }
];

// Globale Buffer außerhalb der Komponente, damit sie beim Navigieren erhalten bleiben
let globalCanvasBuffer: ImageData | null = null;
let bufferWidth = 0;
let bufferHeight = 0;

// Zeitstempel für Sound-Debouncing, um doppelte Wiedergaben rigoros zu verhindern
let lastClickPlayTime = 0;
let lastAutofocusPlayTime = 0;
let lastNegativePlayTime = 0;
let globalMouseX = -100;
let globalMouseY = -100;

// AUDIO GLOBALS ZUM VORLADEN
if (typeof window !== 'undefined') {
  if (!(window as any).clickAudio) {
    (window as any).clickAudio = new Audio('/click.mp3');
    (window as any).clickAudio.volume = 0.3;
  }
  if (!(window as any).autofocusAudio) {
    (window as any).autofocusAudio = new Audio('/autofocus.mp3');
    (window as any).autofocusAudio.volume = 0.4;
  }
  if (!(window as any).negativeAudio) {
    (window as any).negativeAudio = new Audio('/negative.mp3');
    (window as any).negativeAudio.volume = 0.4;
  }
}

function DarkroomContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const zurueckRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isShortScreen, setIsShortScreen] = useState(false);
  const [leftZoneHovered, setLeftZoneHovered] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [markerProgress, setMarkerProgress] = useState<Record<number, number>>({});
  const [isNegative, setIsNegative] = useState(false);
  
  const stateDepth = useRef(0);

  // Hintergrund-Preload für alle Kategorien
  useEffect(() => {
    const preloadAllCategories = async () => {
      const targetCategories = MENU.filter(m => m.id !== "kontakt").map(m => m.label);
      for (const cat of targetCategories) {
        const { data } = await supabase
          .from('images')
          .select('url')
          .eq('category', cat)
          .order('prio', { ascending: true })
          .limit(2);

        if (data) {
          data.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.url;
            document.head.appendChild(link);
          });
        }
      }
    };
    const timer = setTimeout(preloadAllCategories, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'kontakt') {
      setCurrentCategory('KONTAKT');
      window.history.replaceState(null, '', '/');
    }
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      if (stateDepth.current > 0) stateDepth.current -= 1;
      if (selectedImage) setSelectedImage(null);
      else if (currentCategory) setCurrentCategory(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentCategory, selectedImage]);

  const playClickSound = () => {
    const now = Date.now();
    if (now - lastClickPlayTime < 50) return; // 50ms Blockade
    lastClickPlayTime = now;

    const audio: HTMLAudioElement | null = (window as any).clickAudio;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
  };

  const playAutofocusSound = () => {
    const now = Date.now();
    if (now - lastAutofocusPlayTime < 50) return;
    lastAutofocusPlayTime = now;

    const audio: HTMLAudioElement | null = (window as any).autofocusAudio;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
  };

  const playNegativeSound = () => {
    const now = Date.now();
    if (now - lastNegativePlayTime < 100) return; // 100ms Blockade für den Modus-Switch
    lastNegativePlayTime = now;

    const audio: HTMLAudioElement | null = (window as any).negativeAudio;
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(() => {});
    }
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortScreen(window.innerHeight < 600); // Zeitleiste bei geringer Höhe ausblenden
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setLeftZoneHovered(false);
    setIsNegative(false); // Negativ-Modus beim Wechseln der Kategorie immer zurücksetzen
    if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
  }, [currentCategory]);

  // Easter Egg: Konami Code Listener
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          document.body.classList.toggle('easter-egg');
          playAutofocusSound(); // Akustisches Feedback bei Aktivierung!
          konamiIndex = 0;
        }
      } else {
        // Bei einem Fehler zurücksetzen
        konamiIndex = e.key.toLowerCase() === konamiCode[0].toLowerCase() ? 1 : 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && !isMobile && currentCategory) {
      let targetScroll = el.scrollLeft;
      let isAnimating = false;
      let animationFrameId: number;

      const updateScroll = () => {
        const currentScroll = el.scrollLeft;
        const diff = targetScroll - currentScroll;
        
        if (Math.abs(diff) > 1) {
          el.scrollLeft += diff * 0.25; // Knackigeres Easing für direktes Gefühl ohne Nachziehen
          animationFrameId = requestAnimationFrame(updateScroll);
        } else {
          el.scrollLeft = targetScroll;
          isAnimating = false;
        }
      };

      const onWheel = (e: WheelEvent) => {
        // Horizontales Trackpad-Scrollen absolut nativ verarbeiten lassen!
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          if (isAnimating) {
            cancelAnimationFrame(animationFrameId);
            isAnimating = false;
          }
          targetScroll = el.scrollLeft;
          return;
        }

        if (e.deltaY === 0) return;
        e.preventDefault();
        
        if (!isAnimating) targetScroll = el.scrollLeft;
        targetScroll += e.deltaY;
        const maxScroll = el.scrollWidth - el.clientWidth;
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
        
        if (!isAnimating) {
          isAnimating = true;
          animationFrameId = requestAnimationFrame(updateScroll);
        }
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        el.removeEventListener('wheel', onWheel);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [currentCategory, isMobile]);

  // ANGEPASST: Speichert den Canvas-Stand beim Klick auf eine Kategorie
  const selectCategory = async (label: string) => {
    playAutofocusSound();

    // Backup des aktuellen Canvas-Stands machen
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
      const { data } = await supabase
        .from('images')
        .select('*')
        .eq('category', label)
        .order('prio', { ascending: true })
        .order('created_at', { ascending: false });
      if (data) setImages(data);
    }

    setTimeout(() => { 
      setLoading(false); 
      setCurrentCategory(label); 
      stateDepth.current += 1;
      window.history.pushState({ category: label }, '', '/');
    }, 1500);
  };

  const handleBackAction = () => {
    playClickSound();
    setTimeout(() => {
      if (stateDepth.current > 0) window.history.back();
      else {
        if (selectedImage) setSelectedImage(null);
        else {
          setCurrentCategory(null);
          window.history.replaceState(null, '', '/');
        }
      }
    }, 150);
  };

  // Cursor und Canvas-Freikratzen
  useEffect(() => {
    let rafId: number | null = null;

    // Synchronisiere interne Maus-Koordinaten mit CSS-Variablen (z.B. beim Zurückkommen vom Impressum)
    const storedX = document.documentElement.style.getPropertyValue('--x');
    const storedY = document.documentElement.style.getPropertyValue('--y');
    if (storedX && storedY) {
      globalMouseX = parseFloat(storedX);
      globalMouseY = parseFloat(storedY);
      if (beamRef.current) {
        beamRef.current.style.background = `radial-gradient(circle ${isMobile ? '85px' : '180px'} at ${globalMouseX}px ${globalMouseY}px, currentColor 0%, rgba(0,0,0,0) 100%)`;
      }
    }

    const updatePosition = (x: number, y: number) => {
      globalMouseX = x;
      globalMouseY = y;
      
      document.documentElement.style.setProperty('--x', `${x}px`);
      document.documentElement.style.setProperty('--y', `${y}px`);

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (zurueckRef.current) {
            zurueckRef.current.style.left = `calc(${globalMouseX}px + 25px)`;
            zurueckRef.current.style.top = `${globalMouseY}px`;
          }
          if (beamRef.current) {
            beamRef.current.style.background = `radial-gradient(circle ${isMobile ? '85px' : '180px'} at ${globalMouseX}px ${globalMouseY}px, currentColor 0%, rgba(0,0,0,0) 100%)`;
          }

          if (!currentCategory && canvasRef.current) {
            const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              const radius = isMobile ? 60 : 130;
              const gradient = ctx.createRadialGradient(globalMouseX, globalMouseY, 0, globalMouseX, globalMouseY, radius); 
              gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(globalMouseX, globalMouseY, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          rafId = null;
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
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [currentCategory, isMobile]);

  // Canvas Initialisierung und Wiederherstellung
  useEffect(() => {
    if (currentCategory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const init = () => {
      if (!ctx) return; 
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Stand wiederherstellen, falls vorhanden und Größe passt
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

  // --- Zeitleisten Vorbereitung (Prios extrahieren) ---
  const seenPrios = new Set();
  const annotatedImages = images.map(img => {
    const isFirstOfPrio = img.prio != null && !seenPrios.has(img.prio);
    if (isFirstOfPrio) seenPrios.add(img.prio);
    return { ...img, isFirstOfPrio };
  });
  const uniquePrios = Array.from(seenPrios).sort((a: any, b: any) => a - b) as number[];

  // Exakte Marker-Positionen der Timeline berechnen
  useEffect(() => {
    const calculateMarkerPositions = () => {
      const container = scrollContainerRef.current;
      if (!container || isMobile || uniquePrios.length <= 1) return;
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      const progressMap: Record<number, number> = {};
      uniquePrios.forEach((prio) => {
        const el = document.getElementById(`prio-section-${prio}`);
        if (el) {
          // Die exakte prozentuale Scroll-Position berechnen, an der das Bild mittig steht
          const offset = el.offsetLeft - (window.innerWidth / 2) + (el.clientWidth / 2);
          const progress = Math.max(0, Math.min(offset / maxScroll, 1));
          progressMap[prio] = progress;
        }
      });
      setMarkerProgress(progressMap);
    };

    const timer = setTimeout(calculateMarkerPositions, 200);
    window.addEventListener('resize', calculateMarkerPositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateMarkerPositions);
    };
  }, [currentCategory, isMobile, uniquePrios.length, images]);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative selection:bg-red-600 selection:text-white">
      <AnimatePresence>
        {loading && <ChemistryTimer onComplete={() => {}} />}
      </AnimatePresence>

      {(!isMobile || !currentCategory) && !leftZoneHovered && <div ref={cursorRef} className="custom-cursor" />}

      {(currentCategory || selectedImage) && (
        <>
          <div className="hidden md:block fixed top-0 left-0 w-32 xl:w-48 h-full z-[250] cursor-none"
            onMouseEnter={() => setLeftZoneHovered(true)} onMouseLeave={() => setLeftZoneHovered(false)}
            onClick={handleBackAction} />
          <AnimatePresence>
            {leftZoneHovered && !isMobile && !selectedImage && currentCategory && (
              <motion.div ref={zurueckRef} initial={{ opacity: 0, x: -10, y: "-50%" }} animate={{ opacity: 1, x: 0, y: "-50%" }} exit={{ opacity: 0, x: -10, y: "-50%" }}
                className="fixed pointer-events-none z-[260] text-red-600 font-mono text-[13px] md:text-[15px] font-bold tracking-[0.3em] whitespace-nowrap"
                style={{ left: `calc(${globalMouseX}px + 25px)`, top: `${globalMouseY}px` }}>← ZURÜCK</motion.div>
            )}
          </AnimatePresence>
          <motion.button initial={{ opacity: 0, scale: 0.8, x: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%' }}
            whileTap={{ scale: 0.75, rotate: 45 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={handleBackAction} className="md:hidden fixed bottom-10 left-1/2 z-[600] w-16 h-16 rounded-full border-2 border-dashed border-red-600/40 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-red-600/20 flex items-center justify-center">
              <span className="text-red-600 font-mono text-lg">{selectedImage ? "✕" : "←"}</span>
            </div>
          </motion.button>
        </>
      )}

      {!currentCategory ? (
        searchParams.get('from') === 'kontakt' && currentCategory === null ? (
          <div className="h-screen w-screen bg-black" />
        ) : (
          <div className="relative h-full w-full bg-black touch-none flex flex-col">
            {/* Menü-Container: Exakt zentriert über den gesamten Bildschirm ohne störendes Padding */}
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-[min(3vh,1.5rem)] px-4 pointer-events-none transition-opacity duration-500 ${canvasReady ? 'opacity-100' : 'opacity-0'}`}>
              {MENU.map((item) => (
                <button key={item.id} onClick={() => selectCategory(item.label)}
                className="pointer-events-auto text-[clamp(2rem,min(10vw,8vh),6rem)] font-black text-white tracking-tighter leading-none hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] active:text-red-600 transition-all duration-500 uppercase select-none outline-none">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 w-full z-[40] h-24 flex items-center justify-center px-6 pointer-events-none pb-4 md:pb-8">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} 
                className="font-mono text-[12px] md:text-[11px] text-white tracking-[0.4em] md:tracking-[0.6em] uppercase text-center w-full drop-shadow-md">
                {isMobile ? "Wische, um das Archiv zu belichten" : "Bewege die Maus, um das Archiv zu belichten"}
              </motion.p>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />
          <div ref={beamRef} className="pointer-events-none fixed inset-0 z-30 mix-blend-screen easter-egg-beam" 
            style={{ color: 'rgba(255, 30, 30, 0.45)', background: `radial-gradient(circle ${isMobile ? '85px' : '180px'} at ${globalMouseX}px ${globalMouseY}px, currentColor 0%, rgba(0,0,0,0) 100%)` }} 
            />
          </div>
        )
      ) : currentCategory === "KONTAKT" ? (
        <div className="p-4 md:p-16 h-full flex flex-col justify-center items-center relative bg-black text-center">
          <Link href="/about?from=kontakt" onClick={playClickSound} className="block cursor-pointer outline-none">
            <h1 className="text-[clamp(3rem,min(10vw,15vh),6.75rem)] font-black mb-8 text-white uppercase italic tracking-tighter transition-all duration-500 hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)] font-mono">SAY HELLO</h1>
          </Link>
          <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-xs md:max-w-none mb-24 font-mono">
            <a href="mailto:breuermalte@icloud.com" onClick={playClickSound} 
              className="text-xs md:text-xl font-mono text-zinc-500 tracking-[0.2em] uppercase transition-all duration-300 hover:text-red-600">breuermalte@icloud.com</a>
            <a href="https://www.instagram.com/mhlensvisuals" target="_blank" rel="noopener noreferrer" onClick={playClickSound} className="text-xs md:text-xl font-mono text-zinc-500 tracking-[0.2em] uppercase transition-all duration-300 hover:text-red-600">INSTAGRAM</a>
          </div>
          <div className="absolute bottom-40 md:bottom-10 left-0 w-full px-6 flex flex-col items-center gap-5">
            <div className="flex gap-8">
              <Link href="/impressum?from=kontakt" onClick={playClickSound} className="text-[11px] font-mono text-zinc-600 hover:text-red-600 tracking-[0.2em] uppercase transition-colors">Impressum</Link>
              <Link href="/datenschutz?from=kontakt" onClick={playClickSound} className="text-[11px] font-mono text-zinc-600 hover:text-red-600 tracking-[0.2em] uppercase transition-colors">Datenschutz</Link>
            </div>
            <p className="text-[11px] font-mono text-zinc-700 tracking-[0.3em] uppercase">© 2026 MALTE BREUER — ALL RIGHTS RESERVED</p>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollContainerRef} onScroll={() => {
            if (scrubberRef.current && scrollContainerRef.current) {
              const el = scrollContainerRef.current;
              const maxScroll = el.scrollWidth - el.clientWidth;
              const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
              scrubberRef.current.style.left = `calc(${progress * 100}% - ${progress * 0.75}rem)`;
            }
          }} className="h-full w-full overflow-y-auto md:overflow-y-hidden md:overflow-x-auto flex flex-col md:flex-row items-center hide-scrollbar relative bg-black">
            <div className="w-full md:w-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-start pb-40 md:pb-0 px-8 md:px-0 md:pl-[15vw]">
              <div className="flex-shrink-0 pt-6 pb-0 md:py-0 md:mr-20 flex items-center justify-center font-mono">
                <h1 className="text-[clamp(3rem,min(10vw,15vh),6.75rem)] font-black text-white uppercase italic tracking-tighter transition-all duration-500 hover:text-red-600 hover:[text-shadow:0_0_30px_rgba(220,38,38,0.8)]">{currentCategory}</h1>
              </div>
              {annotatedImages.length > 0 ? (
                <>
                  {annotatedImages.map((img, index) => (
                    <div key={index} id={img.isFirstOfPrio ? `prio-section-${img.prio}` : undefined} className="flex-shrink-0 w-full md:w-auto min-h-[30vh] md:min-w-[300px] h-auto md:h-[60vh] flex items-center justify-center cursor-pointer group"
                      onClick={() => { setSelectedImage(img.url); playClickSound(); stateDepth.current += 1; window.history.pushState({ image: img.url }, '', '/'); }}>
                      <img 
                        src={img.url} 
                        alt={`Archive ${index}`}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                        onLoad={(e) => {
                          e.currentTarget.classList.remove('opacity-0', 'blur-[10px]');
                        }}
                        className={`h-full w-auto block object-contain select-none pointer-events-none rounded-lg opacity-0 blur-[10px] transition-all duration-700 ease-out group-hover:scale-[1.02] transform-gpu will-change-transform ${!isMobile && isNegative ? 'invert' : ''}`}
                      />
                    </div>
                  ))}
                  
                  <div className="flex-shrink-0 w-full md:w-auto h-32 md:h-[60vh] hidden md:flex items-center justify-center md:pr-[15vw]">
                    <button onClick={() => { playClickSound(); scrollContainerRef.current?.scrollTo({ left: 0, top: 0, behavior: 'auto' }); }}
                      className="group flex flex-col items-center gap-4 text-zinc-600 hover:text-red-600 transition-all duration-500 outline-none">
                      <div className="w-16 h-16 rounded-full border border-zinc-800 group-hover:border-red-600 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center justify-center transition-all duration-500">
                        <span className="font-mono text-2xl group-hover:-translate-x-1 transition-transform duration-300">←</span>
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.4em] uppercase">Anfang</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-shrink-0 w-full md:w-auto min-h-[50vh] md:h-[60vh] flex items-center justify-center text-center px-6 md:px-8 pb-24 md:pb-0">
                  <div className="relative w-full max-w-[260px] md:max-w-sm aspect-[4/5] md:aspect-[4/3] bg-[#050000] border border-red-950 shadow-[0_0_30px_rgba(220,38,38,0.05)] rounded-sm flex flex-col items-center justify-center p-6 md:p-8 gap-5 md:gap-6 font-mono overflow-hidden">
                    {/* Ambient Red Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)] pointer-events-none" />
                    
                    {/* Animated "Developing" Line */}
                    <motion.div animate={{ y: ['-100%', '400%'] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="absolute top-0 left-0 w-full h-[1px] bg-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5">
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                      <h2 className="text-red-500/80 tracking-[0.3em] md:tracking-[0.4em] uppercase font-bold text-xs md:text-sm">In Entwicklung</h2>
                      <p className="text-zinc-600 text-[10px] md:text-xs tracking-wider max-w-[160px] md:max-w-[200px] leading-relaxed">
                        Die Negative für dieses Archiv werden aktuell belichtet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Negative Switch (Nur PC) */}
          {!isMobile && currentCategory && currentCategory !== "KONTAKT" && !selectedImage && (
            <div className="fixed top-8 right-12 z-[150] flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity duration-500 cursor-pointer group" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNegative(!isNegative); playNegativeSound(); }}>
              <span className="font-mono text-[10px] tracking-[0.2em] text-white uppercase select-none transition-colors group-hover:text-red-600">Negative</span>
              <button
                className={`w-10 h-5 rounded-full border transition-all duration-500 outline-none flex items-center p-1 ${isNegative ? 'bg-red-600 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-transparent border-zinc-700 group-hover:border-red-600'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-500 ${isNegative ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          {/* Zeitleiste (Timeline) - Nur auf dem PC sichtbar und ab > 1 Prio-Level */}
          {!isMobile && !isShortScreen && uniquePrios.length > 1 && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-1/3 max-w-lg z-[150] block opacity-30 hover:opacity-100 transition-opacity duration-500 h-8 group">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-zinc-700 -translate-y-1/2 pointer-events-none z-0" />
              
              {/* Beweglicher Punkt (Scrubber) */}
              <div 
                ref={scrubberRef}
                className="absolute top-1/2 w-3 h-3 bg-red-600 rounded-full -translate-y-1/2 shadow-[0_0_15px_rgba(220,38,38,0.8)] pointer-events-none z-20 will-change-[left]"
                style={{ left: '0%' }}
              />

              {uniquePrios.map((prio, index) => {
                // Optischer Fallback beim allerersten Laden (verteilt die Punkte gleichmäßig, bevor sie korrigiert werden)
                const defaultProgress = uniquePrios.length > 1 ? index / (uniquePrios.length - 1) : 0;
                const progress = markerProgress[prio] !== undefined ? markerProgress[prio] : defaultProgress;
                
                return (
                  <button
                    key={prio}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      const el = document.getElementById(`prio-section-${prio}`);
                      const container = scrollContainerRef.current;
                      if (el && container) {
                        const offset = el.offsetLeft - (window.innerWidth / 2) + (el.clientWidth / 2);
                        container.scrollTo({ left: offset, behavior: 'auto' });
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-zinc-500 hover:bg-red-600 hover:scale-150 hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all duration-300 outline-none z-10"
                    style={{ left: `calc(${progress * 100}% - ${progress * 0.75}rem)` }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>{selectedImage && <Lightbox src={selectedImage} imageData={images.find(i => i.url === selectedImage)} onClose={handleBackAction} />}</AnimatePresence>
    </main>
  );
}

export default function DarkroomCanvas() {
  return <Suspense fallback={<div className="h-screen w-screen bg-black" />}><DarkroomContent /></Suspense>;
}