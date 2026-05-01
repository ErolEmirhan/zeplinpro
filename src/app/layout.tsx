import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SplashGate } from "@/components/splash/SplashGate";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Tutar / çarpan rakamları — JetBrains’ten daha sakin, fintech arayüzlerine yakın. */
const mono = IBM_Plex_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Zeplin — Sanal çarpan odası",
  description: "Arkadaşınla sanal bakiye ile zeplin / crash tarzı eğlence oyunu.",
  applicationName: "Zeplin",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zeplin",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  );
}
