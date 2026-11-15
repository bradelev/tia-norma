import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { card, cardCssVariables } from "@/domain/card";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taller de Norma",
  description: "Piezas de cerámica hechas a mano por Norma.",
};

export const viewport: Viewport = {
  themeColor: card.ground,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" style={cardCssVariables as CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
