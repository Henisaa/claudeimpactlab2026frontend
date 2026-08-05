import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/**
 * Source Serif 4 — serif humanista diseñado para lectura en pantalla.
 * Public Sans — diseñada para servicios públicos, alta legibilidad en datos.
 * Ninguna de las dos es la fuente por defecto de nada, que es parte del punto.
 */
const serif = Source_Serif_4({
  variable: "--fuente-serif",
  subsets: ["latin"],
  display: "swap",
});

const sans = Public_Sans({
  variable: "--fuente-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seguimiento postoperatorio",
  description:
    "Acompañamiento después del alta para la persona operada y quien la cuida.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-papel text-tinta">
        {children}
      </body>
    </html>
  );
}
