import type { ReactNode } from "react";

import type { CampoTrazable, Confianza } from "@/lib/tipos";

/** Etiqueta versalita para metadatos. El recurso tipográfico base de la app. */
export function Marca({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`marca ${className}`}>{children}</p>;
}

const ETIQUETA_ORIGEN: Record<string, string> = {
  informe_alta: "Informe de alta",
  receta: "Receta",
  protocolo_operatorio: "Protocolo operatorio",
  examen: "Examen",
  indicaciones_curacion: "Indicaciones de curación",
  respuesta_paciente: "Reportado por el paciente",
  guia_minsal: "Guía MINSAL",
  revision_profesional: "Revisión profesional",
};

const TONO_CONFIANZA: Record<Confianza, string> = {
  alta: "bg-verde",
  media: "bg-ambar",
  baja: "bg-rojo",
};

/**
 * El sello de procedencia. Cada dato del baúl lo lleva.
 *
 * Es la tesis del producto hecha visible: nada aparece en pantalla sin decir
 * de dónde salió y con cuánta certeza se leyó.
 */
export function Sello({
  origen,
  confianza,
  confirmado,
}: {
  origen: string;
  confianza: Confianza;
  confirmado: boolean;
}) {
  return (
    <p className="marca mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        aria-hidden
        className={`inline-block size-2 rounded-full ${TONO_CONFIANZA[confianza]}`}
      />
      <span>{ETIQUETA_ORIGEN[origen] ?? origen}</span>
      <span className="text-linea-fuerte">·</span>
      <span>lectura {confianza}</span>
      <span className="text-linea-fuerte">·</span>
      <span className={confirmado ? "text-verde" : "text-ambar"}>
        {confirmado ? "confirmado ✓" : "sin confirmar"}
      </span>
    </p>
  );
}

/** Ficha de un dato del baúl, con su valor y su procedencia. */
export function CampoFicha({
  etiqueta,
  campo,
  vacio = "No aparece en el documento",
}: {
  etiqueta: string;
  campo: CampoTrazable<string>;
  vacio?: string;
}) {
  return (
    <div className="border-t border-linea py-4 first:border-t-0 first:pt-0">
      <Marca>{etiqueta}</Marca>
      <p
        className={`mt-1.5 text-lg font-semibold leading-snug ${
          campo.valor && !campo.confirmado ? "sin-confirmar" : ""
        }`}
      >
        {campo.valor ?? (
          <span className="font-normal italic text-tinta-tenue">{vacio}</span>
        )}
      </p>
      {campo.textoOriginal && (
        <p className="mt-1.5 text-sm italic text-tinta-media">
          «{campo.textoOriginal}»
        </p>
      )}
      <Sello
        origen={campo.origen}
        confianza={campo.confianza}
        confirmado={campo.confirmado}
      />
      {campo.conflicto && (
        <p className="mt-2.5 rounded-xl bg-ambar-claro px-4 py-2.5 text-sm">
          {campo.conflicto}
        </p>
      )}
    </div>
  );
}

/** Encabezado de sección; el contenido va dentro de una tarjeta. */
export function Seccion({
  numero,
  titulo,
  descripcion,
  children,
}: {
  numero?: string;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  void numero;
  return (
    <section className="mt-9">
      <h2 className="text-2xl font-bold leading-tight">{titulo}</h2>
      {descripcion && (
        <p className="mt-1.5 text-sm text-tinta-media">{descripcion}</p>
      )}
      {children}
    </section>
  );
}
