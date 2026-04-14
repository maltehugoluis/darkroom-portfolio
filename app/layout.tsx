import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// HIER SIND DEINE SEO-METADATEN
export const metadata: Metadata = {
  title: "Malte Breuer | Visuals & Photography",
  description: "Das digitale Darkroom-Portfolio von Malte Breuer. Entdecke analoge und digitale Arbeiten aus den Bereichen Events, Landschaft, Street und Personen in Biberach an der Riss.",
  keywords: ["Malte Breuer", "Fotografie", "Portfolio", "Darkroom", "Street Photography", "Events", "Biberach", "Deutschland", "Biberach an der Riss"],
  authors: [{ name: "Malte Breuer" }],
  
  // Open Graph (Für WhatsApp, Facebook, LinkedIn etc.)
  openGraph: {
    title: "Malte Breuer | Visuals & Photography",
    description: "Das digitale Darkroom-Portfolio von Malte Breuer.",
    url: "https://mhlportfolio.xyz", // WICHTIG: Trag hier deine echte Vercel-URL ein!
    siteName: "Malte Breuer Portfolio",
    locale: "de_DE",
    type: "website",
  },
  
  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "Malte Breuer | Visuals",
    description: "Das digitale Darkroom-Portfolio von Malte Breuer.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}