"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Marca } from "@/components/ui";
import { cerrarSesion, ingresar, sesionActual, type Sesion } from "@/lib/api";

/**
 * Acceso por roles contra el backend. Las tres cuentas demo vienen del seed
 * (clave demo1234). Cada rol ve solo lo que la matriz de permisos le da:
 * el paciente su expediente, el cuidador el de quien lo autorizó, el
 * profesional los de su establecimiento.
 */

const CUENTAS = [
  {
    usuario: "paciente@demo",
    titulo: "María G.",
    rol: "Paciente",
    detalle: "Ve y pregunta sobre su propio baúl",
    inicial: "M",
    destino: "/paciente",
  },
  {
    usuario: "cuidador@demo",
    titulo: "Carmen T.",
    rol: "Persona de apoyo",
    detalle: "Autorizada por Elena T. — registra y consulta por ella",
    inicial: "C",
    destino: "/cuidador",
  },
  {
    usuario: "profesional@demo",
    titulo: "E. Rojas",
    rol: "Enfermera particular",
    detalle: "Agenda las visitas a domicilio y revisa cómo va la recuperación",
    inicial: "E",
    destino: "/profesional",
  },
] as const;

export default function Acceso() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSesion(sesionActual());
  }, []);

  async function entrar(usuario: string, destino: string) {
    setCargando(usuario);
    setError(null);
    try {
      await ingresar(usuario, "demo1234");
      router.push(destino);
    } catch (e) {
      // En local casi siempre es el backend apagado; publicado, casi siempre
      // es configuración. El mensaje no debería mandar a mirar el puerto 4000
      // a alguien que está en el sitio publicado.
      const enLocal =
        typeof window !== "undefined" &&
        ["localhost", "127.0.0.1"].includes(window.location.hostname);
      setError(
        e instanceof Error
          ? enLocal
            ? `${e.message} — ¿está corriendo el backend en el puerto 4000?`
            : e.message
          : "No se pudo conectar con el servidor.",
      );
      setCargando(null);
    }
  }

  return (
    <main className="px-5 py-8">
      <Marca>Cuentas sintéticas de demostración</Marca>
      <h1 className="mt-2 text-3xl font-bold leading-tight">¿Quién entra?</h1>
      <p className="mt-3 text-tinta-media">
        Cada rol ve exactamente lo que la persona autorizó: nada más. Todos
        los accesos quedan registrados.
      </p>

      {sesion && (
        <div className="tarjeta mt-6 flex items-center justify-between gap-3 px-5 py-3.5">
          <p className="truncate text-sm text-tinta-media">
            Sesión activa: <strong className="text-tinta">{sesion.usuario.username}</strong>
          </p>
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-primario-hondo underline underline-offset-4"
            onClick={() => {
              cerrarSesion();
              setSesion(null);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-rojo/25 bg-rojo-claro px-5 py-4">
          {error}
        </p>
      )}

      <nav className="mt-7 space-y-3">
        {CUENTAS.map((c) => (
          <button
            key={c.usuario}
            type="button"
            disabled={cargando !== null}
            onClick={() => entrar(c.usuario, c.destino)}
            className="tarjeta flex w-full items-center gap-4 px-5 py-4 text-left transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primario-claro text-xl font-bold text-primario-hondo">
              {c.inicial}
            </span>
            <span className="flex-1">
              <span className="block text-xl font-bold leading-snug">
                {c.titulo}
                <span className="ml-2 rounded-full bg-papel-hondo px-2.5 py-0.5 align-middle text-sm font-semibold text-tinta-media">
                  {c.rol}
                </span>
              </span>
              <span className="mt-0.5 block text-sm text-tinta-media">{c.detalle}</span>
            </span>
            <span aria-hidden className="text-xl text-tinta-tenue">
              {cargando === c.usuario ? "…" : "›"}
            </span>
          </button>
        ))}
      </nav>

      <footer className="mt-8">
        <Link href="/" className="text-primario-hondo underline underline-offset-4">
          ← Volver al inicio
        </Link>
      </footer>
    </main>
  );
}
