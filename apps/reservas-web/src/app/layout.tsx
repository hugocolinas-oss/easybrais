import type { Metadata, Viewport } from "next";
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

/** Límite alto para Server Actions (p. ej. createBooking + SMTP + PDF en Vercel). */
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Easy Brais — Transporte de equipaje en el Camino",
  description: "Reserva el transporte de tu equipaje en el Camino Portugués de forma sencilla y segura.",
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
