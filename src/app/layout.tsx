import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

import { Shell } from "@/components/shell";

/**
 * Public Sans — diseñada para servicios públicos, alta legibilidad en datos.
 * Una sola familia en toda la app: menos ruido tipográfico para lectura 65+.
 */
const sans = Public_Sans({
  variable: "--fuente-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Contigo — acompañamiento después del alta",
  description:
    "Acompañamiento después del alta para la persona operada y quien la cuida.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full bg-papel text-tinta">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
