import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-easybrais-sans",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-easybrais-mono",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Easy Brais - Gestión",
  description: "Panel de gestión de Easy Brais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${plexSans.variable} ${plexMono.variable} min-h-screen font-sans antialiased`}>{children}</body>
    </html>
  );
}
