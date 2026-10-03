import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AudioProvider from "../components/AudioProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Malte Breuer | Fotografie Biberach",
  description: "Das digitale Darkroom-Portfolio von Malte Breuer. Entdecke Arbeiten aus den Bereichen Events, Landschaft, Street und Personen in Biberach an der Riss.",
  keywords: ["Malte Breuer", "Fotografie", "Portfolio", "Darkroom", "Street Photography", "Events", "Biberach", "Deutschland", "Biberach an der Riss", "Hochzeit", "Hochzeitsfotografie", "Portraits", "Festivals", "Concert", "Comercial", "Corporate"],
  authors: [{ name: "Malte Breuer" }],
  
  openGraph: {
    title: "Malte Breuer | Fotografie Biberach",
    description: "Das digitale Darkroom-Portfolio von Malte Breuer.",
    url: "https://mhlportfolio.xyz",
    siteName: "Malte Breuer Portfolio",
    locale: "de_DE",
    type: "website",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Malte Breuer | Fotografie Biberach",
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
      <head>
        <link rel="preconnect" href="https://ivzuxvcjufvycnbloiez.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ivzuxvcjufvycnbloiez.supabase.co" />
      </head>
      <body className={inter.className}>
        {/* Der AudioProvider umschließt die Kinder und sorgt für den Sound-Loop */}
        <AudioProvider />
        {children}
      </body>
    </html>
  );
}