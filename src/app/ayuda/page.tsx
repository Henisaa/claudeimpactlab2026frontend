"use client";

import { useState } from "react";

import { Marca } from "@/components/ui";

/**
 * Ayuda — la pantalla que se prepara ANTES de necesitarla.
 *
 * Dos trabajos: (1) tener a un toque los números que de verdad responden una
 * urgencia, y (2) dejar lista la información que una emergencia siempre pide
 * y nadie recuerda en el momento. La app acompaña y prepara; la decisión
 * clínica es siempre de los servicios de salud.
 */
export default function Ayuda() {
  const [avisado, setAvisado] = useState(false);

  return (
    <main className="px-5 py-7">
      <Marca>Ayuda y emergencias</Marca>
      <h1 className="mt-2 text-3xl font-bold leading-tight">
        Si necesita ayuda ahora
      </h1>
      <p className="mt-3 text-tinta-media">
        Estos botones llaman directo. No hace falta explicar nada primero:
        conteste las preguntas que le hagan.
      </p>

      <div className="mt-6 space-y-3">
        <a
          href="tel:131"
          className="tarjeta flex items-center gap-4 border-rojo/30 bg-rojo-claro px-5 py-4 no-underline"
        >
          <IconoLlamada className="text-rojo" />
          <span className="flex-1">
            <span className="block text-xl font-bold text-tinta">
              Ambulancia — SAMU
            </span>
            <span className="text-tinta-media">
              Urgencia vital: dificultad para respirar, desmayo, sangrado
            </span>
          </span>
          <span className="cifra text-2xl font-bold text-rojo">131</span>
        </a>

        <a
          href="tel:6003607777"
          className="tarjeta flex items-center gap-4 px-5 py-4 no-underline"
        >
          <IconoLlamada className="text-primario" />
          <span className="flex-1">
            <span className="block text-xl font-bold text-tinta">
              Salud Responde
            </span>
            <span className="text-tinta-media">
              Orientación de salud del MINSAL, las 24 horas
            </span>
          </span>
          <span className="cifra text-sm font-bold text-primario-hondo">
            600 360 7777
          </span>
        </a>

        <button
          type="button"
          onClick={() => setAvisado(true)}
          disabled={avisado}
          className="tarjeta flex w-full items-center gap-4 px-5 py-4 text-left"
        >
          <IconoCorazon className="text-primario" />
          <span className="flex-1">
            <span className="block text-xl font-bold text-tinta">
              {avisado ? "Aviso enviado ✓" : "Avisar a quien la acompaña"}
            </span>
            <span className="text-tinta-media">
              {avisado
                ? "Su persona de apoyo recibió el aviso con su estado de hoy."
                : "Un mensaje con su estado de hoy, sin tener que escribir."}
            </span>
          </span>
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold leading-tight">
          Preparados por si acaso
        </h2>
        <p className="mt-2 text-tinta-media">
          Una emergencia siempre pide los mismos datos. Esta app los deja
          listos por usted:
        </p>
        <ul className="mt-4 space-y-3">
          <Listo titulo="Su lista de medicamentos" detalle="Sale del baúl, tal como la escribió su equipo. En urgencias la van a pedir." />
          <Listo titulo="Su operación y su fecha de alta" detalle="Qué le operaron, cuándo y dónde: la primera pregunta de cualquier servicio." />
          <Listo titulo="Las señales que no esperan" detalle="El chequeo diario pregunta primero por las señales urgentes, para que ningún día pasen desapercibidas." />
          <Listo titulo="Quién la acompaña" detalle="Su persona de apoyo puede ver el seguimiento y recibir avisos, solo porque usted la autorizó." />
        </ul>
      </section>

      <p className="mt-8 rounded-2xl bg-papel-hondo px-5 py-4 text-sm text-tinta-media">
        Esta aplicación acompaña y organiza: no diagnostica ni reemplaza a los
        servicios de urgencia. Prototipo con datos sintéticos; el aviso a la
        persona de apoyo es simulado.
      </p>
    </main>
  );
}

function Listo({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <li className="tarjeta flex gap-3.5 px-5 py-4">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="mt-0.5 size-6 shrink-0 text-verde"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
      <span>
        <span className="block font-bold">{titulo}</span>
        <span className="text-sm text-tinta-media">{detalle}</span>
      </span>
    </li>
  );
}

function IconoLlamada({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-8 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function IconoCorazon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-8 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-6.5-4.2-6.5-9a3.7 3.7 0 0 1 6.5-2.4A3.7 3.7 0 0 1 18.5 11c0 4.8-6.5 9-6.5 9Z" />
    </svg>
  );
}
