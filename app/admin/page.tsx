"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ExifReader from "exifreader";

const CATEGORIES = [
  { id: "EVENTS", label: "EVENTS" },
  { id: "LANDSCHAFT", label: "LANDSCHAFT" },
  { id: "STREET", label: "STREET" },
  { id: "PERSONEN", label: "PERSONEN" },
  { id: "ME", label: "ME / ABOUT" },
];

const DEFAULT_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "darkroom2026";

interface ImageItem {
  id: string | number;
  url: string;
  category: string;
  prio: number;
  location?: string;
  camera_model?: string;
  year?: string;
  created_at?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const passcodeInputRef = useRef<HTMLInputElement>(null);

  // Timer cooldown effect after failed login attempt
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => passcodeInputRef.current?.focus(), 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const [currentCategory, setCurrentCategory] = useState<string>("EVENTS");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingPrio, setSavingPrio] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageItem | null>(null);

  // Form States for Upload/Edit
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("EVENTS");
  const [formLocation, setFormLocation] = useState<string>("");
  const [formCamera, setFormCamera] = useState<string>("");
  const [formYear, setFormYear] = useState<string>("");
  const [formPrio, setFormPrio] = useState<number>(1);
  const [formUrlInput, setFormUrlInput] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Sound effects
  const playClickSound = () => {
    if (typeof window !== "undefined") {
      if (!(window as any).clickAudio) {
        (window as any).clickAudio = new Audio("/click.mp3");
        (window as any).clickAudio.volume = 0.3;
      }
      const audio: HTMLAudioElement | null = (window as any).clickAudio;
      if (audio) {
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.2;
        clone.play().catch(() => {});
      }
    }
  };

  const playAutofocusSound = () => {
    if (typeof window !== "undefined") {
      if (!(window as any).autofocusAudio) {
        (window as any).autofocusAudio = new Audio("/autofocus.mp3");
        (window as any).autofocusAudio.volume = 0.4;
      }
      const audio: HTMLAudioElement | null = (window as any).autofocusAudio;
      if (audio) {
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.3;
        clone.play().catch(() => {});
      }
    }
  };

  // Cursor handling
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--x", `${e.clientX}px`);
          document.documentElement.style.setProperty("--y", `${e.clientY}px`);
          rafId = null;
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Check auth session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("darkroom_admin_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Load images when category changes or authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchImages(currentCategory);
    }
  }, [isAuthenticated, currentCategory]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    playClickSound();
    if (passcode.trim() === DEFAULT_PASSCODE) {
      sessionStorage.setItem("darkroom_admin_auth", "true");
      setIsAuthenticated(true);
      setAuthError(null);
      setCooldownSeconds(0);
      playAutofocusSound();
    } else {
      setAuthError("ZUGRIFF VERWEIGERT: UNGÜLTIGER PASSCODE");
      setCooldownSeconds(5);
      setPasscode("");
    }
  };

  const handleLogout = () => {
    playClickSound();
    sessionStorage.removeItem("darkroom_admin_auth");
    setIsAuthenticated(false);
    setPasscode("");
    setAuthError(null);
    setCooldownSeconds(0);
  };

  const fetchImages = async (category: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("category", category)
        .order("prio", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      console.error("Fehler beim Laden der Bilder:", err);
      showStatus("Fehler beim Laden der Bilder aus Supabase", "error");
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Reordering functions
  const moveImage = (index: number, direction: "up" | "down") => {
    playClickSound();
    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    // Swap positions
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // Re-assign prio numbers based on new index positions
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      prio: i + 1,
    }));

    setImages(updatedImages);
  };

  const saveOrderToSupabase = async () => {
    playAutofocusSound();
    setSavingPrio(true);
    try {
      // Update each image's prio field in Supabase
      const updates = images.map((img, index) =>
        supabase
          .from("images")
          .update({ prio: index + 1 })
          .eq("id", img.id)
      );

      await Promise.all(updates);
      showStatus("REIHENFOLGE ERFOLGREICH IN SUPABASE GESPEICHERT", "success");
      fetchImages(currentCategory);
    } catch (err: any) {
      console.error("Fehler beim Speichern der Reihenfolge:", err);
      showStatus("FEHLER BEIM SPEICHERN DER REIHENFOLGE", "error");
    } finally {
      setSavingPrio(false);
    }
  };

  // Helper function to compress images to WebP before upload
  const compressImageToWebP = (file: File, maxDimension: number = 1920, quality: number = 0.70): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        return resolve(file);
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // If dimensions are within maxDimension AND original file size is already very small (< 400KB), keep original
        if (width <= maxDimension && height <= maxDimension && file.size < 400 * 1024) {
          return resolve(file);
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);

            // CRITICAL PROTECTION: Only use converted WebP if it is actually SMALLER than original file!
            if (blob.size >= file.size) {
              console.log(`Original file (${(file.size / 1024).toFixed(0)}KB) is smaller than WebP output (${(blob.size / 1024).toFixed(0)}KB). Keeping original.`);
              return resolve(file);
            }

            const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const webpFileName = `${originalName.replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
            const webpFile = new File([blob], webpFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  // EXIF Auto-extraction on File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Try reading EXIF data
    try {
      const tags = await ExifReader.load(file);

      // Camera model extraction
      const make = tags.Make?.description || "";
      const model = tags.Model?.description || "";
      let fullCamera = "";
      if (model.toLowerCase().includes(make.toLowerCase())) {
        fullCamera = model;
      } else if (make && model) {
        fullCamera = `${make} ${model}`;
      } else {
        fullCamera = model || make;
      }

      if (fullCamera) {
        setFormCamera(fullCamera.toUpperCase());
      }

      // Year extraction
      const dateTag = tags.DateTimeOriginal?.description || tags.DateTime?.description;
      if (dateTag) {
        const yearMatch = dateTag.match(/(\d{4})/);
        if (yearMatch) {
          setFormYear(yearMatch[1]);
        }
      } else {
        setFormYear(new Date().getFullYear().toString());
      }

      playAutofocusSound();
    } catch (err) {
      console.log("Keine EXIF-Daten gefunden oder Fehler beim Auslesen:", err);
    }
  };

  // Open add image modal
  const openAddModal = () => {
    playClickSound();
    setEditingImage(null);
    setUploadFile(null);
    setPreviewUrl("");
    setFormUrlInput("");
    setFormCategory(currentCategory);
    setFormLocation("");
    setFormCamera("");
    setFormYear(new Date().getFullYear().toString());
    setFormPrio(images.length + 1);
    setShowAddModal(true);
  };

  // Open edit image modal
  const openEditModal = (img: ImageItem) => {
    playClickSound();
    setEditingImage(img);
    setUploadFile(null);
    setPreviewUrl(img.url);
    setFormUrlInput(img.url);
    setFormCategory(img.category);
    setFormLocation(img.location || "");
    setFormCamera(img.camera_model || "");
    setFormYear(img.year || "");
    setFormPrio(img.prio || 1);
    setShowAddModal(true);
  };

  // Save (Insert or Update) Image
  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setIsUploading(true);

    try {
      let finalUrl = formUrlInput;
      let compressionNotice = "";

      // File Upload to Supabase Storage if file selected
      if (uploadFile) {
        const origSizeMB = (uploadFile.size / (1024 * 1024)).toFixed(2);

        // Compress image to WebP format if it actually reduces size
        const fileToUpload = await compressImageToWebP(uploadFile, 1920, 0.70);
        const finalSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        const isWebPConverted = fileToUpload.type === "image/webp" && fileToUpload !== uploadFile;

        if (isWebPConverted) {
          compressionNotice = ` (${origSizeMB}MB ➔ ${finalSizeMB}MB WebP)`;
        } else {
          compressionNotice = ` (${finalSizeMB}MB - bereits optimal komprimiert)`;
        }

        const ext = isWebPConverted
          ? "webp"
          : uploadFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = `${formCategory.toLowerCase()}/${fileName}`;
        const mimeType = isWebPConverted ? "image/webp" : uploadFile.type || "image/jpeg";

        // Try uploading to 'Portfolio', 'portfolio', or 'images' bucket
        const bucketsToTry = ["Portfolio", "portfolio", "images"];
        let uploadSuccess = false;
        let lastUploadErr: any = null;

        for (const bucketName of bucketsToTry) {
          const { error: uploadErr } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileToUpload, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            finalUrl = publicUrlData.publicUrl;
            uploadSuccess = true;
            break;
          }

          lastUploadErr = uploadErr;
          // If error is RLS related rather than bucket missing, break & report
          if (uploadErr.message?.includes("security policy") || uploadErr.message?.includes("row-level security")) {
            break;
          }
        }

        if (!uploadSuccess) {
          console.error("Storage upload error:", lastUploadErr);
          if (lastUploadErr?.message?.includes("security policy") || lastUploadErr?.message?.includes("row-level security")) {
            throw new Error(`Storage RLS-Sperre: Bitte füge eine INSERT-Policy für den Bucket 'Portfolio' in Supabase Storage hinzu!`);
          } else if (!formUrlInput) {
            throw new Error(`Upload in Storage-Bucket 'Portfolio' fehlgeschlagen: ${lastUploadErr?.message || "Bucket nicht gefunden"}.`);
          }
        }
      }

      if (!finalUrl) {
        showStatus("BITTE WÄHLE EINE DATEI AUS ODER GIB EINE BILD-URL EIN", "error");
        setIsUploading(false);
        return;
      }

      const payload = {
        url: finalUrl,
        category: formCategory,
        prio: formPrio,
        location: formLocation || null,
        camera_model: formCamera || null,
        year: formYear || null,
      };

      if (editingImage) {
        // Update existing record
        const { error } = await supabase
          .from("images")
          .update(payload)
          .eq("id", editingImage.id);

        if (error) {
          console.error("Database update error:", error);
          throw new Error(`Datenbank-Fehler beim Aktualisieren: ${error.message}`);
        }
        showStatus(`BILD ERFOLGREICH AKTUALISIERT${compressionNotice}`, "success");
      } else {
        // Insert new record
        const { error } = await supabase.from("images").insert([payload]);

        if (error) {
          console.error("Database insert error:", error);
          throw new Error(`Datenbank-Fehler beim Einfügen (RLS prüfen): ${error.message}`);
        }
        showStatus(`NEUES BILD ERFOLGREICH GESPEICHERT & IN WEBP KOMPRIMIERT${compressionNotice}`, "success");
      }

      setShowAddModal(false);
      fetchImages(currentCategory);
    } catch (err: any) {
      console.error("Fehler beim Speichern:", err);
      showStatus(err.message || "FEHLER BEIM SPEICHERN DES BILDES", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Image
  const handleDeleteImage = async () => {
    if (!deleteTarget) return;
    playClickSound();
    try {
      // 1. If stored in Supabase Storage, attempt deleting file from bucket dynamically
      if (deleteTarget.url && deleteTarget.url.includes("/storage/v1/object/public/")) {
        const pathAfterPublic = deleteTarget.url.split("/storage/v1/object/public/")[1];
        if (pathAfterPublic) {
          const pathSegments = pathAfterPublic.split("/");
          const bucket = pathSegments[0];
          const filePath = pathSegments.slice(1).join("/");
          if (bucket && filePath) {
            await supabase.storage.from(bucket).remove([filePath]);
          }
        }
      }

      // 2. Delete database row from 'images' table
      const { error } = await supabase.from("images").delete().eq("id", deleteTarget.id);
      if (error) throw error;

      showStatus("BILD UNWIDERRUFLICH ERFOLGREICH GELÖSCHT", "success");
      setDeleteTarget(null);
      fetchImages(currentCategory);
    } catch (err: any) {
      console.error("Fehler beim Löschen:", err);
      showStatus(`FEHLER BEIM LÖSCHEN: ${err.message || "Unbekannter Fehler"}`, "error");
    }
  };

  // --- RENDER PASSCODE GATE ---
  if (!isAuthenticated) {
    return (
      <main className="h-[100dvh] w-full bg-[#0a0a0a] text-zinc-400 font-mono flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Noise */}
        <div className="fixed inset-0 bg-[#0a0a0a] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20250%20250%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%226%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.015] pointer-events-none -z-10" />

        <div className="custom-cursor hidden md:block" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-black/80 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-sm shadow-2xl relative"
        >
          <div className="flex justify-between items-center border-b border-dashed border-white/20 pb-4 mb-6">
            <span className="text-red-600 font-bold tracking-[0.2em] text-xs md:text-sm uppercase">
              [ SECURITY_CLEARANCE_REQUIRED ]
            </span>
            <span className="text-zinc-600 text-[10px]">ADMIN_SYS_V1.0</span>
          </div>

          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Bitte gib den Darkroom Administrator-Passcode ein, um Zugriff auf die Bildverwaltung zu erhalten.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                PASSCODE_KEY
              </label>
              <input
                ref={passcodeInputRef}
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={cooldownSeconds > 0}
                placeholder={cooldownSeconds > 0 ? `SPERRE AKTIV (${cooldownSeconds}S)...` : "••••••••••••"}
                className={`w-full bg-zinc-950 border px-4 py-3 text-white text-sm tracking-widest font-mono rounded-sm outline-none transition-colors ${
                  cooldownSeconds > 0
                    ? "border-red-900/60 text-zinc-600 cursor-not-allowed opacity-60"
                    : "border-zinc-800 focus:border-red-600"
                }`}
                autoFocus
              />
            </div>

            {authError && (
              <div className="space-y-1">
                <p className="text-xs text-red-500 font-bold tracking-wider animate-pulse">
                  ⚠ {authError}
                </p>
                {cooldownSeconds > 0 && (
                  <p className="text-[10px] text-zinc-500 tracking-widest">
                    [ SPARRZEIT AKTIV: NEUER VERSUCH IN {cooldownSeconds} SEC ]
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={cooldownSeconds > 0}
                className={`flex-1 font-mono text-xs uppercase tracking-widest py-3 px-4 transition-colors font-bold rounded-sm border ${
                  cooldownSeconds > 0
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-red-600/90 hover:bg-red-600 text-white border-red-500/30"
                }`}
              >
                {cooldownSeconds > 0 ? `[ BITTE WARTEN (${cooldownSeconds}S) ]` : "[ ZUGANG BESTÄTIGEN ]"}
              </button>
              <Link
                href="/"
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-xs uppercase tracking-widest py-3 px-4 transition-colors rounded-sm border border-white/5 flex items-center justify-center"
              >
                [ ← ZURÜCK ]
              </Link>
            </div>
          </form>

          <div className="mt-6 border-t border-white/5 pt-3 text-[9px] text-zinc-600 flex justify-between tracking-wider">
            <span>DARKROOM ARCHIVE</span>
            <span>RESTRICTED ACCESS</span>
          </div>
        </motion.div>
      </main>
    );
  }

  // --- RENDER MAIN ADMIN DASHBOARD ---
  return (
    <main className="h-[100dvh] w-full overflow-y-auto bg-[#0a0a0a] text-zinc-300 font-mono p-4 md:p-8 relative selection:bg-red-950 selection:text-white">
      {/* Background Noise */}
      <div className="fixed inset-0 bg-[#0a0a0a] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20250%20250%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%226%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-[0.015] pointer-events-none -z-10" />

      <div className="custom-cursor hidden md:block" />

      {/* HEADER BAR */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-white font-bold text-lg md:text-xl tracking-[0.2em] uppercase">
              DARKROOM_ADMIN_PANEL
            </h1>
          </div>
          <p className="text-zinc-500 text-xs mt-1 tracking-wider">
            Bilder hinzufügen, entfernen und Reihenfolge per Supabase verwalten.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-widest uppercase px-4 py-2.5 rounded-sm transition-colors shadow-lg border border-red-400/30 flex items-center gap-2"
          >
            <span>+</span> NEUES BILD HINZUFÜGEN
          </button>
          <Link
            href="/"
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs tracking-widest uppercase px-4 py-2.5 rounded-sm border border-white/10 transition-colors"
          >
            ← PORTFOLIO
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-950/40 hover:bg-red-950/80 text-red-400 text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm border border-red-800/30 transition-colors"
            title="Abmelden"
          >
            [ LOGOUT ]
          </button>
        </div>
      </header>

      {/* NOTIFICATION STATUS TOAST */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`max-w-7xl mx-auto mb-6 p-4 rounded-sm border text-xs tracking-widest font-bold uppercase flex justify-between items-center ${
              statusMessage.type === "success"
                ? "bg-emerald-950/60 border-emerald-600/40 text-emerald-300"
                : "bg-red-950/60 border-red-600/40 text-red-300"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-white/60 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* CATEGORY SWITCHER & BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClickSound();
                    setCurrentCategory(cat.id);
                  }}
                  className={`text-xs font-mono px-4 py-2 rounded-sm tracking-widest transition-all uppercase font-bold border ${
                    isActive
                      ? "bg-red-600 text-white border-red-500 shadow-md"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            <span className="text-zinc-500 text-xs">
              {images.length} BILDER IN [{currentCategory}]
            </span>
            <button
              onClick={saveOrderToSupabase}
              disabled={savingPrio || images.length === 0}
              className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-sm border transition-colors ${
                savingPrio
                  ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700/50"
              }`}
            >
              {savingPrio ? "[ SPEICHERT... ]" : "[ REIHENFOLGE SPEICHERN ]"}
            </button>
          </div>
        </div>

        {/* IMAGE LIST & REORDERING GRID */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-xs tracking-widest uppercase animate-pulse">
            [ LADEN DER BILDER AUS SUPABASE... ]
          </div>
        ) : images.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-800 rounded-sm bg-black/40">
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">
              Keine Bilder in Kategorie [{currentCategory}] vorhanden.
            </p>
            <button
              onClick={openAddModal}
              className="text-red-500 underline hover:text-red-400 text-xs tracking-widest uppercase"
            >
              + Erstes Bild hier hochladen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <motion.div
                key={img.id}
                layout
                className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm flex flex-col justify-between relative group hover:border-zinc-700 transition-colors"
              >
                <div>
                  {/* Top Badge & Priority */}
                  <div className="flex justify-between items-center mb-3 text-[11px] text-zinc-400 border-b border-white/5 pb-2">
                    <span className="bg-red-950/80 text-red-400 px-2 py-0.5 rounded-xs font-bold tracking-widest border border-red-800/40">
                      PRIO #{index + 1}
                    </span>
                    <span className="text-zinc-600 truncate max-w-[120px]">
                      ID: {String(img.id).slice(0, 8)}
                    </span>
                  </div>

                  {/* Image Thumbnail */}
                  <div className="aspect-[4/3] bg-zinc-950 rounded-sm overflow-hidden mb-3 relative border border-white/5">
                    <img
                      src={img.url}
                      alt={img.location || "Portfolio Image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Metadata Info */}
                  <div className="space-y-1 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">LOCATION:</span>
                      <span className="text-zinc-200 font-bold truncate max-w-[150px]">
                        {img.location || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CAMERA:</span>
                      <span className="text-red-500 font-bold truncate max-w-[150px]">
                        {img.camera_model || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">YEAR:</span>
                      <span className="text-zinc-400 font-bold">{img.year || "----"}</span>
                    </div>
                  </div>
                </div>

                {/* ACTION CONTROLS */}
                <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                      className={`px-2.5 py-1.5 rounded-sm border text-[11px] font-bold ${
                        index === 0
                          ? "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed"
                          : "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white"
                      }`}
                      title="Eins nach vorne verschieben"
                    >
                      ▲ VOR
                    </button>
                    <button
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1}
                      className={`px-2.5 py-1.5 rounded-sm border text-[11px] font-bold ${
                        index === images.length - 1
                          ? "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed"
                          : "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white"
                      }`}
                      title="Eins nach hinten verschieben"
                    >
                      ▼ NACH
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(img)}
                      className="px-2.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px]"
                    >
                      ✎ EDIT
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        setDeleteTarget(img);
                      }}
                      className="px-2.5 py-1.5 rounded-sm bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400 text-[11px]"
                    >
                      🗑 LÖSCHEN
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT IMAGE */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/10 p-6 md:p-8 rounded-sm max-w-lg w-full shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center border-b border-dashed border-white/20 pb-4 mb-6">
                <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">
                  {editingImage ? "[ BILD METADATEN BEARBEITEN ]" : "[ NEUES BILD HOCHLADEN ]"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveImage} className="space-y-4">
                {/* File Drop / Upload */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-widest">
                      BILD-DATEI AUSWÄHLEN (EXIF WIRD AUTOMATISCH ERKANNT)
                    </label>
                    <span className="text-[9px] text-emerald-400 font-bold tracking-wider">
                      ⚡ AUTO-WEBP
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-sm p-2 file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-mono file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
                  />
                  <p className="text-[9px] text-zinc-500 mt-1">
                    Dateien werden vor dem Upload automatisch stark in komprimiertes WebP umgewandelt (max 1920px, ~72% Qualität).
                  </p>
                </div>

                {/* Optional Image URL Input */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                    ODER DIREKTE BILD-URL EINGEBEN
                  </label>
                  <input
                    type="url"
                    value={formUrlInput}
                    onChange={(e) => {
                      setFormUrlInput(e.target.value);
                      if (e.target.value) setPreviewUrl(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none"
                  />
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="aspect-[16/9] max-h-40 bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden flex items-center justify-center my-2">
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                    KATEGORIE
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                    LOCATION (Z. B. "Biberach, DE")
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="z. B. Stuttgart, DE"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none"
                  />
                </div>

                {/* Camera Model */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                    KAMERA MODELL (Z. B. "Leica M10")
                  </label>
                  <input
                    type="text"
                    value={formCamera}
                    onChange={(e) => setFormCamera(e.target.value)}
                    placeholder="z. B. Sony Alpha 7 IV"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none text-red-400"
                  />
                </div>

                {/* Year & Prio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                      JAHR
                    </label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="2026"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                      PRIORITÄT (REIHENFOLGE)
                    </label>
                    <input
                      type="number"
                      value={formPrio}
                      onChange={(e) => setFormPrio(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 px-3 py-2 text-white text-xs font-mono rounded-sm outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`flex-1 text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-sm border transition-colors ${
                      isUploading
                        ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-500 border-red-400/40"
                    }`}
                  >
                    {isUploading
                      ? "[ SPEICHERT IN SUPABASE... ]"
                      : editingImage
                      ? "[ BILD AKTUALISIEREN ]"
                      : "[ HINZUFÜGEN & SPEICHERN ]"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs uppercase tracking-widest py-3 px-4 rounded-sm border border-zinc-700"
                  >
                    ABBRECHEN
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIRM DELETE */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[850] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-red-600/50 p-6 rounded-sm max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm tracking-widest uppercase">
                <span>⚠</span>
                <span>[ BILD LÖSCHEN BESTÄTIGEN ]</span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Möchtest du dieses Bild (ID: {String(deleteTarget.id).slice(0, 8)}) wirklich aus Supabase entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              {deleteTarget.url && (
                <div className="aspect-[16/9] max-h-32 bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden flex items-center justify-center">
                  <img src={deleteTarget.url} alt="To delete" className="max-h-full max-w-full object-contain" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteImage}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-sm border border-red-400"
                >
                  [ UNWIDERRUFLICH LÖSCHEN ]
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs uppercase tracking-widest py-2.5 px-4 rounded-sm border border-zinc-700"
                >
                  ABBRECHEN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
