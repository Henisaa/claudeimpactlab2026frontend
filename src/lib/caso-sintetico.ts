/**
 * Caso sintético de prueba. Persona ficticia, datos ficticios.
 *
 * Sirve para ejercitar el motor sin depender de la extracción ni de la API.
 * Los casos restantes (confusión con tromboprofilaxis, alteración de herida,
 * sangrado, no contacto, derivación urgente) se agregan aquí con su desenlace
 * esperado, para poder medir falsas alarmas contra un resultado conocido.
 */

import type { Baul } from "./tipos";

function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const CASO_RECUPERACION_ESPERADA: Baul = {
  pacienteId: "SINT-001",
  matrizId: "ETC-v0",
  fechaAlta: {
    valor: diasAtras(6),
    origen: "informe_alta",
    textoOriginal: "Fecha de alta: (sintética)",
    confianza: "alta",
    confirmado: true,
  },
  medicamentos: [
    {
      valor: {
        nombre: "Analgésico indicado al alta",
        dosis: "según receta",
        frecuencia: "según receta",
        duracion: "según receta",
        motivo: "Manejo del dolor postoperatorio",
      },
      origen: "receta",
      textoOriginal: "(receta sintética — dosis no inventadas)",
      confianza: "alta",
      confirmado: true,
    },
    {
      valor: {
        nombre: "Tromboprofilaxis indicada al alta",
        dosis: "según receta",
        frecuencia: "según receta",
        duracion: "según receta",
        motivo: "Profilaxis tromboembólica",
      },
      origen: "receta",
      textoOriginal: "(receta sintética — dosis no inventadas)",
      confianza: "media",
      confirmado: false,
    },
  ],
  indicacionesCuracion: {
    valor: "Mantener la herida limpia y seca. Curación según indicación del centro.",
    origen: "indicaciones_curacion",
    textoOriginal: "(documento sintético)",
    confianza: "alta",
    confirmado: true,
  },
  proximoControl: {
    valor: null,
    origen: "informe_alta",
    textoOriginal: "",
    confianza: "baja",
    confirmado: false,
    conflicto: "El documento sintético no consigna fecha de control.",
  },
  alergias: [],
  documentos: [
    {
      id: "doc-1",
      tipo: "informe_alta",
      nombreArchivo: "informe_alta_sintetico.jpg",
      fechaCarga: diasAtras(6),
    },
    {
      id: "doc-2",
      tipo: "receta",
      nombreArchivo: "receta_sintetica.jpg",
      fechaCarga: diasAtras(6),
    },
  ],
  revisadoPor: null,
  fechaRevision: null,
};
