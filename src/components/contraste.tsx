"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Interruptor de alto contraste (para baja visión).
 *
 * La preferencia vive en localStorage y se aplica como `data-contraste="alto"`
 * en <html>. Un script en el <head> (SCRIPT_CONTRASTE, en layout.tsx) la aplica
 * antes de pintar para que no haya parpadeo. Si el navegador bloquea el
 * almacenamiento, el modo simplemente no se recuerda.
 */
export const CLAVE_CONTRASTE = "contigo.contraste";

/** Se inyecta en el <head>: aplica la preferencia guardada antes del primer pintado. */
export const SCRIPT_CONTRASTE = `try{if(localStorage.getItem("${CLAVE_CONTRASTE}")==="alto")document.documentElement.dataset.contraste="alto"}catch(e){}`;

const oyentes = new Set<() => void>();

function leer(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_CONTRASTE) === "alto";
  } catch {
    return false;
  }
}

function suscribir(aviso: () => void) {
  oyentes.add(aviso);
  const alCambiarOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE_CONTRASTE) aviso();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(aviso);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

function guardar(alto: boolean) {
  try {
    if (alto) window.localStorage.setItem(CLAVE_CONTRASTE, "alto");
    else window.localStorage.removeItem(CLAVE_CONTRASTE);
  } catch {
    /* sin almacenamiento: vale solo para esta visita */
  }
  aplicar(alto);
  oyentes.forEach((aviso) => aviso());
}

function aplicar(alto: boolean) {
  if (alto) document.documentElement.dataset.contraste = "alto";
  else delete document.documentElement.dataset.contraste;
}

export function ContrasteToggle() {
  const alto = useSyncExternalStore(suscribir, leer, () => false);

  useEffect(() => {
    aplicar(alto);
  }, [alto]);

  return (
    <button
      type="button"
      onClick={() => guardar(!alto)}
      aria-pressed={alto}
      aria-label="Contraste alto"
      title={alto ? "Desactivar contraste alto" : "Activar contraste alto"}
      className={`grid size-12 place-items-center rounded-full border-2 ${
        alto
          ? "border-primario-hondo bg-primario-hondo text-white"
          : "border-borde-control bg-papel-alto text-tinta"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
      </svg>
    </button>
  );
}
