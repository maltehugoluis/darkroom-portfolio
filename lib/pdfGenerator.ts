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

// Convert image URL to Base64 JPEG data string safely while downscaling for compact PDF size (~12MB total)
function loadImgData(url: string, maxDim: number = 1000): Promise<LoadedImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      let w = img.naturalWidth || img.width || 800;
      let h = img.naturalHeight || img.height || 600;

      // Downscale to maxDim (1000px) for ultra-compact PDF file size (~120KB per photo)
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const base64 = canvas.toDataURL("image/jpeg", 0.65);
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

// Dynamic photobook pattern sequence prioritizing 4 and 3 images per page
const PAGE_PATTERN_SEQUENCE = [4, 3, 4, 2, 4, 3, 1, 4, 3, 4, 2];

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

  // Count category statistics (normalized)
  const catStats: Record<string, number> = {};
  sortedImages.forEach((img) => {
    let c = (img.category || "DIVERSES").trim().toUpperCase();
    if (c === "PEROSNEN") c = "PERSONEN";
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
  doc.text("PHOTOGRAPHY & VISUAL ARTS — PHOTOBOOK DECK", 20, 44);

  // Red Divider Line
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(20, 50, pageWidth - 20, 50);

  // Left Column: Artist Statement Box (20mm to 165mm)
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text("[ ARTIST STATEMENT & ARCHIV ]", 20, 62);

  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(212, 212, 216);

  const statementLines = [
    "Willkommen im fotografischen Archiv von Malte Breuer.",
    "",
    "Dieses Portfolio beinhaltet eine kuratierte Auswahl",
    "visueller Arbeiten aus den Bereichen Events,",
    "Landschafts-Fotografie, Street & Portraits.",
    "",
    "Der künstlerische Fokus liegt auf authentischen",
    "Lichtstimmungen, präzisen Schattenkontrasten",
    "und klaren bildgestalterischen Kompositionen.",
    "",
    "Verwendete Systeme umfassen moderne Vollformat-",
    "Sensoren sowie analoge 35mm-Formate."
  ];

  let lineY = 72;
  statementLines.forEach((line) => {
    doc.text(line, 20, lineY);
    lineY += 5.5;
  });

  // Right Column: Metadata & Contact Details Box (182mm to 277mm)
  const metaX = 182;
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text("[ KONTAKT & METADATEN ]", metaX, 62);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);

  let metaY = 72;
  const metaItems = [
    { label: "FOTOGRAF:", value: "Malte Breuer" },
    { label: "E-MAIL:", value: "breuermalte@icloud.com" },
    { label: "INSTAGRAM:", value: "@mhlensvisuals" },
    { label: "STANDORT:", value: "Wuppertal / GER" },
    { label: "DATUM:", value: today },
    { label: "WERKE:", value: `${sortedImages.length} Belichtungen` },
  ];

  metaItems.forEach((item) => {
    doc.setTextColor(113, 113, 122);
    doc.text(item.label, metaX, metaY);
    doc.setTextColor(255, 255, 255);
    doc.text(item.value, metaX + 34, metaY);
    metaY += 6.5;
  });

  // Category Distribution Stats Box
  metaY += 4;
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
    metaY += 5;
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
  // DYNAMIC PHOTOBOOK PAGES (4, 3, 2, 1 VARYING LAYOUTS)
  // ----------------------------------------------------
  let imgIndex = 0;
  let pageNumber = 2;
  let patternIdx = 0;

  // Helper renderer for an individual photo slot cell
  const renderSlot = (
    cellX: number,
    cellY: number,
    cellW: number,
    cellH: number,
    slotData: { item: PDFImageItem; data: LoadedImageData | null }
  ) => {
    const { item, data } = slotData;

    // Dark card background
    doc.setFillColor(18, 18, 18);
    doc.setDrawColor(38, 38, 38);
    doc.setLineWidth(0.3);
    doc.rect(cellX, cellY, cellW, cellH, "FD");

    if (data && data.base64) {
      try {
        const padding = 5;
        const maxW = cellW - padding * 2;
        const maxH = cellH - padding * 2 - 6; // Leave room for metadata line below

        let imgW = maxW;
        let imgH = imgW / data.aspectRatio;

        if (imgH > maxH) {
          imgH = maxH;
          imgW = imgH * data.aspectRatio;
        }

        const drawX = cellX + (cellW - imgW) / 2;
        const drawY = cellY + padding + (maxH - imgH) / 2;

        doc.addImage(data.base64, "JPEG", drawX, drawY, imgW, imgH, undefined, "FAST");

        // Red corner crop marks
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.4);
        doc.line(drawX, drawY, drawX + 3, drawY);
        doc.line(drawX, drawY, drawX, drawY + 3);
        doc.line(drawX + imgW, drawY + imgH, drawX + imgW - 3, drawY + imgH);
        doc.line(drawX + imgW, drawY + imgH, drawX + imgW, drawY + imgH - 3);

        // Metadata line under photo
        const metaY = cellY + cellH - 3;
        doc.setFont("courier", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(220, 38, 38);
        doc.text(`[${item.category || "WERK"}]`, cellX + 3, metaY);

        doc.setFont("courier", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(212, 212, 216);

        const locText = (item.location || "N/A").toUpperCase();
        const camText = (item.camera_model || "LEICA/ANALOG").toUpperCase();
        const yearText = item.year || "2026";
        doc.text(`${locText} • ${camText} • ${yearText}`, cellX + 28, metaY);
      } catch (e) {
        console.error("Error drawing image in PDF:", e);
      }
    }
  };

  while (imgIndex < preloadedImages.length) {
    const remaining = preloadedImages.length - imgIndex;
    const targetCount = PAGE_PATTERN_SEQUENCE[patternIdx % PAGE_PATTERN_SEQUENCE.length];
    patternIdx++;

    const countOnThisPage = Math.min(targetCount, remaining);
    const pageItems = preloadedImages.slice(imgIndex, imgIndex + countOnThisPage);
    imgIndex += countOnThisPage;

    if (onProgress) {
      onProgress(`Erstelle Magazinseite ${pageNumber} (${countOnThisPage} Bilder)...`);
    }

    doc.addPage("a4", "landscape");

    // Dark Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Red accent top bar
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Top Page Header
    const primaryCat = (pageItems[0]?.item.category || "PORTFOLIO").toUpperCase();
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(220, 38, 38);
    doc.text(`MALTE BREUER — ARCHIV: [ ${primaryCat} ]`, 15, 13);

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(`SEITE ${pageNumber}`, pageWidth - 35, 13);

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    doc.line(15, 16, pageWidth - 15, 16);

    // Render Page according to image count (4, 3, 2, or 1)
    if (countOnThisPage === 4) {
      // 4-UP GRID LAYOUT (2x2 Grid)
      const slotW = 130;
      const slotH = 82;
      const topY1 = 20;
      const topY2 = 106;
      const leftX1 = 15;
      const leftX2 = 152;

      renderSlot(leftX1, topY1, slotW, slotH, pageItems[0]);
      if (pageItems[1]) renderSlot(leftX2, topY1, slotW, slotH, pageItems[1]);
      if (pageItems[2]) renderSlot(leftX1, topY2, slotW, slotH, pageItems[2]);
      if (pageItems[3]) renderSlot(leftX2, topY2, slotW, slotH, pageItems[3]);
    } else if (countOnThisPage === 3) {
      // 3-UP EDITORIAL LAYOUT (1 Hero Left, 2 Right Stacked)
      const heroW = 132;
      const heroH = 168;
      const rightW = 128;
      const rightH = 82;

      renderSlot(15, 20, heroW, heroH, pageItems[0]);
      if (pageItems[1]) renderSlot(154, 20, rightW, rightH, pageItems[1]);
      if (pageItems[2]) renderSlot(154, 106, rightW, rightH, pageItems[2]);
    } else if (countOnThisPage === 2) {
      // 2-UP SPREAD LAYOUT (Side by Side)
      const slotW = 130;
      const slotH = 168;
      renderSlot(15, 20, slotW, slotH, pageItems[0]);
      if (pageItems[1]) renderSlot(152, 20, slotW, slotH, pageItems[1]);
    } else {
      // 1-UP HERO EXPOSURE LAYOUT (Large Hero Print with Metadata Sidebar)
      const heroW = 195;
      const heroH = 168;
      renderSlot(15, 20, heroW, heroH, pageItems[0]);

      // Metadata sidebar on right side
      const item = pageItems[0].item;
      const sideX = 218;

      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(220, 38, 38);
      doc.text(`[ ${item.category || "PORTFOLIO"} ]`, sideX, 35);

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.line(sideX, 40, pageWidth - 15, 40);

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);

      doc.text("LOCATION", sideX, 55);
      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(item.location || "UNKNOWN LOCATION", sideX, 61);

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text("CAMERA / SENSOR", sideX, 75);
      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(220, 38, 38);
      doc.text(item.camera_model || "LEICA / ANALOG", sideX, 81);

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text("YEAR", sideX, 95);
      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(item.year || "2026", sideX, 101);

      const yearSuffix = (item.year || "2026").slice(-2);
      doc.setFontSize(16);
      doc.setFont("courier", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`REF-${yearSuffix}`, sideX, 145);
    }

    // Page Footer
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.2);
    doc.line(15, pageHeight - 11, pageWidth - 15, pageHeight - 11);

    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("MALTE BREUER — PHOTOGRAPHY PORTFOLIO", 15, pageHeight - 6);
    doc.text("CONFIDENTIAL PRESENTATION DECK", pageWidth - 70, pageHeight - 6);

    pageNumber++;
  }

  // Save PDF
  if (onProgress) onProgress("PDF wird fertiggestellt...");
  doc.save("Malte_Breuer_Photography_Portfolio.pdf");
}
