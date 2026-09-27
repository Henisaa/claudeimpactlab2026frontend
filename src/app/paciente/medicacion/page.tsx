"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Marca } from "@/components/ui";
import {
  confirmarToma,
  crearTomaDemo,
  enviarFotoToma,
  obtenerMedicacionHoy,
  sesionActual,
  type ResultadoMedicacion,
  type Sesion,
  type TomaMedicacion,
} from "@/lib/api";

/**
 * Medicación del día: fotografía el envase, la IA lee lo visible y el
 * comparador determinístico decide si coincide con el plan aprobado.
 *
 * La pantalla respeta las reglas del proyecto: una decisión a la vez, letra
 * grande, y nunca se afirma que el medicamento fue ingerido por el hecho de
 * haber una foto. La declaración "lo tomé" es una pregunta aparte.
 *
 * Prototipo: el selector de "demo" solo existe porque CLAUDE_MOCK=true hace
 * la lectura determinística; en producción esa opción no se ofrece.
 */

type Pantalla =
  | "cargando"
  | "lista"
  | "error"
  | "foto"
  | "procesando"
  | "resultado"
  | "final";

const ACCIONABLES = new Set(["pendiente", "recordatorio_enviado", "foto_recibida", "verificacion_pendiente"]);

const ETIQUETA_ESTADO: Record<string, { texto: string; tono: string }> = {
  pendiente: { texto: "Pendiente de la foto", tono: "bg-ambar/20 text-tinta" },
  recordatorio_enviado: { texto: "Recordatorio enviado", tono: "bg-ambar/20 text-tinta" },
  foto_recibida: { texto: "Foto recibida", tono: "bg-primario-claro text-primario-hondo" },
  coincide: { texto: "Coincide con el plan", tono: "bg-verde-claro text-verde" },
  no_coincide: { texto: "No coincide", tono: "bg-rojo-claro text-rojo" },
  no_se_puede_confirmar: { texto: "No se pudo confirmar", tono: "bg-ambar/20 text-tinta" },
  sin_respuesta: { texto: "Sin respuesta", tono: "bg-papel-hondo text-tinta-tenue" },
  revisada: { texto: "Revisada", tono: "bg-papel-hondo text-tinta-tenue" },
  cancelada: { texto: "Cancelada", tono: "bg-papel-hondo text-tinta-tenue" },
};

export default function MedicacionPaciente() {
  const [sesion] = useState<Sesion | null>(() => sesionActual());
  const [pantalla, setPantalla] = useState<Pantalla>("cargando");
  const [tomas, setTomas] = useState<TomaMedicacion[]>([]);
  const [toma, setToma] = useState<TomaMedicacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoResultado, setDemoResultado] = useState<string>("auto");
  const [verificacion, setVerificacion] = useState<ResultadoMedicacion | null>(null);
  const [declaracion, setDeclaracion] = useState<"tomada" | "no_tomada" | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  const pacienteId = sesion?.pacienteActivo;

  useEffect(() => {
    if (!pacienteId) return;
    let activo = true;
    obtenerMedicacionHoy(pacienteId)
      .then((datos) => {
        if (activo) {
          setTomas(datos.tomas);
          setPantalla("lista");
        }
      })
      .catch((e) => {
        if (activo) {
          setError(e instanceof Error ? e.message : "No se pudo conectar.");
          setPantalla("error");
        }
      });
    return () => {
      activo = false;
    };
  }, [pacienteId]);

  async function simularToma() {
    if (!pacienteId) return;
    setError(null);
    try {
      await crearTomaDemo(pacienteId);
      const datos = await obtenerMedicacionHoy(pacienteId);
      setTomas(datos.tomas);
      setPantalla("lista");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la toma de demostración.");
    }
  }

  async function recargar() {
    if (!pacienteId) return;
    setError(null);
    try {
      const datos = await obtenerMedicacionHoy(pacienteId);
      setTomas(datos.tomas);
      setPantalla("lista");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar.");
      setPantalla("error");
    }
  }

  function elegirFoto(t: TomaMedicacion) {
    setToma(t);
    setVerificacion(null);
    setDeclaracion(null);
    setPantalla("foto");
  }

  async function enviarFoto(archivo: File) {
    if (!toma) return;
    setPantalla("procesando");
    setError(null);
    try {
      const datos = await enviarFotoToma(
        toma.id,
        archivo,
        demoResultado !== "auto" ? demoResultado : undefined,
      );
      setVerificacion(datos.verificacion.resultado_comparacion);
      setToma(datos.toma);
      setPantalla("resultado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la foto.");
      setPantalla("foto");
    }
  }

  async function confirmar(declaracion: "tomada" | "no_tomada") {
    if (!toma) return;
    setPantalla("procesando");
    try {
      await confirmarToma(toma.id, declaracion);
      setDeclaracion(declaracion);
      setPantalla("final");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
      setPantalla("resultado");
    }
  }

  if (!pacienteId) {
    return (
      <main className="px-5 py-7">
        <h1 className="text-3xl font-bold leading-tight">Medicación del día</h1>
        <p className="mt-3 text-tinta-media">
          Para tomar la foto del medicamento y verificarlo, entra con una
          cuenta de demostración.
        </p>
        <Link href="/acceso" className="boton-primario mt-6 w-full text-center">
          Entrar a la demo
        </Link>
        <Link href="/" className="mt-6 block text-primario-hondo underline underline-offset-4">
          ← Volver al inicio
        </Link>
      </main>
    );
  }

  if (pantalla === "cargando") {
    return (
      <main className="px-5 py-7">
        <p className="marca animate-pulse">Cargando la medicación de hoy…</p>
      </main>
    );
  }

  if (pantalla === "error") {
    return (
      <main className="px-5 py-7">
        <h1 className="text-3xl font-bold leading-tight">Medicación del día</h1>
        <p role="alert" className="surgir mt-6 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4">
          No se pudo conectar con el servidor. Revisa que el backend esté
          corriendo en http://localhost:4000.
        </p>
        {error && <p className="mt-3 text-sm text-tinta-media">{error}</p>}
        <button type="button" onClick={recargar} className="boton-primario mt-6 w-full">
          Reintentar
        </button>
        <Link href="/" className="mt-6 block text-primario-hondo underline underline-offset-4">
          ← Volver al inicio
        </Link>
      </main>
    );
  }

  if (pantalla === "lista") {
    const accionables = tomas.filter((t) => ACCIONABLES.has(t.estado));
    const historial = tomas.filter((t) => !ACCIONABLES.has(t.estado));
    return (
      <main className="px-5 py-7">
        <header>
          <Marca>Medicación</Marca>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            Fotografíe su medicamento de hoy
          </h1>
          <p className="mt-2.5 text-tinta-media">
            Saque una foto de la caja o el blíster, de modo que se lea el
            nombre. La foto no reemplaza la indicación de su equipo de salud.
          </p>
        </header>

        {tomas.length === 0 && (
          <div className="tarjeta mt-6 px-5 py-6">
            <p className="text-lg font-semibold">No hay tomas registradas hoy.</p>
            <p className="mt-2 text-sm text-tinta-media">
              En la demo puede simular la toma de ahora mismo para ver el flujo
              completo.
            </p>
          </div>
        )}

        {accionables.map((t) => (
          <section key={t.id} className="tarjeta mt-5 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-titulo text-2xl font-bold leading-snug">
                  {t.medicamento_nombre}
                </p>
                <p className="mt-1 text-tinta-media">
                  {t.concentracion ?? "Sin concentración leída"} ·{" "}
                  {t.horario_local ?? t.hora_local}
                </p>
              </div>
              <EtiquetaEstado estado={t.estado} />
            </div>
            <button
              type="button"
              onClick={() => elegirFoto(t)}
              className="boton-primario mt-4 w-full"
            >
              Tomar la foto
            </button>
          </section>
        ))}

        {historial.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold">Tomas recientes</h2>
            <ul className="mt-4 space-y-3">
              {historial.map((t) => (
                <li key={t.id} className="tarjeta flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-bold">{t.medicamento_nombre}</p>
                    <p className="mt-0.5 text-sm text-tinta-media">
                      {t.horario_local ?? t.hora_local}
                      {t.verificacion ? ` · ${t.verificacion.motivo ?? "verificada"}` : ""}
                    </p>
                  </div>
                  <EtiquetaEstado estado={t.estado} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <button
          type="button"
          onClick={simularToma}
          className="boton-secundario mt-8 w-full"
        >
          Simular la toma de ahora (demo)
        </button>

        <footer className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/paciente" className="text-primario-hondo underline underline-offset-4">
            ← Volver al control de hoy
          </Link>
          <Link href="/" className="text-primario-hondo underline underline-offset-4">
            Inicio
          </Link>
        </footer>
      </main>
    );
  }

  if (pantalla === "foto" && toma) {
    return (
      <main className="px-5 py-7">
        <header>
          <Marca>Toma de las {toma.horario_local ?? toma.hora_local}</Marca>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            {toma.medicamento_nombre}
          </h1>
          <p className="mt-2.5 text-tinta-media">
            Fotografíe la caja o el blíster para que se lea el nombre y la
            concentración.
          </p>
        </header>

        <label className="mt-7 block cursor-pointer rounded-3xl border-2 border-dashed border-primario-borde bg-primario-claro/50 px-6 py-10 text-center transition-colors hover:border-primario hover:bg-primario-claro">
          <span className="block text-xl font-bold text-primario-hondo">
            Abrir la cámara
          </span>
          <span className="mt-1.5 block text-sm text-tinta-media">
            JPG, PNG o WEBP · se abre la cámara trasera del teléfono
          </span>
          <input
            ref={inputFoto}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void enviarFoto(archivo);
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => inputFoto.current?.click()}
          className="boton-primario mt-5 w-full"
        >
          Tomar la foto ahora
        </button>

        {error && (
          <p role="alert" className="surgir mt-5 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4">
            {error}
          </p>
        )}

        <details className="mt-8 border-t border-dashed border-linea-fuerte pt-4">
          <summary className="marca cursor-pointer hover:text-tinta">
            Solo prototipo: forzar el resultado de la lectura
          </summary>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-tinta-media">
              En la demo (MOCK) puede elegir qué leerá Claude para mostrar los
              tres desenlaces del comparador.
            </p>
            {[
              ["auto", "Automático (coincide)"],
              ["coincide", "Foto que coincide"],
              ["no_coincide", "Foto de otro medicamento"],
              ["no_se_puede_confirmar", "Foto borrosa / ilegible"],
            ].map(([valor, etiqueta]) => (
              <label key={valor} className="flex items-center gap-3 text-lg">
                <input
                  type="radio"
                  name="demoResultado"
                  value={valor}
                  checked={demoResultado === valor}
                  onChange={() => setDemoResultado(valor)}
                  className="size-5 accent-primario"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </details>

        <button
          type="button"
          onClick={() => setPantalla("lista")}
          className="mt-8 text-primario-hondo underline underline-offset-4"
        >
          ← Volver a la lista
        </button>
      </main>
    );
  }

  if (pantalla === "procesando") {
    return (
      <main className="px-5 py-7">
        <p className="marca animate-pulse">Revisando la fotografía con Claude…</p>
      </main>
    );
  }

  if (pantalla === "resultado" && toma && verificacion) {
    return (
      <ResultadoVerificacion
        toma={toma}
        resultado={verificacion}
        onReintentar={() => setPantalla("foto")}
        onConfirmar={confirmar}
        onCerrar={() => void recargar()}
      />
    );
  }

  if (pantalla === "final" && toma) {
    return (
      <main className="px-5 py-7">
        <div className="rounded-3xl border border-verde/25 bg-verde-claro px-5 py-6">
          <h1 className="text-2xl font-bold leading-tight">
            {declaracion === "tomada"
              ? "Gracias. Todo registrado."
              : "Gracias. Quedó registrado que no tomó este medicamento."}
          </h1>
          <p className="mt-3 leading-relaxed">
            {declaracion === "tomada"
              ? "Quien la acompaña ya recibió un aviso por WhatsApp con el resultado de la verificación."
              : "Quien la acompaña ya fue avisado por WhatsApp para poder acompañarla."}
          </p>
          <p className="mt-4 text-sm text-tinta-media">
            La fotografía es una evidencia del envase. La toma queda registrada
            y puede ser revisada por el equipo de salud.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/paciente/medicacion" className="text-primario-hondo underline underline-offset-4">
            Ver la lista de tomas
          </Link>
          <Link href="/paciente" className="text-primario-hondo underline underline-offset-4">
            Volver al control de hoy
          </Link>
        </div>
      </main>
    );
  }

  return null;
}

function EtiquetaEstado({ estado }: { estado: string }) {
  const def = ETIQUETA_ESTADO[estado] ?? {
    texto: estado.replaceAll("_", " "),
    tono: "bg-papel-hondo text-tinta-tenue",
  };
  return (
    <span className={`marca max-w-[55%] rounded-full px-3 py-1.5 text-center ${def.tono}`}>
      {def.texto}
    </span>
  );
}

function ResultadoVerificacion({
  toma,
  resultado,
  onReintentar,
  onConfirmar,
  onCerrar,
}: {
  toma: TomaMedicacion;
  resultado: ResultadoMedicacion;
  onReintentar: () => void;
  onConfirmar: (declaracion: "tomada" | "no_tomada") => void;
  onCerrar: () => void;
}) {
  if (resultado === "coincide") {
    return (
      <main className="px-5 py-7">
        <div className="rounded-3xl border border-verde/25 bg-verde-claro px-5 py-6">
          <p className="marca text-verde">Verificación de las {toma.horario_local ?? toma.hora_local}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            El envase coincide con su plan
          </h1>
          <p className="mt-3 leading-relaxed">
            El texto visible en la foto coincide con el medicamento indicado.
            La fotografía no demuestra por sí sola que lo tomó.
          </p>
        </div>

        <h2 className="mt-8 text-2xl font-bold">¿Tomó este medicamento?</h2>
        <div className="mt-4 space-y-3">
          <button type="button" onClick={() => onConfirmar("tomada")} className="boton-primario w-full">
            Sí, lo tomé
          </button>
          <button type="button" onClick={() => onConfirmar("no_tomada")} className="boton-secundario w-full">
            No lo tomé
          </button>
        </div>
        <button type="button" onClick={onCerrar} className="mt-8 text-primario-hondo underline underline-offset-4">
          Volver a la lista
        </button>
      </main>
    );
  }

  if (resultado === "no_coincide") {
    return (
      <main className="px-5 py-7">
        <div className="rounded-3xl border border-rojo/25 bg-rojo-claro px-5 py-6">
          <p className="marca text-rojo">Verificación de las {toma.horario_local ?? toma.hora_local}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            No coincide con lo indicado
          </h1>
          <p className="mt-3 leading-relaxed">
            El texto visible en la foto no coincide con el medicamento de su
            plan. Quedó marcado para revisión del equipo de salud y su persona
            de apoyo ya fue avisada.
          </p>
          <p className="mt-4 text-sm text-tinta-media">
            El sistema no le indica qué tomar. El equipo de salud la contactará
            o puede consultar en su centro de atención.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/ayuda" className="boton-secundario w-full text-center">
            Ver ayuda y contactos
          </Link>
          <button type="button" onClick={onCerrar} className="w-full text-primario-hondo underline underline-offset-4">
            Volver a la lista
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 py-7">
      <div className="rounded-3xl border border-ambar/30 bg-ambar-claro px-5 py-6">
        <p className="marca">Verificación de las {toma.horario_local ?? toma.hora_local}</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">
          No se pudo confirmar con esta foto
        </h1>
        <p className="mt-3 leading-relaxed">
          La foto quedó borrosa o no se alcanza a leer el nombre. Reintente con
          mejor luz y más cerca.
        </p>
      </div>
      <div className="mt-8 space-y-3">
        <button type="button" onClick={onReintentar} className="boton-primario w-full">
          Reintentar con otra foto
        </button>
        <button type="button" onClick={onCerrar} className="boton-secundario w-full">
          Dejar para después
        </button>
      </div>
    </main>
  );
}
