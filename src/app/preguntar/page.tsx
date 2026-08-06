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
  "¿Para qué es el paracetamol que me dieron?",
  "¿Qué movimientos debo evitar con la pierna operada?",
  "¿Hasta cuándo tomo el anticoagulante?",
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
      <main className="px-5 py-8">
        <Marca>Pregunte con confianza</Marca>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Primero hay que entrar
        </h1>
        <p className="mt-3 text-tinta-media">
          El baúl responde solo a la persona dueña de los documentos o a quien
          ella autorizó. Entre con una cuenta de demostración.
        </p>
        <Link href="/acceso" className="boton-primario mt-6">
          Ir al acceso
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-col px-5 py-6">
      <header>
        <Marca>Pregunte con confianza</Marca>
        <h1 className="mt-1.5 text-2xl font-bold leading-tight">
          ¿Qué quiere saber?
        </h1>
        <p className="mt-2 text-sm text-tinta-media">
          Le respondemos con sus propios documentos y las guías del Ministerio
          de Salud, diciéndole siempre de dónde sale cada cosa. Si algo no está
          escrito, se lo decimos con la misma confianza.
        </p>
      </header>

      {turnos.length === 0 && (
        <div className="mt-6">
          <Marca>Preguntas frecuentes</Marca>
          <div className="mt-3 space-y-2.5">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="tarjeta flex w-full items-center justify-between gap-3 px-4.5 py-3.5 text-left transition-transform active:scale-[0.99] hover:border-primario-borde"
              >
                <span className="font-semibold leading-snug">{s}</span>
                <span aria-hidden className="text-tinta-tenue">›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex-1 space-y-7">
        {turnos.map((turno, i) => (
          <article key={i} className="surgir">
            {/* La pregunta, como burbuja propia */}
            <p className="ml-8 rounded-3xl rounded-br-md bg-primario px-5 py-3 text-white">
              {turno.pregunta}
            </p>

            {!turno.respuesta && !turno.error && (
              <p className="marca mt-4 animate-pulse">
                Buscando en sus documentos y las guías oficiales…
              </p>
            )}

            {turno.error && (
              <p role="alert" className="mt-4 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-3.5">
                {turno.error}
              </p>
            )}

            {turno.respuesta && (
              <div className="tarjeta mt-3 mr-8 rounded-3xl rounded-tl-md px-5 py-4">
                <p className="whitespace-pre-line leading-relaxed">
                  {turno.respuesta.respuesta}
                </p>

                {turno.respuesta.requiere_revision_profesional && (
                  <p className="mt-3.5 flex items-start gap-2 rounded-xl bg-ambar-claro px-3.5 py-2.5 text-sm text-tinta">
                    <span aria-hidden>💬</span>
                    <span>
                      Buen tema para su próximo control: confírmelo con su
                      equipo de salud.
                    </span>
                  </p>
                )}

                {turno.respuesta.citas?.length > 0 && (
                  <div className="mt-3.5 border-t border-dashed border-linea pt-3">
                    <Marca>Textual de sus documentos</Marca>
                    <ul className="mt-2 space-y-2">
                      {turno.respuesta.citas.slice(0, 4).map((cita, j) => (
                        <li
                          key={j}
                          className="border-l-[3px] border-primario-borde pl-3 text-sm italic leading-snug text-tinta-media"
                        >
                          «{cita.textoCitado}»
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {turno.respuesta.fragmentos.length > 0 && (
                  <details className="mt-3.5 border-t border-dashed border-linea pt-3">
                    <summary className="marca cursor-pointer hover:text-tinta">
                      De dónde sale esta respuesta
                    </summary>
                    <ul className="mt-2.5 space-y-1.5">
                      {turno.respuesta.fragmentos.map((f) => (
                        <li key={f.n} className="text-sm text-tinta-media">
                          <span className="cifra">[{f.n}]</span>{" "}
                          {citaFuente(f.tipo, f.fuente)}
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
        className="sticky bottom-24 mt-6 rounded-3xl border border-linea bg-papel-alto p-2 shadow-lg shadow-tinta/5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(pregunta);
        }}
      >
        <div className="flex gap-2">
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escriba su pregunta con sus palabras…"
            maxLength={500}
            className="w-full rounded-full bg-transparent px-4 py-3 outline-none placeholder:text-tinta-tenue"
          />
          <button
            type="submit"
            disabled={ocupado || !pregunta.trim()}
            aria-label="Enviar pregunta"
            className="boton-primario min-h-12 shrink-0 px-5"
          >
            {ocupado ? "…" : "Enviar"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-center text-xs text-tinta-tenue">
        Si se siente mal en este momento, la pestaña{" "}
        <Link href="/ayuda" className="font-semibold text-rojo underline underline-offset-2">
          Ayuda
        </Link>{" "}
        llama directo a quien puede atenderla.
      </p>
    </main>
  );
}

function esSesion(s: Sesion | null | "cargando"): s is Sesion {
  return s !== null && s !== "cargando";
}

/**
 * Etiqueta + nombre de la fuente sin repetirse: varias fuentes del corpus ya
 * traen su tipo en el nombre («Nota curada del proyecto — Línea 03»), y
 * anteponerle la etiqueta lo mostraba dos veces.
 */
function citaFuente(tipo: string, fuente: string) {
  const etiqueta = etiquetaFuente(tipo);
  const normalizar = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return normalizar(fuente).startsWith(normalizar(etiqueta))
    ? fuente
    : `${etiqueta}: ${fuente}`;
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
