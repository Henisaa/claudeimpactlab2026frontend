"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Marca } from "@/components/ui";
import {
  preguntarAlBaul,
  sesionActual,
  type RespuestaBaul,
  type Sesion,
} from "@/lib/api";

/**
 * Pregúntale al baúl — el RAG del proyecto.
 *
 * La respuesta se construye únicamente con fragmentos recuperados del baúl de
 * la persona, fuentes oficiales y notas curatoriales clasificadas.
 * Cada afirmación lleva su cita [n]; si no hay respaldo, el sistema lo dice
 * en vez de inventar. No diagnostica, no evalúa gravedad, no toca dosis.
 */

interface Turno {
  pregunta: string;
  respuesta?: RespuestaBaul;
  error?: string;
}

const SUGERENCIAS = [
  "¿Hasta cuándo tomo el anticoagulante?",
  "¿Qué movimientos no puedo hacer con la pierna operada?",
  "¿Cuándo es mi próximo control y dónde?",
  "¿Qué cuidados necesita la herida?",
];

export default function PreguntarAlBaul() {
  const [sesion, setSesion] = useState<Sesion | null | "cargando">("cargando");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSesion(sesionActual()), []);
  useEffect(() => finRef.current?.scrollIntoView({ behavior: "smooth" }), [turnos]);

  async function enviar(texto: string) {
    const limpia = texto.trim();
    if (!limpia || ocupado || !esSesion(sesion) || !sesion.pacienteActivo) return;
    setPregunta("");
    setOcupado(true);
    setTurnos((t) => [...t, { pregunta: limpia }]);
    try {
      const respuesta = await preguntarAlBaul(sesion.pacienteActivo, limpia);
      setTurnos((t) =>
        t.map((turno, i) => (i === t.length - 1 ? { ...turno, respuesta } : turno)),
      );
    } catch (e) {
      setTurnos((t) =>
        t.map((turno, i) =>
          i === t.length - 1
            ? { ...turno, error: e instanceof Error ? e.message : "Error de conexión." }
            : turno,
        ),
      );
    } finally {
      setOcupado(false);
    }
  }

  if (sesion === "cargando") return null;

  if (!esSesion(sesion) || !sesion.pacienteActivo) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-14">
        <Marca>Pregúntale al baúl</Marca>
        <h1 className="mt-4 font-titulo text-4xl font-semibold leading-tight">
          Primero hay que entrar
        </h1>
        <p className="mt-4 max-w-prose text-lg text-tinta-media">
          El baúl responde solo a la persona dueña de los documentos o a quien
          ella autorizó. Entra con una cuenta de demostración.
        </p>
        <Link
          href="/acceso"
          className="mt-8 inline-block border-2 border-tinta bg-papel-alto px-7 py-3 font-semibold no-underline transition-colors hover:bg-tinta hover:text-papel"
        >
          Ir al acceso
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <header className="border-b-2 border-tinta pb-6">
        <Marca>
          Pregúntale al baúl · paciente {sesion.pacienteActivo} ·{" "}
          {sesion.usuario.username}
        </Marca>
        <h1 className="mt-3 font-titulo text-4xl font-semibold leading-tight">
          ¿Qué quiere saber?
        </h1>
        <p className="mt-3 max-w-prose text-tinta-media">
          Responde con los documentos del baúl y las guías oficiales del
          Ministerio de Salud, citando de dónde sale cada cosa. No diagnostica
          ni cambia indicaciones: si algo no está escrito, lo dice.
        </p>
      </header>

      {turnos.length === 0 && (
        <div className="mt-10">
          <Marca>Preguntas frecuentes</Marca>
          <div className="mt-4">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="group flex w-full items-center justify-between gap-4 border-t border-linea px-1 py-5 text-left transition-colors last:border-b hover:bg-papel-hondo"
              >
                <span className="font-titulo text-xl leading-snug">{s}</span>
                <span aria-hidden className="text-tinta-tenue group-hover:text-tinta">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {turnos.map((turno, i) => (
          <article key={i} className="surgir">
            <p className="border-l-2 border-tinta pl-5 font-titulo text-2xl leading-snug">
              {turno.pregunta}
            </p>

            {!turno.respuesta && !turno.error && (
              <p className="marca mt-5 animate-pulse">
                Buscando en el baúl y las guías oficiales…
              </p>
            )}

            {turno.error && (
              <p role="alert" className="mt-5 border-l-4 border-rojo bg-rojo-claro px-6 py-4">
                {turno.error}
              </p>
            )}

            {turno.respuesta && (
              <div className="mt-5">
                <p className="whitespace-pre-line text-lg leading-relaxed">
                  {turno.respuesta.respuesta}
                </p>

                {turno.respuesta.requiere_revision_profesional && (
                  <p className="marca mt-4 text-ambar">
                    Requiere confirmación del profesional de salud
                  </p>
                )}

                {turno.respuesta.fragmentos.length > 0 && (
                  <details className="mt-5 border-t border-dashed border-linea-fuerte pt-4">
                    <summary className="marca cursor-pointer hover:text-tinta">
                      Fuentes consultadas
                    </summary>
                    <ul className="mt-3 space-y-1.5">
                      {turno.respuesta.fragmentos.map((f) => (
                        <li key={f.n} className="text-sm text-tinta-media">
                          <span className="cifra">[{f.n}]</span>{" "}
                          {etiquetaFuente(f.tipo)}
                          : {f.fuente}
                          {f.url && (
                            <>
                              {" · "}
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 hover:text-tinta"
                              >
                                ver fuente
                              </a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </article>
        ))}
        <div ref={finRef} />
      </div>

      <form
        className="sticky bottom-0 mt-10 border-t-2 border-tinta bg-papel pb-6 pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(pregunta);
        }}
      >
        <div className="flex gap-3">
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escriba su pregunta con sus palabras…"
            maxLength={500}
            className="w-full border-2 border-linea-fuerte bg-papel-alto px-5 py-4 text-lg outline-none transition-colors placeholder:text-tinta-tenue focus:border-tinta"
          />
          <button
            type="submit"
            disabled={ocupado || !pregunta.trim()}
            className="shrink-0 border-2 border-tinta bg-papel-alto px-6 font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:border-linea-fuerte disabled:text-tinta-tenue disabled:hover:bg-transparent"
          >
            {ocupado ? "…" : "Preguntar"}
          </button>
        </div>
        <p className="mt-3 text-sm text-tinta-media">
          Ante una urgencia no espere una respuesta aquí: llame a los servicios
          de urgencia o a Salud Responde, 600 360 7777.
        </p>
      </form>

      <footer className="mt-4 border-t border-linea pt-5">
        <Link
          href={sesion.usuario.tipo === "paciente" ? "/paciente" : "/cuidador"}
          className="text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          ← Volver
        </Link>
      </footer>
    </main>
  );
}

function esSesion(s: Sesion | null | "cargando"): s is Sesion {
  return s !== null && s !== "cargando";
}

function etiquetaFuente(tipo: string) {
  switch (tipo) {
    case "documento_paciente":
      return "Documento del baúl";
    case "nota_proyecto":
      return "Nota curada del proyecto";
    case "matriz_clinica":
      return "Matriz clínica con fuente";
    case "guia_oficial":
      return "Fuente oficial";
    default:
      return "Fuente no clasificada";
  }
}
