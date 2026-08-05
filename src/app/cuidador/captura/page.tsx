"use client";

import Link from "next/link";
import { useState } from "react";

import { Marca, Seccion } from "@/components/ui";

/**
 * Captura → extracción → pre-llenado editable.
 *
 * El resultado se presenta explícitamente como BORRADOR. Cada campo muestra la
 * cita literal del documento junto al valor estructurado, para que revisar
 * contra el papel sea trivial. Nada entra al baúl sin confirmación humana.
 */

type Confianza = "alta" | "media" | "baja";

interface CampoExtraido {
  valor: string | null;
  texto_original: string;
  confianza: Confianza;
}

interface MedicamentoExtraido {
  nombre: string;
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  texto_original: string;
  confianza: Confianza;
}

interface Borrador {
  tipo_documento: string;
  fecha_alta: CampoExtraido | null;
  medicamentos: MedicamentoExtraido[];
  indicaciones_curacion: CampoExtraido | null;
  proximo_control: CampoExtraido | null;
  alergias: CampoExtraido[];
  datos_faltantes: string[];
  conflictos: string[];
  advertencias: string[];
}

export default function Captura() {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  async function extraer() {
    if (archivos.length === 0) return;
    setCargando(true);
    setError(null);
    setBorrador(null);

    const cuerpo = new FormData();
    for (const archivo of archivos) cuerpo.append("imagenes", archivo);

    try {
      const respuesta = await fetch("/api/extraer", {
        method: "POST",
        body: cuerpo,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo procesar el documento.");
        return;
      }
      setBorrador(datos.borrador);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <header className="border-b-2 border-tinta pb-6">
        <Marca>Captura</Marca>
        <h1 className="mt-3 font-titulo text-4xl font-semibold leading-tight">
          Fotografiar un documento
        </h1>
        <p className="mt-3 max-w-prose text-tinta-media">
          El informe de alta, la receta o el papel de indicaciones. Tal como
          está: arrugado, con mala luz, torcido.
        </p>
      </header>

      <label className="mt-10 block cursor-pointer border-2 border-dashed border-linea-fuerte bg-papel-alto px-7 py-10 text-center transition-colors hover:border-tinta hover:bg-papel-hondo">
        <span className="block font-titulo text-2xl font-semibold">
          Elegir fotografías
        </span>
        <span className="mt-2 block text-tinta-media">
          JPG, PNG o WEBP · se pueden subir varias del mismo documento
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
        {archivos.length > 0 && (
          <span className="marca mt-5 block text-tinta">
            <span className="cifra">{archivos.length}</span> archivo(s)
            seleccionado(s)
          </span>
        )}
      </label>

      <button
        type="button"
        onClick={extraer}
        disabled={archivos.length === 0 || cargando}
        className="mt-8 border-2 border-tinta bg-papel-alto px-7 py-3 font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:cursor-not-allowed disabled:border-linea-fuerte disabled:bg-transparent disabled:text-tinta-tenue disabled:hover:bg-transparent"
      >
        {cargando ? "Leyendo el documento…" : "Leer el documento"}
      </button>

      {cargando && (
        <p className="marca mt-5 animate-pulse">
          Claude está transcribiendo · esto puede tardar unos segundos
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="surgir mt-8 border-l-4 border-rojo bg-rojo-claro px-6 py-5 text-lg"
        >
          {error}
        </p>
      )}

      {borrador && <RevisionBorrador borrador={borrador} />}

      <footer className="mt-16 border-t border-linea pt-6">
        <Link
          href="/cuidador"
          className="text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          ← Volver al seguimiento
        </Link>
      </footer>
    </main>
  );
}

function RevisionBorrador({ borrador }: { borrador: Borrador }) {
  return (
    <div className="surgir">
      {borrador.advertencias.length > 0 && (
        <ul className="mt-10 space-y-3">
          {borrador.advertencias.map((a, i) => (
            <li
              key={i}
              className="border-l-4 border-rojo bg-rojo-claro px-6 py-4"
            >
              {a}
            </li>
          ))}
        </ul>
      )}

      {borrador.conflictos.length > 0 && (
        <section className="mt-10 border-l-4 border-ambar bg-ambar-claro px-7 py-6">
          <Marca className="text-tinta">Contradicciones sin resolver</Marca>
          <ul className="mt-4 space-y-2">
            {borrador.conflictos.map((c, i) => (
              <li key={i} className="font-titulo text-xl leading-snug">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-tinta-media">
            El sistema no elige cuál es la correcta. Requiere revisión
            profesional.
          </p>
        </section>
      )}

      <Seccion
        numero="01"
        titulo="Borrador para revisar"
        descripcion="Compare cada valor con el papel antes de confirmarlo. El texto entre comillas es la cita literal de lo que dice el documento."
      >
        <div className="mt-6">
          <CampoBorrador etiqueta="Fecha de alta" campo={borrador.fecha_alta} />
          <CampoBorrador
            etiqueta="Indicaciones de curación"
            campo={borrador.indicaciones_curacion}
          />
          <CampoBorrador
            etiqueta="Próximo control"
            campo={borrador.proximo_control}
          />

          {borrador.medicamentos.length > 0 && (
            <div className="border-t border-linea py-5">
              <Marca>Medicamentos</Marca>
              <ul className="mt-4 space-y-7">
                {borrador.medicamentos.map((med, i) => (
                  <li key={i}>
                    <p className="sin-confirmar font-titulo text-2xl leading-snug">
                      {med.nombre}
                    </p>
                    <p className="mt-1 text-tinta-media">
                      {[med.dosis, med.frecuencia, med.duracion]
                        .filter(Boolean)
                        .join(" · ") || "Sin dosis consignada en el documento"}
                    </p>
                    <p className="mt-2 font-titulo text-base italic text-tinta-media">
                      «{med.texto_original}»
                    </p>
                    <NivelConfianza nivel={med.confianza} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Seccion>

      {borrador.datos_faltantes.length > 0 && (
        <section className="mt-12 border border-dashed border-linea-fuerte px-7 py-6">
          <Marca>El documento no dice</Marca>
          <ul className="mt-4 space-y-2 text-tinta-media">
            {borrador.datos_faltantes.map((d, i) => (
              <li key={i}>— {d}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-tinta-media">
            Estos campos quedan vacíos a propósito. El sistema no los completa
            por inferencia.
          </p>
        </section>
      )}

      <p className="mt-10 border-l-2 border-linea-fuerte pl-5 text-tinta-media">
        Al confirmar, estos datos entran al baúl. Los que queden sin confirmar
        siguen visibles como pendientes y no alimentan el seguimiento.
      </p>
    </div>
  );
}

function CampoBorrador({
  etiqueta,
  campo,
}: {
  etiqueta: string;
  campo: CampoExtraido | null;
}) {
  return (
    <div className="border-t border-linea py-5">
      <Marca>{etiqueta}</Marca>
      <p
        className={`mt-2 font-titulo text-2xl leading-snug ${
          campo?.valor ? "sin-confirmar" : ""
        }`}
      >
        {campo?.valor ?? (
          <span className="italic text-tinta-tenue">
            No aparece en el documento
          </span>
        )}
      </p>
      {campo?.texto_original && (
        <p className="mt-2 font-titulo text-base italic text-tinta-media">
          «{campo.texto_original}»
        </p>
      )}
      {campo && <NivelConfianza nivel={campo.confianza} />}
    </div>
  );
}

const LECTURA: Record<Confianza, { texto: string; punto: string }> = {
  alta: { texto: "Se lee con claridad", punto: "bg-verde" },
  media: { texto: "Cuesta leerlo — revise con atención", punto: "bg-ambar" },
  baja: { texto: "Poco legible — verifique contra el papel", punto: "bg-rojo" },
};

function NivelConfianza({ nivel }: { nivel: Confianza }) {
  const { texto, punto } = LECTURA[nivel];
  return (
    <p className="marca mt-3 flex items-center gap-2">
      <span aria-hidden className={`inline-block size-2 rounded-[1px] ${punto}`} />
      {texto}
    </p>
  );
}
