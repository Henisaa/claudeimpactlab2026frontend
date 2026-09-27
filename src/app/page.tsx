import Link from "next/link";
import type { ReactNode } from "react";

import { Marca } from "@/components/ui";

export default function Inicio() {
  return (
    <main className="px-5 py-8">
      <Marca>Después de su operación de cadera</Marca>
      <h1 className="mt-2 text-[2rem] font-bold leading-[1.12]">
        Usted se recupera.
        <br />
        Nosotros acompañamos.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-tinta-media">
        Del hospital se sale con papeles, recetas y dudas. Contigo los ordena,
        le pregunta cada día cómo está y avisa a tiempo cuando algo necesita
        atención — durante los 90 días que dura la recuperación.
      </p>

      <nav className="mt-8 space-y-3">
        <Puerta
          href="/paciente"
          titulo="¿Cómo está hoy?"
          detalle="Su chequeo del día: 5 preguntas, un minuto"
          icono={
            <path d="M9 21h6M12 3v1M5.6 5.6l.7.7M18.4 5.6l-.7.7M4 12H3m18 0h-1M7 17a5 5 0 1 1 10 0" />
          }
        />
        <Puerta
          href="/cuidador"
          titulo="El baúl de sus documentos"
          detalle="Fotografíe recetas e informes; quedan ordenados y a mano"
          icono={
            <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm0 0 2-4h12l2 4M10 12h4" />
          }
        />
        <Puerta
          href="/preguntar"
          titulo="Pregunte con confianza"
          detalle="Respuestas desde SUS documentos y las guías del MINSAL"
          icono={
            <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5ZM9 12h.01M13 12h.01M17 12h.01" />
          }
        />
        <Puerta
          href="/ayuda"
          titulo="Ayuda y emergencias"
          detalle="Números a un toque y todo preparado por si acaso"
          tono="rojo"
          icono={
            <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10ZM8.5 11h2l1-2 1.5 4 1-2h1.5" />
          }
        />
      </nav>

      <p className="mt-7 text-center">
        <Link
          href="/acceso"
          className="text-primario-hondo underline underline-offset-4"
        >
          Entrar con una cuenta de demostración →
        </Link>
      </p>

      <footer className="mt-10 rounded-2xl bg-papel-hondo px-5 py-4">
        <p className="text-sm leading-relaxed text-tinta-media">
          <strong className="text-tinta">Lo que esta app no hace:</strong> no
          diagnostica, no receta ni cambia dosis. Organiza lo que ya escribió
          su equipo de salud y le avisa cuándo corresponde consultar. Su
          equipo de salud y su persona de apoyo siguen siempre en el circuito.
        </p>
        <p className="mt-2 text-sm text-tinta-tenue">
          Prototipo · Claude Impact Lab 2026 · datos sintéticos
        </p>
      </footer>
    </main>
  );
}

function Puerta({
  href,
  titulo,
  detalle,
  icono,
  tono = "primario",
}: {
  href: string;
  titulo: string;
  detalle: string;
  icono: ReactNode;
  tono?: "primario" | "rojo";
}) {
  return (
    <Link
      href={href}
      className="tarjeta boton group flex items-center gap-4 px-5 py-4 no-underline transition-transform active:scale-[0.99]"
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
          tono === "rojo" ? "bg-rojo-claro text-rojo" : "bg-primario-claro text-primario-hondo"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icono}
        </svg>
      </span>
      <span className="flex-1">
        <span className="block text-xl font-bold leading-snug">{titulo}</span>
        <span className="mt-0.5 block text-sm text-tinta-media">{detalle}</span>
      </span>
      <span aria-hidden className="text-xl text-tinta-tenue transition-transform group-hover:translate-x-1">
        ›
      </span>
    </Link>
  );
}
