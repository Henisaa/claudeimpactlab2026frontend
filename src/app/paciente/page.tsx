"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { LineaTiempo } from "@/components/linea-tiempo";
import { Semaforo } from "@/components/semaforo";
import { Marca } from "@/components/ui";
import { registrarCheckin, sesionActual } from "@/lib/api";
import { CASO_RECUPERACION_ESPERADA } from "@/lib/caso-sintetico";
import { MATRIZ_ETC } from "@/lib/matriz-etc";
import { diaRelativo, evaluar, preguntasDelDia } from "@/lib/motor";
import type { Respuestas } from "@/lib/tipos";

/**
 * Check-in diario. Una pregunta a la vez, tipografía grande, objetivos amplios.
 *
 * El color que se muestra al final NO lo decide un modelo: sale del motor
 * determinístico sobre la matriz clínica validada. La mayoría de los días es
 * verde, y ese es el punto del producto: normalizar los 89 días en que no pasa
 * nada, para que el día que sí dice "llame ahora" le hagan caso.
 */
export default function CheckinPaciente() {
  const baul = CASO_RECUPERACION_ESPERADA;
  const dia = useMemo(
    () =>
      diaRelativo(baul.fechaAlta.valor ?? new Date().toISOString().slice(0, 10)),
    [baul.fechaAlta.valor],
  );
  const preguntas = useMemo(() => preguntasDelDia(MATRIZ_ETC, dia), [dia]);

  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [terminado, setTerminado] = useState(false);

  function responder(preguntaId: string, valor: string) {
    setRespuestas({ ...respuestas, [preguntaId]: valor });
    if (indice + 1 < preguntas.length) setIndice(indice + 1);
    else setTerminado(true);
  }

  if (terminado) {
    return (
      <Resultado
        dia={dia}
        respuestas={respuestas}
        onReiniciar={() => {
          setRespuestas({});
          setIndice(0);
          setTerminado(false);
        }}
      />
    );
  }

  const pregunta = preguntas[indice];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea pb-4">
        <Marca>
          Día <span className="cifra">{dia}</span> después del alta
        </Marca>
        <Progreso total={preguntas.length} actual={indice} />
      </header>

      <h1
        key={pregunta.id}
        className="surgir mt-12 font-titulo text-4xl font-semibold leading-[1.15] sm:text-[2.75rem]"
      >
        {pregunta.texto}
      </h1>

      <div key={`op-${pregunta.id}`} className="surgir mt-10">
        {pregunta.opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => responder(pregunta.id, opcion.valor)}
            className="group flex w-full items-center justify-between gap-4 border-t border-linea px-1 py-6 text-left transition-colors last:border-b hover:bg-papel-hondo"
          >
            <span className="font-titulo text-2xl leading-snug">
              {opcion.etiqueta}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-xl text-tinta-tenue transition-transform group-hover:translate-x-1 group-hover:text-tinta"
            >
              →
            </span>
          </button>
        ))}
      </div>

      {indice > 0 && (
        <button
          type="button"
          onClick={() => setIndice(indice - 1)}
          className="mt-10 text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          ← Volver a la pregunta anterior
        </button>
      )}
    </main>
  );
}

/** Progreso segmentado. Menos ansioso que una barra que se llena. */
function Progreso({ total, actual }: { total: number; actual: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={actual + 1}
      aria-label={`Pregunta ${actual + 1} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 w-6 ${i <= actual ? "bg-tinta" : "bg-linea"}`}
        />
      ))}
    </div>
  );
}

function Resultado({
  dia,
  respuestas,
  onReiniciar,
}: {
  dia: number;
  respuestas: Respuestas;
  onReiniciar: () => void;
}) {
  const evaluacion = useMemo(
    () => evaluar(MATRIZ_ETC, respuestas, dia),
    [respuestas, dia],
  );

  // Con sesión, el check-in queda documentado en el backend (`seguimientos` y,
  // si corresponde, `alertas`). El color mostrado sigue saliendo del motor
  // local: es el mismo motor determinístico que corre el servidor.
  const [guardado, setGuardado] = useState<"no" | "si" | "error">("no");
  const enviado = useRef(false);
  useEffect(() => {
    const sesion = sesionActual();
    if (!sesion?.pacienteActivo || enviado.current) return;
    enviado.current = true;
    registrarCheckin(sesion.pacienteActivo, respuestas)
      .then(() => setGuardado("si"))
      .catch(() => setGuardado("error"));
  }, [respuestas]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <Semaforo color={evaluacion.color}>
        {evaluacion.alertas.length > 0 && (
          <ul className="mt-8 space-y-6 border-t border-current/15 pt-7">
            {evaluacion.alertas.map((alerta) => (
              <li key={alerta.reglaId}>
                <p className="font-titulo text-xl leading-snug">
                  {alerta.senal.descripcion}
                </p>
                <p className="mt-2 text-lg font-semibold">{alerta.senal.accion}</p>
              </li>
            ))}
          </ul>
        )}

        {evaluacion.color === "verde" && evaluacion.normalizaciones.length > 0 && (
          <ul className="mt-8 space-y-5 border-t border-current/15 pt-7">
            {evaluacion.normalizaciones.map((sintoma) => (
              <li key={sintoma.id} className="flex gap-3">
                <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-verde" />
                <span className="text-lg leading-relaxed">
                  {sintoma.mensajeNormalizador}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Semaforo>

      <section className="mt-16">
        <LineaTiempo matriz={MATRIZ_ETC} dia={dia} />
      </section>

      {evaluacion.hitosProximos.length > 0 && (
        <section className="mt-16">
          <h2 className="border-b-2 border-tinta pb-2 font-titulo text-2xl font-semibold">
            Lo que viene
          </h2>
          <ul>
            {evaluacion.hitosProximos.map((hito) => (
              <li
                key={hito.id}
                className="flex items-baseline gap-5 border-b border-linea py-5"
              >
                <span className="marca cifra shrink-0">D+{hito.diaRelativo}</span>
                <span>
                  <span className="block font-titulo text-xl">{hito.titulo}</span>
                  <span className="mt-1 block text-tinta-media">
                    {hito.descripcion}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guardado === "si" && (
        <p className="marca mt-8">Guardado en su seguimiento ✓</p>
      )}
      {guardado === "error" && (
        <p className="marca mt-8 text-ambar">
          No se pudo guardar en el servidor; el resultado de hoy sigue siendo
          válido.
        </p>
      )}

      <div className="mt-14 flex flex-wrap gap-6">
        <button
          type="button"
          onClick={onReiniciar}
          className="text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          Responder de nuevo
        </button>
        <Link
          href="/"
          className="text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          Volver al inicio
        </Link>
      </div>

      {evaluacion.reglasBloqueadas.length > 0 && (
        <details className="mt-16 border-t border-dashed border-linea-fuerte pt-5">
          <summary className="marca cursor-pointer hover:text-tinta">
            {evaluacion.reglasBloqueadas.length} reglas no se evaluaron · vista
            de desarrollo
          </summary>
          <p className="mt-4 max-w-prose text-sm text-tinta-media">
            El motor no dispara alertas sin fuente clínica verificada. Estas
            quedan bloqueadas hasta la validación profesional, aunque la
            respuesta del paciente coincida con la regla.
          </p>
          <ul className="mt-4 space-y-2">
            {evaluacion.reglasBloqueadas.map((r) => (
              <li key={r.reglaId} className="text-sm text-tinta-media">
                <code className="font-mono text-xs text-tinta">{r.reglaId}</code>{" "}
                — {r.motivo}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
