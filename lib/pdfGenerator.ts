import { jsPDF } from "jspdf";

export interface PDFImageItem {
  url: string;
  category?: string;
  location?: string;
  camera_model?: string;
  year?: string;
  prio?: number;
}

// Convert image URL to Base64 JPEG data string safely
function urlToBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generatePortfolioPDF(
  images: PDFImageItem[],
  onProgress?: (progressText: string) => void
): Promise<void> {
  if (!images || images.length === 0) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const today = new Date().toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  if (onProgress) onProgress("Deckblatt wird belichtet...");

  // Dark background
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Red accent top bar
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(28);
  doc.text("MALTE BREUER", 20, 45);

  doc.setTextColor(220, 38, 38);
  doc.setFontSize(14);
  doc.text("PHOTOGRAPHY PORTFOLIO — SELECTION DECK", 20, 55);

  // Red Divider Line
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(20, 65, pageWidth - 20, 65);

  // Info Grid
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(161, 161, 170);

  const infoY = 85;
  doc.text("PHOTOGRAPHER:", 20, infoY);
  doc.setTextColor(255, 255, 255);
  doc.text("Malte Breuer", 75, infoY);

  doc.setTextColor(161, 161, 170);
  doc.text("CONTACT EMAIL:", 20, infoY + 10);
  doc.setTextColor(255, 255, 255);
  doc.text("breuermalte@icloud.com", 75, infoY + 10);

  doc.setTextColor(161, 161, 170);
  doc.text("INSTAGRAM:", 20, infoY + 20);
  doc.setTextColor(255, 255, 255);
  doc.text("@mhlensvisuals", 75, infoY + 20);

  doc.setTextColor(161, 161, 170);
  doc.text("LOCATION:", 20, infoY + 30);
  doc.setTextColor(255, 255, 255);
  doc.text("Wuppertal / Germany", 75, infoY + 30);

  doc.setTextColor(161, 161, 170);
  doc.text("DATE CREATED:", 20, infoY + 40);
  doc.setTextColor(255, 255, 255);
  doc.text(today, 75, infoY + 40);

  doc.setTextColor(161, 161, 170);
  doc.text("TOTAL SELECTIONS:", 20, infoY + 50);
  doc.setTextColor(220, 38, 38);
  doc.text(`${images.length} EXPOSURES`, 75, infoY + 50);

  // Cover Footer
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text("CONFIDENTIAL CLIENT PRESENTATION DECK — ALL RIGHTS RESERVED © 2026", 20, pageHeight - 16);

  // ----------------------------------------------------
  // PAGES 2+: INDIVIDUAL PHOTO PRINTS
  // ----------------------------------------------------
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    if (onProgress) {
      onProgress(`Belichte Bild ${i + 1} von ${images.length}...`);
    }

    doc.addPage("a4", "landscape");

    // Dark Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Red accent top bar
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Convert image URL to Base64
    const base64Img = await urlToBase64(item.url);

    if (base64Img) {
      try {
        // Image box bounds: 20mm to 210mm wide (max 190mm), 20mm to 180mm high (max 160mm)
        const maxImgWidth = 190;
        const maxImgHeight = 155;
        doc.addImage(
          base64Img,
          "JPEG",
          20,
          20,
          maxImgWidth,
          maxImgHeight,
          undefined,
          "FAST"
        );
      } catch (e) {
        console.error("Error drawing PDF image:", e);
      }
    }

    // Sidebar / Metadata Section on Right Side (222mm to 280mm)
    const sideX = 222;
    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text(`[ ${item.category || "PORTFOLIO"} ]`, sideX, 35);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(sideX, 40, pageWidth - 20, 40);

    // Metadata lines
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);

    // Location
    doc.text("LOCATION", sideX, 55);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(item.location || "UNKNOWN LOCATION", sideX, 61);

    // Camera
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text("CAMERA / SENSOR", sideX, 75);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text(item.camera_model || "LEICA / ANALOG", sideX, 81);

    // Year
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text("YEAR", sideX, 95);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(item.year || "2026", sideX, 101);

    // Darkroom Frame Reference Stamp
    const yearSuffix = (item.year || "2026").slice(-2);
    doc.setFontSize(16);
    doc.setFont("courier", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`REF-${yearSuffix}`, sideX, 140);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`FRAME ${String(i + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`, sideX, 146);

    // Page Footer
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.2);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("MALTE BREUER — PHOTOGRAPHY", 20, pageHeight - 9);
    doc.text(`PAGE ${i + 2} OF ${images.length + 1}`, pageWidth - 45, pageHeight - 9);
  }

  // Save / Download PDF
  if (onProgress) onProgress("PDF wird fertiggestellt...");
  doc.save("Malte_Breuer_Photography_Portfolio.pdf");
}
