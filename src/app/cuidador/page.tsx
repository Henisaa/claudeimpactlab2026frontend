import Link from "next/link";

import { LineaTiempo } from "@/components/linea-tiempo";
import { CampoFicha, Marca, Seccion, Sello } from "@/components/ui";
import { CASO_RECUPERACION_ESPERADA } from "@/lib/caso-sintetico";
import { MATRIZ_ETC } from "@/lib/matriz-etc";
import { diaRelativo, huecosDeLaMatriz } from "@/lib/motor";

/**
 * Panel de quien acompaña. Densidad de herramienta profesional, no de app.
 *
 * Ve el baúl completo y, sobre todo, ve lo que falta: campos sin confirmar,
 * conflictos abiertos y huecos de la matriz clínica. Nada de eso se esconde:
 * esa lista de huecos ES la agenda de la conversación con el profesional.
 */
export default function PanelCuidador() {
  const baul = CASO_RECUPERACION_ESPERADA;
  const dia = diaRelativo(
    baul.fechaAlta.valor ?? new Date().toISOString().slice(0, 10),
  );
  const huecos = huecosDeLaMatriz(MATRIZ_ETC);

  const sinConfirmar = [
    baul.fechaAlta,
    baul.indicacionesCuracion,
    baul.proximoControl,
    ...baul.medicamentos,
  ].filter((campo) => !campo.confirmado).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-tinta pb-6">
        <div>
          <Marca>
            Paciente {baul.pacienteId} · matriz {MATRIZ_ETC.id}
          </Marca>
          <h1 className="mt-3 font-titulo text-4xl font-semibold leading-tight">
            Seguimiento
          </h1>
          <p className="mt-2 max-w-prose text-tinta-media">
            {MATRIZ_ETC.cirugia} · CIE-10 {MATRIZ_ETC.cie10}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/cuidador/captura"
            className="boton inline-flex items-center gap-3 border-2 border-tinta bg-papel-alto px-6 py-3 font-semibold no-underline transition-colors hover:bg-tinta hover:text-papel"
          >
            Fotografiar un documento
          </Link>
          <Link
            href="/preguntar"
            className="boton inline-flex items-center gap-3 border-2 border-tinta bg-tinta px-6 py-3 font-semibold text-papel no-underline transition-colors hover:bg-papel-alto hover:text-tinta"
          >
            Pregúntale al baúl
          </Link>
        </div>
      </header>

      <section className="mt-12">
        <LineaTiempo matriz={MATRIZ_ETC} dia={dia} />
      </section>

      <Seccion
        numero="01"
        titulo="El baúl"
        descripcion="Cada dato conserva de qué documento salió, con cuánta certeza se leyó y si una persona ya lo verificó contra el papel original."
      >
        <div className="mt-6">
          <CampoFicha etiqueta="Fecha de alta" campo={baul.fechaAlta} />
          <CampoFicha
            etiqueta="Indicaciones de curación"
            campo={baul.indicacionesCuracion}
          />
          <CampoFicha
            etiqueta="Próximo control"
            campo={baul.proximoControl}
            vacio="Sin fecha en el documento"
          />

          <div className="border-t border-linea py-5">
            <Marca>Medicamentos</Marca>
            <ul className="mt-4 space-y-6">
              {baul.medicamentos.map((med, i) => (
                <li key={i}>
                  <p
                    className={`font-titulo text-2xl leading-snug ${
                      med.confirmado ? "" : "sin-confirmar"
                    }`}
                  >
                    {med.valor?.nombre}
                  </p>
                  <p className="mt-1 text-tinta-media">
                    {med.valor?.dosis} · {med.valor?.frecuencia} ·{" "}
                    {med.valor?.duracion}
                  </p>
                  <Sello
                    origen={med.origen}
                    confianza={med.confianza}
                    confirmado={med.confirmado}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-6 border-l-2 border-linea-fuerte pl-4 text-sm text-tinta-media">
              Las dosis, frecuencias y duraciones las escribió un profesional. El
              sistema las transcribe y las trazabiliza; no las calcula, no las
              convierte y no las completa.
            </p>
          </div>
        </div>
      </Seccion>

      {sinConfirmar > 0 && (
        <section className="mt-10 border-l-4 border-ambar bg-ambar-claro px-7 py-6">
          <Marca className="text-tinta">Pendiente de confirmación</Marca>
          <p className="mt-3 font-titulo text-2xl leading-snug">
            <span className="cifra">{sinConfirmar}</span> datos esperan que
            alguien los verifique
          </p>
          <p className="mt-2 max-w-prose text-tinta-media">
            Ningún dato extraído de una fotografía cuenta como cierto hasta que
            una persona lo revisa contra el papel. Los que quedan sin confirmar
            aparecen subrayados en punteado y no alimentan el seguimiento.
          </p>
        </section>
      )}

      <Seccion
        numero="02"
        titulo="Estado de la matriz clínica"
        descripcion="Mientras estos puntos no estén cerrados con un profesional de salud, el motor no dispara las alertas correspondientes. Esta lista es la agenda de esa conversación."
      >
        <ol className="mt-6">
          {huecos.map((hueco, i) => (
            <li
              key={i}
              className="flex items-baseline gap-5 border-t border-linea py-4"
            >
              <span className="marca cifra shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-tinta-media">{hueco}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      <footer className="mt-16 border-t border-linea pt-6">
        <Link
          href="/"
          className="text-tinta-media underline underline-offset-4 hover:text-tinta"
        >
          ← Volver al inicio
        </Link>
      </footer>
    </main>
  );
}
