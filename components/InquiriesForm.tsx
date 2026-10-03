import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InquiriesForm({ onClose }: { onClose: () => void }) {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");
    const formData = new FormData(e.currentTarget);
    
    // Web3Forms Access Key
    // Diesen Key muss Malte unter web3forms.com (kostenlos) generieren
    // und in die .env.local eintragen oder hier hardcoden.
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "YOUR_ACCESS_KEY_HERE";
    formData.append("access_key", accessKey);
    
    // Sicherheits-Feld (Honeypot gegen Spam)
    formData.append("botcheck", "");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setFormStatus("success");
      } else {
        setFormStatus("error");
      }
    } catch(err) {
      setFormStatus("error");
    }
  };

  return (
    <div 
      className="p-4 md:p-16 h-full w-full flex flex-col justify-center items-center absolute inset-0 bg-black text-center overflow-y-auto cursor-auto"
      onClick={onClose}
    >
      <div 
        className="max-w-2xl w-full flex flex-col items-center gap-6 mt-20 mb-32 md:mb-0 md:mt-0 relative z-10 p-4 md:p-12 border border-white/10 bg-black/50 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter font-mono mb-4 text-center">
          INQUIRIES
        </h1>
        
        <AnimatePresence mode="wait">
          {formStatus === "success" ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-full border border-red-600 flex items-center justify-center text-red-600 text-2xl">✓</div>
              <p className="text-zinc-300 font-mono text-sm uppercase tracking-widest">Anfrage erfolgreich belichtet.</p>
              <button onClick={onClose} className="mt-4 text-xs font-mono text-zinc-500 tracking-[0.2em] uppercase hover:text-red-600 transition-colors">
                SCHLIESSEN
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="w-full flex flex-col gap-4 font-mono text-xs md:text-sm text-left"
            >
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-zinc-500 tracking-widest uppercase">Name *</label>
                  <input required type="text" name="name" className="bg-transparent border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-zinc-500 tracking-widest uppercase">E-Mail *</label>
                  <input required type="email" name="email" className="bg-transparent border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-zinc-500 tracking-widest uppercase">Projekt-Art *</label>
                  <select required name="project_type" className="bg-black border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer">
                    <option value="" disabled selected>Bitte wählen...</option>
                    <option value="Event">Event</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Landschaft/Street">Landschaft / Street</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-zinc-500 tracking-widest uppercase">Datum / Zeitraum</label>
                  <input type="text" name="date" placeholder="Optional" className="bg-transparent border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-zinc-500 tracking-widest uppercase">Ort / Location *</label>
                <input required type="text" name="location" className="bg-transparent border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-zinc-500 tracking-widest uppercase">Details / Nachricht *</label>
                <textarea required name="message" rows={5} className="bg-transparent border border-zinc-800 p-3 text-white focus:outline-none focus:border-red-600 transition-colors resize-none"></textarea>
              </div>

              {formStatus === "error" && (
                <p className="text-red-500 text-center mt-2 uppercase tracking-widest">Fehler beim Senden. Bitte später versuchen.</p>
              )}

              <button 
                type="submit" 
                disabled={formStatus === "submitting"}
                className="mt-6 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 p-4 tracking-[0.2em] uppercase font-bold disabled:opacity-50"
              >
                {formStatus === "submitting" ? "WIRD ENTWICKELT..." : "ANFRAGE ABSENDEN"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
