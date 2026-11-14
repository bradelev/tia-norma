import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taller de Norma",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
