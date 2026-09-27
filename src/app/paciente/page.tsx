"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { LineaTiempo } from "@/components/linea-tiempo";
import { Semaforo } from "@/components/semaforo";
import { Marca } from "@/components/ui";
import { obtenerVisitas, registrarCheckin, sesionActual, type Visita } from "@/lib/api";
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
    const nuevas = { ...respuestas, [preguntaId]: valor };
    setRespuestas(nuevas);
    // Si con lo ya respondido el motor determinístico dispara una alerta
    // roja, la conversación se corta y se deriva de inmediato: no se sigue
    // encuestando a una persona que reportó una señal de urgencia.
    if (evaluar(MATRIZ_ETC, nuevas, dia).color === "rojo") {
      setTerminado(true);
      return;
    }
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
    <main className="px-5 py-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Marca>
          Día <span className="cifra">{dia}</span> después del alta
        </Marca>
        <Progreso total={preguntas.length} actual={indice} />
      </header>

      <Link
        href="/paciente/medicacion"
        className="boton-secundario mt-5 w-full text-center"
      >
        Fotografiar mi medicación de hoy
      </Link>

      <h1
        key={pregunta.id}
        className="surgir mt-8 text-[1.75rem] font-bold leading-[1.2]"
      >
        {pregunta.texto}
      </h1>

      <div key={`op-${pregunta.id}`} className="surgir mt-7 space-y-3">
        {pregunta.opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => responder(pregunta.id, opcion.valor)}
            className="tarjeta flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left transition-transform active:scale-[0.99] hover:border-primario-borde"
          >
            <span className="py-1 text-xl font-semibold leading-snug">
              {opcion.etiqueta}
            </span>
            <span aria-hidden className="shrink-0 text-xl text-tinta-tenue">
              ›
            </span>
          </button>
        ))}
      </div>

      {indice > 0 && (
        <button
          type="button"
          onClick={() => setIndice(indice - 1)}
          className="mt-8 text-primario-hondo underline underline-offset-4"
        >
          ← Volver a la pregunta anterior
        </button>
      )}
    </main>
  );
}

/** Las visitas que la enfermera particular ya fijó. */
function VisitasAgendadas() {
  const [visitas, setVisitas] = useState<Visita[]>([]);

  useEffect(() => {
    const sesion = sesionActual();
    if (!sesion?.pacienteActivo) return;
    obtenerVisitas(sesion.pacienteActivo)
      .then((d) => setVisitas(d.visitas.filter((v) => v.estado === "programada")))
      .catch(() => setVisitas([]));
  }, []);

  if (visitas.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold">Su enfermera la visita</h2>
      <ul className="mt-4 space-y-3">
        {visitas.map((v) => (
          <li key={v.id} className="tarjeta flex items-center gap-4 px-5 py-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primario-claro text-primario-hondo">
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
                <path d="M3 10h18M7 3v3m10-3v3M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
              </svg>
            </span>
            <span>
              <span className="block font-bold">
                {v.fecha} · {v.hora}
              </span>
              <span className="mt-0.5 block text-sm text-tinta-media">
                {v.motivo ?? "Visita de seguimiento"}
                {v.nombre_profesional ? ` — ${v.nombre_profesional}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
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
          className={`h-1.5 w-6 rounded-full ${i <= actual ? "bg-primario" : "bg-linea"}`}
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
    <main className="px-5 py-7">
      <Semaforo color={evaluacion.color}>
        {evaluacion.alertas.length > 0 && (
          <ul className="mt-6 space-y-5 border-t border-current/15 pt-6">
            {evaluacion.alertas.map((alerta) => (
              <li key={alerta.reglaId}>
                <p className="text-lg font-semibold leading-snug">
                  {alerta.senal.descripcion}
                </p>
                <p className="mt-1.5 text-lg font-bold">{alerta.senal.accion}</p>
              </li>
            ))}
          </ul>
        )}

        {evaluacion.color === "rojo" && (
          <Link href="/ayuda" className="boton-primario mt-6 w-full bg-rojo hover:bg-rojo">
            Abrir Ayuda: llamar ahora
          </Link>
        )}
        {evaluacion.color === "amarillo" && (
          <p className="mt-5 text-tinta-media">
            Su persona de apoyo puede ver este resultado y acompañarla en el
            siguiente paso.
          </p>
        )}

        {evaluacion.color === "verde" && evaluacion.normalizaciones.length > 0 && (
          <ul className="mt-6 space-y-4 border-t border-current/15 pt-6">
            {evaluacion.normalizaciones.map((sintoma) => (
              <li key={sintoma.id} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-verde" />
                <span className="leading-relaxed">
                  {sintoma.mensajeNormalizador}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Semaforo>

      {guardado === "si" && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-verde">
          <span aria-hidden>✓</span> Guardado en su seguimiento — quien la
          acompaña puede verlo
        </p>
      )}
      {guardado === "error" && (
        <p className="mt-4 text-sm text-tinta-media">
          No se pudo guardar en el servidor; el resultado de hoy sigue siendo
          válido.
        </p>
      )}

      <VisitasAgendadas />

      <section className="tarjeta mt-8 px-5 py-5">
        <LineaTiempo matriz={MATRIZ_ETC} dia={dia} />
      </section>

      {evaluacion.hitosProximos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">Lo que viene</h2>
          <ul className="mt-4 space-y-3">
            {evaluacion.hitosProximos.map((hito) => (
              <li key={hito.id} className="tarjeta flex items-center gap-4 px-5 py-4">
                <span className="marca cifra shrink-0 rounded-full bg-primario-claro px-3 py-1.5 text-primario-hondo">
                  D+{hito.diaRelativo}
                </span>
                <span>
                  <span className="block font-bold">{hito.titulo}</span>
                  <span className="mt-0.5 block text-sm text-tinta-media">
                    {hito.descripcion}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={onReiniciar}
          className="text-primario-hondo underline underline-offset-4"
        >
          Responder de nuevo
        </button>
        <Link href="/" className="text-primario-hondo underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>

      {evaluacion.reglasBloqueadas.length > 0 && (
        <details className="mt-12 border-t border-dashed border-linea-fuerte pt-4">
          <summary className="marca cursor-pointer hover:text-tinta">
            Vista técnica · {evaluacion.reglasBloqueadas.length} reglas en
            espera de validación
          </summary>
          <p className="mt-3 text-sm text-tinta-media">
            El motor no dispara alertas sin fuente clínica verificada. Estas
            quedan en espera hasta la validación profesional, aunque la
            respuesta del paciente coincida con la regla.
          </p>
          <ul className="mt-3 space-y-2">
            {evaluacion.reglasBloqueadas.map((r) => (
              <li key={r.reglaId} className="text-sm text-tinta-media">
                <code className="font-mono text-sm text-tinta">{r.reglaId}</code>{" "}
                — {r.motivo}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
