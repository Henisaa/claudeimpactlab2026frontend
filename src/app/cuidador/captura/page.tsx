"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Marca, Seccion } from "@/components/ui";
import {
  confirmarDocumento,
  sesionActual,
  subirDocumento,
  type Sesion,
} from "@/lib/api";

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
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [documentoId, setDocumentoId] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    setSesion(sesionActual());
  }, []);

  async function extraer() {
    if (archivos.length === 0) return;
    setCargando(true);
    setError(null);
    setBorrador(null);
    setDocumentoId(null);
    setConfirmado(false);

    try {
      // Con sesión, el documento se guarda en el baúl persistente del backend
      // (consentimiento y auditoría incluidos). Sin sesión, extracción local.
      if (sesion?.pacienteActivo) {
        const datos = await subirDocumento(sesion.pacienteActivo, archivos);
        setBorrador(datos.borrador as Borrador);
        setDocumentoId(datos.documentoId);
      } else {
        const cuerpo = new FormData();
        for (const archivo of archivos) cuerpo.append("imagenes", archivo);
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
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo conectar con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    if (!documentoId) return;
    setError(null);
    try {
      await confirmarDocumento(documentoId);
      setConfirmado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar.");
    }
  }

  return (
    <main className="px-5 py-7">
      <header>
        <Marca>Captura</Marca>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Fotografiar un documento
        </h1>
        <p className="mt-2.5 text-tinta-media">
          El informe de alta, la receta o el papel de indicaciones. Tal como
          está: arrugado, con mala luz, torcido.
        </p>
      </header>

      <label className="mt-7 block cursor-pointer rounded-3xl border-2 border-dashed border-primario-borde bg-primario-claro/50 px-6 py-9 text-center transition-colors hover:border-primario hover:bg-primario-claro">
        <span className="block text-xl font-bold text-primario-hondo">
          Elegir fotografías
        </span>
        <span className="mt-1.5 block text-sm text-tinta-media">
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
        className="boton-primario mt-6 w-full"
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
          className="surgir mt-6 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4"
        >
          {error}
        </p>
      )}

      {!sesion?.pacienteActivo && (
        <p className="marca mt-5">
          Sin sesión: la lectura no se guarda.{" "}
          <Link href="/acceso" className="underline underline-offset-2">
            Entrar para guardar en el baúl
          </Link>
        </p>
      )}

      {borrador && <RevisionBorrador borrador={borrador} />}

      {borrador && documentoId && !confirmado && (
        <div className="mt-6">
          <button type="button" onClick={confirmar} className="boton-primario w-full">
            Ya lo comparé con el papel: guardar en el baúl
          </button>
        </div>
      )}

      {confirmado && (
        <p className="surgir mt-6 rounded-2xl border border-verde/25 bg-verde-claro px-5 py-4">
          Guardado en el baúl ✓ Desde ahora estos datos aparecen en el
          seguimiento y el baúl puede responder preguntas sobre ellos.
        </p>
      )}

      <footer className="mt-8">
        <Link
          href="/cuidador"
          className="text-primario-hondo underline underline-offset-4"
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
              className="rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-3.5"
            >
              {a}
            </li>
          ))}
        </ul>
      )}

      {borrador.conflictos.length > 0 && (
        <section className="mt-8 rounded-3xl border border-ambar/30 bg-ambar-claro px-5 py-5">
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
        <div className="tarjeta mt-4 px-5 py-5">
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
        <section className="mt-8 rounded-3xl border border-dashed border-linea-fuerte px-5 py-5">
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
