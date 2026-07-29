import { jsPDF } from "jspdf";

export interface PDFImageItem {
  url: string;
  category?: string;
  location?: string;
  camera_model?: string;
  year?: string;
  prio?: number;
}

interface LoadedImageData {
  base64: string;
  aspectRatio: number;
}

// Convert image URL to Base64 JPEG data string safely while recording aspect ratio
function loadImgData(url: string): Promise<LoadedImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 600;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          resolve({ base64, aspectRatio: w / h });
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

const CATEGORY_ORDER = ["EVENTS", "LANDSCHAFT", "STREET", "PERSONEN", "ME"];

export async function generatePortfolioPDF(
  images: PDFImageItem[],
  onProgress?: (progressText: string) => void
): Promise<void> {
  if (!images || images.length === 0) return;

  // 1. Sort images by Category order and priority
  const sortedImages = [...images].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf((a.category || "").toUpperCase());
    const catB = CATEGORY_ORDER.indexOf((b.category || "").toUpperCase());
    const orderA = catA === -1 ? 99 : catA;
    const orderB = catB === -1 ? 99 : catB;
    if (orderA !== orderB) return orderA - orderB;
    return (a.prio || 99) - (b.prio || 99);
  });

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

  // Count category statistics
  const catStats: Record<string, number> = {};
  sortedImages.forEach((img) => {
    const c = (img.category || "DIVERSES").toUpperCase();
    catStats[c] = (catStats[c] || 0) + 1;
  });

  // ----------------------------------------------------
  // PAGE 1: EDITORIAL COVER & ARTIST STATEMENT PAGE
  // ----------------------------------------------------
  if (onProgress) onProgress("Deckblatt & Artist Statement werden belichtet...");

  // Dark background
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Red accent top bar
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(26);
  doc.text("MALTE BREUER", 20, 35);

  doc.setTextColor(220, 38, 38);
  doc.setFontSize(13);
  doc.text("PHOTOGRAPHY & VISUAL ARTS — SELECTION DECK", 20, 44);

  // Red Divider Line
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(20, 50, pageWidth - 20, 50);

  // Left Column: Artist Statement Box (20mm to 160mm)
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text("[ ARTIST STATEMENT & ARCHIV-ÜBERSICHT ]", 20, 62);

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);

  const statementLines = [
    "Willkommen im fotografischen Archiv von Malte Breuer.",
    "",
    "Dieses Portfolio beinhaltet eine kuratierte Auswahl visueller Arbeiten aus den Bereichen",
    "Events, Landschafts-Fotografie, Street Photography und Portraits.",
    "",
    "Der künstlerische Fokus liegt auf der authentischen Einfangung von Lichtstimmungen,",
    "gezielten Schattenkontrasten und präzisen bildgestalterischen Kompositionen.",
    "",
    "Verwendete Systeme umfassen sowohl hochauflösende moderne Sensoren als auch analoge",
    "35mm-Formate aus den Archiven 2024 bis 2026."
  ];

  let lineY = 72;
  statementLines.forEach((line) => {
    doc.text(line, 20, lineY);
    lineY += 5.5;
  });

  // Right Column: Metadata & Contact Details Box (175mm to 277mm)
  const metaX = 175;
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text("[ KONTAKT & METADATEN ]", metaX, 62);

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);

  let metaY = 72;
  const metaItems = [
    { label: "FOTOGRAF:", value: "Malte Breuer" },
    { label: "E-MAIL:", value: "breuermalte@icloud.com" },
    { label: "INSTAGRAM:", value: "@mhlensvisuals" },
    { label: "STANDORT:", value: "Wuppertal / Deutschland" },
    { label: "DATUM:", value: today },
    { label: "BELICHTUNGEN:", value: `${sortedImages.length} Kuratierte Werke` },
  ];

  metaItems.forEach((item) => {
    doc.setTextColor(113, 113, 122);
    doc.text(item.label, metaX, metaY);
    doc.setTextColor(255, 255, 255);
    doc.text(item.value, metaX + 32, metaY);
    metaY += 7;
  });

  // Category Distribution Stats Box
  metaY += 5;
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text("[ KATEGORIEN IM DECK ]", metaX, metaY);
  metaY += 6;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  Object.entries(catStats).forEach(([catName, count]) => {
    doc.setTextColor(161, 161, 170);
    doc.text(`• ${catName}:`, metaX + 2, metaY);
    doc.setTextColor(255, 255, 255);
    doc.text(`${count} Bild${count > 1 ? "er" : ""}`, metaX + 38, metaY);
    metaY += 5.5;
  });

  // Cover Footer
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text("CONFIDENTIAL CLIENT PRESENTATION DECK — ALL RIGHTS RESERVED © 2026", 20, pageHeight - 13);

  // ----------------------------------------------------
  // PRELOAD ALL IMAGES (CONVERT & GET ASPECT RATIOS)
  // ----------------------------------------------------
  if (onProgress) onProgress("Vorbereitung & Konvertierung der Bilddaten...");

  const preloadedImages: Array<{ item: PDFImageItem; data: LoadedImageData | null }> = [];
  for (let i = 0; i < sortedImages.length; i++) {
    if (onProgress) onProgress(`Lade Bild ${i + 1} von ${sortedImages.length}...`);
    const data = await loadImgData(sortedImages[i].url);
    preloadedImages.push({ item: sortedImages[i], data });
  }

  // ----------------------------------------------------
  // EDITORIAL GRID PAGES (2 IMAGES PER PAGE)
  // ----------------------------------------------------
  const itemsPerPage = 2;
  const totalGridPages = Math.ceil(preloadedImages.length / itemsPerPage);

  for (let pageIdx = 0; pageIdx < totalGridPages; pageIdx++) {
    if (onProgress) onProgress(`Erstelle Dokumentenseite ${pageIdx + 2} von ${totalGridPages + 1}...`);

    doc.addPage("a4", "landscape");

    // Dark Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Red accent top bar
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Header on image pages
    const pageItems = preloadedImages.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);
    const primaryCategory = (pageItems[0]?.item.category || "PORTFOLIO").toUpperCase();

    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text(`MALTE BREUER — ARCHIV: [ ${primaryCategory} ]`, 15, 14);

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(`SEITE ${pageIdx + 2} VON ${totalGridPages + 1}`, pageWidth - 45, 14);

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    doc.line(15, 17, pageWidth - 15, 17);

    // 2-Column Grid Parameters
    // Column 1: Left X = 15mm, Column 2: Left X = 152mm
    // Width per column = 130mm, Max Box Height = 145mm
    const colWidth = 130;
    const boxHeight = 145;
    const startY = 25;

    for (let slot = 0; slot < pageItems.length; slot++) {
      const { item, data } = pageItems[slot];
      const colX = slot === 0 ? 15 : 152;

      // Draw dark frame box background for image slot
      doc.setFillColor(18, 18, 18);
      doc.setDrawColor(38, 38, 38);
      doc.setLineWidth(0.3);
      doc.rect(colX, startY, colWidth, boxHeight, "FD");

      if (data && data.base64) {
        try {
          // STRICT ASPECT RATIO PRESERVATION:
          // Fit image perfectly inside (colWidth - 8mm) x (boxHeight - 8mm) without stretching
          const maxW = colWidth - 8;
          const maxH = boxHeight - 8;

          let imgW = maxW;
          let imgH = imgW / data.aspectRatio;

          if (imgH > maxH) {
            imgH = maxH;
            imgW = imgH * data.aspectRatio;
          }

          // Center image perfectly inside the slot box
          const drawX = colX + (colWidth - imgW) / 2;
          const drawY = startY + (boxHeight - imgH) / 2;

          doc.addImage(data.base64, "JPEG", drawX, drawY, imgW, imgH, undefined, "FAST");

          // Red corner crop marks
          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.4);
          doc.line(drawX, drawY, drawX + 3, drawY);
          doc.line(drawX, drawY, drawX, drawY + 3);
          doc.line(drawX + imgW, drawY + imgH, drawX + imgW - 3, drawY + imgH);
          doc.line(drawX + imgW, drawY + imgH, drawX + imgW, drawY + imgH - 3);
        } catch (e) {
          console.error("Error drawing image in PDF:", e);
        }
      }

      // Metadata section below each image slot (Y = startY + boxHeight + 4mm)
      const metaY = startY + boxHeight + 5;
      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(220, 38, 38);
      doc.text(`[ ${item.category || "WERK"} ]`, colX, metaY);

      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(212, 212, 216);

      const locText = (item.location || "Standort N/A").toUpperCase();
      const camText = (item.camera_model || "LEICA / ANALOG").toUpperCase();
      const yearText = item.year || "2026";

      doc.text(`${locText} • ${camText} • ${yearText}`, colX, metaY + 4.5);
    }

    // Page Footer
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.2);
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("MALTE BREUER — PHOTOGRAPHY PORTFOLIO", 15, pageHeight - 7);
    doc.text("CONFIDENTIAL PRESENTATION DECK", pageWidth - 70, pageHeight - 7);
  }

  // Save PDF
  if (onProgress) onProgress("PDF wird fertiggestellt...");
  doc.save("Malte_Breuer_Photography_Portfolio.pdf");
}
