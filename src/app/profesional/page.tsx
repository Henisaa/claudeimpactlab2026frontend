"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Marca } from "@/components/ui";
import {
  agendarVisita,
  marcarVisita,
  obtenerAgenda,
  sesionActual,
  type PacienteAgenda,
} from "@/lib/api";

/**
 * Agenda de la enfermera particular.
 *
 * Su aporte al seguimiento es concreto y no lo decide el sistema: ella fija
 * el día en que va a la casa. El paciente y su persona de apoyo lo ven en su
 * propia pantalla y reciben el aviso, en vez de tener que llamar a preguntar.
 */
export default function AgendaProfesional() {
  const [pacientes, setPacientes] = useState<PacienteAgenda[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  async function cargar() {
    try {
      const datos = await obtenerAgenda();
      setPacientes(datos.pacientes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la agenda.");
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const sesion = typeof window === "undefined" ? null : sesionActual();

  if (sesion && sesion.usuario.tipo !== "profesional") {
    return (
      <main className="px-5 py-8">
        <Marca>Agenda</Marca>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Esta pantalla es de la enfermera
        </h1>
        <p className="mt-3 text-tinta-media">
          Entre con la cuenta de E. Rojas para ver y fijar las visitas.
        </p>
        <Link href="/acceso" className="boton-primario mt-6">
          Ir al acceso
        </Link>
      </main>
    );
  }

  return (
    <main className="px-5 py-7">
      <Marca>Enfermera particular · visitas a domicilio</Marca>
      <h1 className="mt-2 text-3xl font-bold leading-tight">Mi agenda</h1>
      <p className="mt-3 text-tinta-media">
        Fije el día en que irá a la casa. La persona y quien la acompaña lo
        ven de inmediato y reciben el aviso por WhatsApp.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4">
          {error}
        </p>
      )}

      {pacientes?.length === 0 && (
        <p className="mt-6 text-tinta-media">No hay pacientes asignados.</p>
      )}

      <ul className="mt-6 space-y-4">
        {pacientes?.map((p) => (
          <li key={p.id} className="tarjeta px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold leading-snug">{p.nombre_ficticio}</p>
                <p className="text-sm text-tinta-media">
                  {p.rango_edad} años · {p.comuna_ficticia}
                </p>
              </div>
              <span className="marca cifra shrink-0">{p.id}</span>
            </div>

            {p.visitas.length > 0 && (
              <ul className="mt-4 space-y-2">
                {p.visitas.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-papel-hondo px-4 py-3"
                  >
                    <span>
                      <span className="block font-semibold">
                        {v.fecha} · {v.hora}
                      </span>
                      {v.motivo && (
                        <span className="text-sm text-tinta-media">{v.motivo}</span>
                      )}
                    </span>
                    {v.estado === "programada" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await marcarVisita(v.id, "realizada");
                          void cargar();
                        }}
                        className="shrink-0 text-sm font-semibold text-primario-hondo underline underline-offset-4"
                      >
                        Marcar hecha
                      </button>
                    ) : (
                      <span className="shrink-0 text-sm font-bold text-verde">
                        {v.estado === "realizada" ? "Realizada ✓" : "Cancelada"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {abierto === p.id ? (
              <FormVisita
                pacienteId={p.id}
                onListo={() => {
                  setAbierto(null);
                  void cargar();
                }}
                onCancelar={() => setAbierto(null)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAbierto(p.id)}
                className="boton-primario mt-4 w-full"
              >
                Agendar visita
              </button>
            )}
          </li>
        ))}
      </ul>

      <footer className="mt-8">
        <Link href="/" className="text-primario-hondo underline underline-offset-4">
          ← Volver al inicio
        </Link>
      </footer>
    </main>
  );
}

function FormVisita({
  pacienteId,
  onListo,
  onCancelar,
}: {
  pacienteId: string;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(manana);
  const [hora, setHora] = useState("11:00");
  const [motivo, setMotivo] = useState("Control de herida");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await agendarVisita(pacienteId, { fecha, hora, motivo });
      onListo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar.");
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="mt-4 space-y-3 border-t border-linea pt-4">
      <label className="block">
        <span className="marca">Fecha</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde-control bg-papel-alto px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="marca">Hora</span>
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde-control bg-papel-alto px-4 py-3"
        />
      </label>
      <label className="block">
        <span className="marca">Motivo de la visita</span>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-borde-control bg-papel-alto px-4 py-3"
        />
      </label>

      {error && <p className="text-sm text-rojo">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className="boton-primario flex-1">
          {guardando ? "Agendando…" : "Confirmar visita"}
        </button>
        <button type="button" onClick={onCancelar} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </form>
  );
}
