import Link from "next/link";

import { Marca } from "@/components/ui";

export default function Inicio() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
      <Marca>Claude Impact Lab 2026 · Línea 03</Marca>

      <h1 className="mt-5 max-w-[14ch] font-titulo text-5xl font-semibold leading-[1.05] sm:text-6xl">
        Continuidad de cuidados después del alta
      </h1>

      <p className="mt-6 max-w-prose text-lg leading-relaxed text-tinta-media">
        La persona sale del hospital con papeles en la mano y sin claridad sobre
        qué esperar. Esto ordena esos papeles y acompaña los 90 días siguientes.
      </p>

      <nav className="mt-14">
        <Puerta
          numero="01"
          href="/paciente"
          titulo="Soy la persona operada"
          detalle="Responder cómo me siento hoy"
        />
        <Puerta
          numero="02"
          href="/cuidador"
          titulo="Acompaño a alguien"
          detalle="Cargar documentos y ver el seguimiento"
        />
      </nav>

      <footer className="mt-20 border-t border-linea pt-6">
        <Marca>Prototipo</Marca>
        <p className="mt-3 max-w-prose text-tinta-media">
          Trabaja únicamente con documentos sintéticos. No entrega diagnósticos
          ni indica tratamientos: organiza lo que ya escribió un profesional y
          señala cuándo corresponde consultar. El profesional de salud permanece
          dentro del circuito de decisión.
        </p>
      </footer>
    </main>
  );
}

function Puerta({
  numero,
  href,
  titulo,
  detalle,
}: {
  numero: string;
  href: string;
  titulo: string;
  detalle: string;
}) {
  return (
    <Link
      href={href}
      className="boton group flex items-baseline gap-5 border-t border-linea py-7 no-underline transition-colors hover:bg-papel-hondo sm:gap-8"
    >
      <span className="marca cifra shrink-0 pt-2">{numero}</span>
      <span className="flex-1">
        <span className="block font-titulo text-3xl font-semibold leading-tight">
          {titulo}
        </span>
        <span className="mt-1 block text-tinta-media">{detalle}</span>
      </span>
      <span
        aria-hidden
        className="shrink-0 self-center text-2xl text-tinta-tenue transition-transform group-hover:translate-x-1 group-hover:text-tinta"
      >
        →
      </span>
    </Link>
  );
}
