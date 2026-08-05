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
    <p className="marca mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        aria-hidden
        className={`inline-block size-2 rounded-[1px] ${TONO_CONFIANZA[confianza]}`}
      />
      <span>{ETIQUETA_ORIGEN[origen] ?? origen}</span>
      <span className="text-linea-fuerte">/</span>
      <span>lectura {confianza}</span>
      <span className="text-linea-fuerte">/</span>
      <span className={confirmado ? "" : "text-ambar"}>
        {confirmado ? "confirmado" : "sin confirmar"}
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
    <div className="border-t border-linea py-5">
      <Marca>{etiqueta}</Marca>
      <p
        className={`mt-2 font-titulo text-2xl leading-snug ${
          campo.valor && !campo.confirmado ? "sin-confirmar" : ""
        }`}
      >
        {campo.valor ?? (
          <span className="text-tinta-tenue italic">{vacio}</span>
        )}
      </p>
      {campo.textoOriginal && (
        <p className="mt-2 font-titulo text-base italic text-tinta-media">
          «{campo.textoOriginal}»
        </p>
      )}
      <Sello
        origen={campo.origen}
        confianza={campo.confianza}
        confirmado={campo.confirmado}
      />
      {campo.conflicto && (
        <p className="mt-3 border-l-2 border-ambar bg-ambar-claro px-4 py-2 text-sm">
          {campo.conflicto}
        </p>
      )}
    </div>
  );
}

/** Encabezado de sección con regla y numeral. */
export function Seccion({
  numero,
  titulo,
  descripcion,
  children,
}: {
  numero: string;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="flex items-baseline gap-4 border-b-2 border-tinta pb-2">
        <span className="marca cifra text-tinta">{numero}</span>
        <h2 className="font-titulo text-2xl font-semibold">{titulo}</h2>
      </div>
      {descripcion && (
        <p className="mt-3 max-w-prose text-tinta-media">{descripcion}</p>
      )}
      {children}
    </section>
  );
}
