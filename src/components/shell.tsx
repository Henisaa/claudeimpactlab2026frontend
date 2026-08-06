"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { sesionActual, type Sesion } from "@/lib/api";

/**
 * El marco de la app de teléfono: contenido a un ancho de bolsillo, cabecera
 * con la identidad y la sesión, y barra de navegación inferior siempre a mano.
 *
 * En un computador se ve como un teléfono centrado; en un teléfono ocupa todo.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    setSesion(sesionActual());
  }, [pathname]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-papel sm:border-x sm:border-linea">
      <header className="sticky top-0 z-20 border-b border-linea bg-papel-alto/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Logo />
            <span className="text-lg font-bold tracking-tight text-tinta">
              Contigo
            </span>
          </Link>
          {sesion ? (
            <Link
              href="/acceso"
              className="max-w-[11rem] truncate rounded-full bg-primario-claro px-3.5 py-1.5 text-sm font-semibold text-primario-hondo no-underline"
            >
              {sesion.usuario.username}
            </Link>
          ) : (
            <Link
              href="/acceso"
              className="rounded-full border border-primario-borde px-3.5 py-1.5 text-sm font-semibold text-primario-hondo no-underline"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 pb-24">{children}</div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-papel-alto/95 backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-4">
          <Pestana
            href="/paciente"
            activo={pathname.startsWith("/paciente")}
            etiqueta="Hoy"
            icono={
              <path d="M9 21h6M12 3v1M5.6 5.6l.7.7M18.4 5.6l-.7.7M4 12H3m18 0h-1M7 17a5 5 0 1 1 10 0" />
            }
          />
          <Pestana
            href="/cuidador"
            activo={pathname.startsWith("/cuidador")}
            etiqueta="Baúl"
            icono={
              <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Zm0 0 2-4h12l2 4M10 12h4" />
            }
          />
          <Pestana
            href="/preguntar"
            activo={pathname.startsWith("/preguntar")}
            etiqueta="Preguntar"
            icono={
              <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5ZM9 12h.01M13 12h.01M17 12h.01" />
            }
          />
          <Pestana
            href="/ayuda"
            activo={pathname.startsWith("/ayuda")}
            etiqueta="Ayuda"
            tono="rojo"
            icono={
              <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10ZM8.5 11h2l1-2 1.5 4 1-2h1.5" />
            }
          />
        </div>
      </nav>
    </div>
  );
}

function Pestana({
  href,
  etiqueta,
  icono,
  activo,
  tono = "primario",
}: {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  activo: boolean;
  tono?: "primario" | "rojo";
}) {
  const color = activo
    ? tono === "rojo"
      ? "text-rojo"
      : "text-primario-hondo"
    : "text-tinta-tenue";
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 no-underline ${color}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icono}
      </svg>
      <span className="text-[0.7rem] font-semibold">{etiqueta}</span>
      <span
        aria-hidden
        className={`h-1 w-8 rounded-full ${
          activo ? (tono === "rojo" ? "bg-rojo" : "bg-primario") : "bg-transparent"
        }`}
      />
    </Link>
  );
}

function Logo() {
  return (
    <span className="grid size-9 place-items-center rounded-xl bg-primario">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20s-6.5-4.2-6.5-9a3.7 3.7 0 0 1 6.5-2.4A3.7 3.7 0 0 1 18.5 11c0 4.8-6.5 9-6.5 9Z" />
      </svg>
    </span>
  );
}
