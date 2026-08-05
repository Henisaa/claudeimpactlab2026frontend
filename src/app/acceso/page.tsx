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
    titulo: "María G. — paciente",
    detalle: "Caso SYN-ETC-0001 · ve y pregunta sobre su propio baúl",
    destino: "/paciente",
  },
  {
    usuario: "cuidador@demo",
    titulo: "Carmen T. — cuidadora",
    detalle: "Autorizada por Elena T. (SYN-ETC-0007) · registra y consulta por ella",
    destino: "/cuidador",
  },
  {
    usuario: "profesional@demo",
    titulo: "E. Rojas — enfermera",
    detalle: "Hospital Ficticio del Valle · revisa alertas y cierra el circuito",
    destino: "/cuidador",
  },
] as const;

export default function Acceso() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSesion(sesionActual()), []);

  async function entrar(usuario: string, destino: string) {
    setCargando(usuario);
    setError(null);
    try {
      await ingresar(usuario, "demo1234");
      router.push(destino);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} — ¿está corriendo el backend en el puerto 4000?`
          : "No se pudo conectar con el backend.",
      );
      setCargando(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
      <Marca>Acceso · cuentas sintéticas de demostración</Marca>
      <h1 className="mt-5 font-titulo text-5xl font-semibold leading-[1.05]">
        ¿Quién entra?
      </h1>
      <p className="mt-6 max-w-prose text-lg leading-relaxed text-tinta-media">
        Cada rol ve exactamente lo que la persona autorizó: nada más. Todos los
        accesos quedan registrados en la auditoría.
      </p>

      {sesion && (
        <p className="mt-8 border-l-2 border-linea-fuerte pl-5 text-tinta-media">
          Sesión activa: <strong>{sesion.usuario.username}</strong> ·{" "}
          <button
            type="button"
            className="underline underline-offset-4 hover:text-tinta"
            onClick={() => {
              cerrarSesion();
              setSesion(null);
            }}
          >
            cerrar sesión
          </button>
        </p>
      )}

      {error && (
        <p role="alert" className="mt-8 border-l-4 border-rojo bg-rojo-claro px-6 py-5">
          {error}
        </p>
      )}

      <nav className="mt-12">
        {CUENTAS.map((c, i) => (
          <button
            key={c.usuario}
            type="button"
            disabled={cargando !== null}
            onClick={() => entrar(c.usuario, c.destino)}
            className="group flex w-full items-baseline gap-5 border-t border-linea py-7 text-left transition-colors last:border-b hover:bg-papel-hondo disabled:opacity-50 sm:gap-8"
          >
            <span className="marca cifra shrink-0 pt-2">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex-1">
              <span className="block font-titulo text-3xl font-semibold leading-tight">
                {c.titulo}
              </span>
              <span className="mt-1 block text-tinta-media">{c.detalle}</span>
            </span>
            <span
              aria-hidden
              className="shrink-0 self-center text-2xl text-tinta-tenue transition-transform group-hover:translate-x-1 group-hover:text-tinta"
            >
              {cargando === c.usuario ? "…" : "→"}
            </span>
          </button>
        ))}
      </nav>

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
