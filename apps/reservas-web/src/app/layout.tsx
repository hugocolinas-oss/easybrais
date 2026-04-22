import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Brais — Transporte de equipaje en el Camino",
  description: "Reserva el transporte de tu equipaje en el Camino Portugués de forma sencilla y segura.",
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
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
