import Link from "next/link";

import { LineaTiempo } from "@/components/linea-tiempo";
import { CampoFicha, Marca, Seccion, Sello } from "@/components/ui";
import { CASO_RECUPERACION_ESPERADA } from "@/lib/caso-sintetico";
import { MATRIZ_ETC } from "@/lib/matriz-etc";
import { diaRelativo, huecosDeLaMatriz } from "@/lib/motor";

/**
 * Panel de quien acompaña. Ve el baúl completo y, sobre todo, ve lo que
 * falta: campos sin confirmar, conflictos abiertos y huecos de la matriz
 * clínica. Nada de eso se esconde: esa lista de huecos ES la agenda de la
 * conversación con el profesional.
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
    <main className="px-5 py-7">
      <header>
        <Marca>
          Paciente {baul.pacienteId} · {MATRIZ_ETC.cirugia}
        </Marca>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          El baúl y su seguimiento
        </h1>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/cuidador/captura" className="boton-primario text-center text-sm">
          Fotografiar documento
        </Link>
        <Link href="/preguntar" className="boton-secundario text-center text-sm">
          Preguntar al baúl
        </Link>
      </div>

      <Link
        href="/cuidador/medicacion"
        className="tarjeta mt-3 flex items-center justify-between gap-4 px-5 py-4 no-underline"
      >
        <span>
          <span className="block font-bold">Medicación: fotos del día</span>
          <span className="mt-0.5 block text-sm text-tinta-media">
            Tomas, verificación y avisos por WhatsApp
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-xl text-tinta-tenue">
          ›
        </span>
      </Link>

      <section className="tarjeta mt-6 px-5 py-5">
        <LineaTiempo matriz={MATRIZ_ETC} dia={dia} />
      </section>

      <Seccion
        titulo="El baúl"
        descripcion="Cada dato conserva de qué documento salió, con cuánta certeza se leyó y si una persona ya lo verificó contra el papel original."
      >
        <div className="tarjeta mt-4 px-5 py-5">
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

          <div className="border-t border-linea py-4">
            <Marca>Medicamentos</Marca>
            <ul className="mt-3 space-y-5">
              {baul.medicamentos.map((med, i) => (
                <li key={i}>
                  <p
                    className={`text-lg font-semibold leading-snug ${
                      med.confirmado ? "" : "sin-confirmar"
                    }`}
                  >
                    {med.valor?.nombre}
                  </p>
                  <p className="mt-0.5 text-sm text-tinta-media">
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
            <p className="mt-4 rounded-xl bg-papel-hondo px-4 py-3 text-sm text-tinta-media">
              Las dosis, frecuencias y duraciones las escribió un profesional.
              El sistema las transcribe y las trazabiliza; no las calcula, no
              las convierte y no las completa.
            </p>
          </div>
        </div>
      </Seccion>

      {sinConfirmar > 0 && (
        <section className="mt-6 rounded-3xl border border-ambar/30 bg-ambar-claro px-5 py-5">
          <Marca className="text-tinta">Pendiente de confirmación</Marca>
          <p className="mt-2 text-xl font-bold leading-snug">
            <span className="cifra">{sinConfirmar}</span> datos esperan que
            alguien los verifique
          </p>
          <p className="mt-1.5 text-sm text-tinta-media">
            Ningún dato extraído de una fotografía cuenta como cierto hasta que
            una persona lo revisa contra el papel. Los que quedan sin confirmar
            aparecen subrayados en punteado y no alimentan el seguimiento.
          </p>
        </section>
      )}

      <Seccion
        titulo="Estado de la matriz clínica"
        descripcion="Mientras estos puntos no estén cerrados con un profesional de salud, el motor no dispara las alertas correspondientes. Esta lista es la agenda de esa conversación."
      >
        <ol className="mt-4 space-y-2.5">
          {huecos.map((hueco, i) => (
            <li key={i} className="tarjeta flex items-baseline gap-3.5 px-4.5 py-3.5">
              <span className="marca cifra shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-tinta-media">{hueco}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      <footer className="mt-8">
        <Link href="/" className="text-primario-hondo underline underline-offset-4">
          ← Volver al inicio
        </Link>
      </footer>
    </main>
  );
}
