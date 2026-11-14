import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller de Norma",
  description: "Piezas de cerámica hechas a mano por Norma.",
};

export const viewport: Viewport = {
  themeColor: "#efece6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
