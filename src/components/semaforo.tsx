import type { ReactNode } from "react";

import type { Color } from "@/lib/tipos";

/**
 * El estado del día. Es lo primero y lo más grande que ve el paciente.
 *
 * Deliberadamente NO es un semáforo literal de tres luces: la mayoría de los
 * días el resultado es verde, y un disco verde repetido 89 veces enseña a
 * ignorar la pantalla. Cada estado tiene su propia voz y su propia marca,
 * en tono de acompañamiento: informar sin asustar.
 */

const MARCAS: Record<Color, ReactNode> = {
  verde: (
    <path
      d="M5 17 L13 25 L27 8"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  amarillo: (
    <>
      <path d="M16 6 L16 19" fill="none" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="25" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  rojo: (
    <>
      <circle cx="16" cy="16" r="12" fill="none" strokeWidth="2.5" />
      <path d="M16 9 L16 17" fill="none" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="22" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
};

const ESTILO: Record<
  Color,
  { fondo: string; borde: string; trazo: string; rotulo: string; titulo: string }
> = {
  verde: {
    fondo: "bg-verde-claro",
    borde: "border-verde/25",
    trazo: "stroke-verde text-verde",
    rotulo: "Seguimiento del día",
    titulo: "Todo dentro de lo esperado",
  },
  amarillo: {
    fondo: "bg-ambar-claro",
    borde: "border-ambar/30",
    trazo: "stroke-ambar text-ambar",
    rotulo: "Para conversar con su equipo",
    titulo: "Conviene consultarlo",
  },
  rojo: {
    fondo: "bg-rojo-claro",
    borde: "border-rojo/30",
    trazo: "stroke-rojo text-rojo",
    rotulo: "No espere",
    titulo: "Busque atención ahora",
  },
};

export function Semaforo({
  color,
  children,
}: {
  color: Color;
  children?: ReactNode;
}) {
  const estilo = ESTILO[color];

  return (
    <section
      aria-live="polite"
      className={`surgir rounded-3xl border ${estilo.borde} ${estilo.fondo} px-6 py-7`}
    >
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 32 32"
          aria-hidden
          className={`size-8 shrink-0 ${estilo.trazo}`}
        >
          {MARCAS[color]}
        </svg>
        <span className="marca text-tinta">{estilo.rotulo}</span>
      </div>

      <h1 className="mt-4 text-3xl font-bold leading-[1.15]">{estilo.titulo}</h1>

      {children}
    </section>
  );
}
