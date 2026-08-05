import type { ReactNode } from "react";

import type { Color } from "@/lib/tipos";

/**
 * El estado del día. Es lo primero y lo más grande que ve el paciente.
 *
 * Deliberadamente NO es un semáforo literal de tres luces: la mayoría de los
 * días el resultado es verde, y un disco verde repetido 89 veces enseña a
 * ignorar la pantalla. En vez de eso, cada estado tiene su propia voz
 * tipográfica y su propia marca dibujada.
 */

const MARCAS: Record<Color, ReactNode> = {
  verde: (
    <path
      d="M5 17 L13 25 L27 8"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="square"
    />
  ),
  amarillo: (
    <>
      <path
        d="M16 5 L16 19"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <path
        d="M16 24 L16 26"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="square"
      />
    </>
  ),
  rojo: (
    <>
      <circle cx="16" cy="16" r="12" fill="none" strokeWidth="2.5" />
      <path
        d="M16 8 L16 17"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <path
        d="M16 21 L16 23"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="square"
      />
    </>
  ),
};

const ESTILO: Record<
  Color,
  { fondo: string; borde: string; trazo: string; rotulo: string; titulo: string }
> = {
  verde: {
    fondo: "bg-verde-claro",
    borde: "border-verde",
    trazo: "stroke-verde",
    rotulo: "Seguimiento habitual",
    titulo: "Todo dentro de lo esperado",
  },
  amarillo: {
    fondo: "bg-ambar-claro",
    borde: "border-ambar",
    trazo: "stroke-ambar",
    rotulo: "Requiere evaluación",
    titulo: "Conviene consultar",
  },
  rojo: {
    fondo: "bg-rojo-claro",
    borde: "border-rojo",
    trazo: "stroke-rojo",
    rotulo: "Atención inmediata",
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
      className={`surgir border-l-4 ${estilo.borde} ${estilo.fondo} px-7 py-8 sm:px-10 sm:py-11`}
    >
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 32 32"
          aria-hidden
          className={`size-7 shrink-0 ${estilo.trazo}`}
        >
          {MARCAS[color]}
        </svg>
        <span className="marca text-tinta">{estilo.rotulo}</span>
      </div>

      <h1 className="mt-5 max-w-[15ch] font-titulo text-4xl font-semibold leading-[1.08] sm:text-5xl">
        {estilo.titulo}
      </h1>

      {children}
    </section>
  );
}
