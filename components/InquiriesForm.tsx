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
        className="max-w-xl w-full flex flex-col gap-12 mt-20 mb-32 md:mb-0 md:mt-0 relative z-10 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono text-left">
          INQUIRIES
        </h1>
        
        <AnimatePresence mode="wait">
          {formStatus === "success" ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="py-24 flex flex-col items-start gap-8 text-left"
            >
              <div className="font-mono text-zinc-300 text-lg uppercase tracking-widest">
                [ INQUIRY SENT ]
              </div>
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                Thank you. I will get back to you shortly.
              </p>
              <button onClick={onClose} className="mt-8 font-mono text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-[0.2em] text-xs">
                ← RETURN
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="w-full flex flex-col gap-8 font-mono text-xs md:text-sm text-left"
            >
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-2">
                  <input required type="text" name="name" placeholder="NAME *" className="bg-transparent border-b border-zinc-800 pb-3 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-colors uppercase tracking-widest" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input required type="email" name="email" placeholder="E-MAIL *" className="bg-transparent border-b border-zinc-800 pb-3 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-colors uppercase tracking-widest" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-2">
                  <select required name="project_type" className="bg-black border-b border-zinc-800 pb-3 text-white focus:outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer uppercase tracking-widest rounded-none">
                    <option value="" disabled selected className="text-zinc-700">TYPE OF PROJECT *</option>
                    <option value="Event">EVENT</option>
                    <option value="Portrait">PORTRAIT</option>
                    <option value="Landschaft/Street">LANDSCAPE / STREET</option>
                    <option value="Andere">OTHER</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input type="text" name="date" placeholder="DATE / TIMEFRAME" className="bg-transparent border-b border-zinc-800 pb-3 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-colors uppercase tracking-widest" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input required type="text" name="location" placeholder="LOCATION *" className="bg-transparent border-b border-zinc-800 pb-3 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-colors uppercase tracking-widest" />
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <textarea required name="message" rows={4} placeholder="PROJECT DETAILS *" className="bg-transparent border-b border-zinc-800 pb-3 text-white placeholder-zinc-700 focus:outline-none focus:border-red-600 transition-colors resize-none uppercase tracking-widest"></textarea>
              </div>

              {formStatus === "error" && (
                <p className="text-red-600 mt-2 uppercase tracking-widest text-xs">[ SYSTEM ERROR: TRY AGAIN ]</p>
              )}

              <div className="flex justify-between items-center mt-8">
                <button 
                  type="button"
                  onClick={onClose}
                  className="font-mono text-zinc-600 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={formStatus === "submitting"}
                  className="font-mono text-red-600 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                >
                  {formStatus === "submitting" ? "[ TRANSMITTING... ]" : "[ SEND INQUIRY ]"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
