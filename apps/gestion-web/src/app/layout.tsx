import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
