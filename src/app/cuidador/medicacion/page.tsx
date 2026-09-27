"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Marca } from "@/components/ui";
import {
  obtenerMedicacionHoy,
  procesarAvisos,
  sesionActual,
  verAvisos,
  type Aviso,
  type Sesion,
  type TomaMedicacion,
} from "@/lib/api";

/**
 * Medicación para quien acompaña: ve qué tomas hubo, qué dijo la verificación
 * y qué avisos salieron por WhatsApp. Sin afirmaciones absolutas: la foto
 * coincide con el plan, no "el paciente tomó bien".
 */
export default function MedicacionCuidador() {
  const [sesion] = useState<Sesion | null>(() => sesionActual());
  const [tomas, setTomas] = useState<TomaMedicacion[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const pacienteId = sesion?.pacienteActivo;

  useEffect(() => {
    if (!pacienteId) return;
    let activo = true;
    Promise.all([
      obtenerMedicacionHoy(pacienteId),
      verAvisos(pacienteId),
    ])
      .then(([hoy, bandeja]) => {
        if (activo) {
          setTomas(hoy.tomas);
          setAvisos(bandeja.notificaciones);
          setCargando(false);
        }
      })
      .catch((e) => {
        if (activo) {
          setError(e instanceof Error ? e.message : "No se pudo conectar.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [pacienteId]);

  async function enviarAvisosPendientes() {
    if (!pacienteId) return;
    setError(null);
    try {
      await procesarAvisos(pacienteId);
      const [hoy, bandeja] = await Promise.all([
        obtenerMedicacionHoy(pacienteId),
        verAvisos(pacienteId),
      ]);
      setTomas(hoy.tomas);
      setAvisos(bandeja.notificaciones);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron procesar los avisos.");
    }
  }

  if (!pacienteId) {
    return (
      <main className="px-5 py-7">
        <h1 className="text-3xl font-bold leading-tight">Medicación</h1>
        <p className="mt-3 text-tinta-media">
          Para ver la medicación de la persona que acompaña, entra con la
          cuenta de la demo.
        </p>
        <Link href="/acceso" className="boton-primario mt-6 w-full text-center">
          Entrar a la demo
        </Link>
        <Link href="/cuidador" className="mt-6 block text-primario-hondo underline underline-offset-4">
          ← Volver al baúl
        </Link>
      </main>
    );
  }

  return (
    <main className="px-5 py-7">
      <header>
        <Marca>Medicación · persona acompañada</Marca>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Tomas y verificación
        </h1>
        <p className="mt-2.5 text-tinta-media">
          Lo que ve aquí sale del comparador determinístico contra el plan
          aprobado. La fotografía es evidencia del envase, no de que se haya
          ingerido.
        </p>
      </header>

      {error && (
        <p role="alert" className="surgir mt-5 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4">
          {error}
        </p>
      )}

      {cargando && <p className="marca mt-6 animate-pulse">Cargando…</p>}

      {!cargando && tomas.length === 0 && (
        <div className="tarjeta mt-6 px-5 py-6">
          <p className="text-lg font-semibold">No hay tomas registradas todavía.</p>
        </div>
      )}

      {tomas.length > 0 && (
        <section className="mt-6">
          <h2 className="text-2xl font-bold">Tomas del día</h2>
          <ul className="mt-4 space-y-3">
            {tomas.map((t) => (
              <li key={t.id} className="tarjeta px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{t.medicamento_nombre}</p>
                    <p className="mt-0.5 text-sm text-tinta-media">
                      {t.horario_local ?? t.hora_local}
                      {t.concentracion ? ` · ${t.concentracion}` : ""}
                    </p>
                  </div>
                  <EtiquetaEstado estado={t.estado} />
                </div>
                {t.verificacion && (
                  <div className="mt-3 rounded-xl bg-papel-hondo px-4 py-3">
                    <p className="text-sm font-semibold">
                      {textoResultado(t.verificacion.resultado_comparacion)}
                    </p>
                    {t.verificacion.motivo && (
                      <p className="mt-1 text-sm text-tinta-media">
                        {t.verificacion.motivo}
                      </p>
                    )}
                  </div>
                )}
                {t.evidencia && (
                  <p className="marca mt-3 text-sm text-tinta-media">
                    Foto recibida a las {t.evidencia.capturada_en}
                  </p>
                )}
                {t.declaracion === "tomada" && (
                  <p className="marca mt-2 text-verde">
                    La persona declaró haberla tomado
                  </p>
                )}
                {t.declaracion === "no_tomada" && (
                  <p className="marca mt-2 text-rojo">
                    La persona declaró no haberla tomado
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Avisos por WhatsApp</h2>
          <button
            type="button"
            onClick={enviarAvisosPendientes}
            className="marca cursor-pointer text-primario-hondo underline underline-offset-4"
          >
            Enviar pendientes
          </button>
        </div>
        {avisos.length === 0 ? (
          <p className="mt-4 text-sm text-tinta-media">Todavía no hay avisos.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {avisos.slice(0, 8).map((a) => (
              <li key={a.id} className="tarjeta px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="marca text-tinta">{a.evento.replaceAll("_", " ")}</p>
                  <span
                    className={`marca shrink-0 rounded-full px-2.5 py-1 text-sm ${
                      a.estado === "enviada"
                        ? "bg-verde-claro text-verde"
                        : a.estado === "fallida" || a.estado === "cancelada"
                          ? "bg-rojo-claro text-rojo"
                          : "bg-ambar/20 text-tinta"
                    }`}
                  >
                    {a.estado}
                  </span>
                </div>
                {a.mensaje && (
                  <p className="mt-2 text-sm leading-relaxed text-tinta-media">
                    {a.mensaje}
                  </p>
                )}
                {a.ultimo_error && (
                  <p className="mt-1 text-sm text-tinta-tenue">{a.ultimo_error}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-8">
        <Link href="/cuidador" className="text-primario-hondo underline underline-offset-4">
          ← Volver al baúl
        </Link>
      </footer>
    </main>
  );
}

function textoResultado(resultado: string) {
  switch (resultado) {
    case "coincide":
      return "El texto visible coincide con el plan registrado.";
    case "no_coincide":
      return "El texto visible no coincide con el plan. Requiere revisión del equipo de salud.";
    case "no_se_puede_confirmar":
      return "La foto no permitió confirmar el medicamento.";
    default:
      return "Verificación pendiente de revisión.";
  }
}

function EtiquetaEstado({ estado }: { estado: string }) {
  const etiquetas: Record<string, string> = {
    pendiente: "Pendiente de foto",
    recordatorio_enviado: "Recordatorio enviado",
    foto_recibida: "Foto recibida",
    coincide: "Coincide",
    no_coincide: "No coincide",
    no_se_puede_confirmar: "No confirmado",
    sin_respuesta: "Sin respuesta",
    revisada: "Revisada",
    cancelada: "Cancelada",
  };
  const tono =
    estado === "coincide"
      ? "bg-verde-claro text-verde"
      : estado === "no_coincide"
        ? "bg-rojo-claro text-rojo"
        : "bg-ambar/20 text-tinta";
  return (
    <span className={`marca shrink-0 rounded-full px-3 py-1.5 ${tono}`}>
      {etiquetas[estado] ?? estado.replaceAll("_", " ")}
    </span>
  );
}
