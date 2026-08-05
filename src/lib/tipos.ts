/**
 * Tipos del núcleo. Dos piezas separadas a propósito:
 *
 *  - EL BAÚL: lo que sabemos del paciente. Cada dato conserva de dónde salió.
 *  - LA MATRIZ: el conocimiento clínico. Es configuración, no lógica de programa.
 *
 * El motor de reglas (motor.ts) combina ambas y decide el color de alerta.
 * Claude nunca decide el color: solo extrae, estructura y explica.
 */

// ---------------------------------------------------------------------------
// Trazabilidad
// ---------------------------------------------------------------------------

export type Confianza = "alta" | "media" | "baja";

export type TipoDocumento =
  | "informe_alta"
  | "receta"
  | "protocolo_operatorio"
  | "examen"
  | "indicaciones_curacion"
  | "respuesta_paciente"
  | "guia_minsal"
  | "revision_profesional";

/**
 * Todo dato clínico que entra al baúl viaja con su procedencia.
 * Si no se puede decir de dónde salió, no entra.
 */
export interface CampoTrazable<T> {
  valor: T | null;
  /** Documento del que se extrajo. */
  origen: TipoDocumento;
  /** Texto literal tal como aparece en el documento. Nunca parafraseado. */
  textoOriginal: string;
  /** Página o sección del documento de origen, cuando aplica. */
  ubicacion?: string;
  confianza: Confianza;
  /** Falso hasta que el cuidador o el profesional lo confirma en pantalla. */
  confirmado: boolean;
  /** Si otro documento dice algo distinto, se describe aquí y NO se resuelve solo. */
  conflicto?: string;
}

// ---------------------------------------------------------------------------
// El baúl
// ---------------------------------------------------------------------------

export interface Medicamento {
  nombre: string;
  /** Dosis, frecuencia y duración las escribe el profesional. El sistema no calcula ni sugiere. */
  dosis: string;
  frecuencia: string;
  duracion: string;
  motivo?: string;
}

export interface DocumentoFuente {
  id: string;
  tipo: TipoDocumento;
  nombreArchivo: string;
  fechaDocumento?: string;
  fechaCarga: string;
}

export interface Baul {
  /** Identificador sintético. Nunca RUN ni nombre real. */
  pacienteId: string;
  /** Qué matriz clínica aplica a este paciente. */
  matrizId: string;
  fechaAlta: CampoTrazable<string>;
  medicamentos: CampoTrazable<Medicamento>[];
  indicacionesCuracion: CampoTrazable<string>;
  proximoControl: CampoTrazable<string>;
  alergias: CampoTrazable<string>[];
  documentos: DocumentoFuente[];
  /** Nombre/rol del profesional que revisó el baúl. Null = sin revisar. */
  revisadoPor: string | null;
  fechaRevision: string | null;
}

// ---------------------------------------------------------------------------
// La matriz clínica
// ---------------------------------------------------------------------------

export type Color = "verde" | "amarillo" | "rojo";

/**
 * Una fila sin fuente verificable queda `informacion_insuficiente`.
 * El motor la trata como ausente: no dispara alertas.
 */
export type EstadoFila = "vigente" | "informacion_insuficiente";

export interface Fuente {
  institucion: string;
  url: string;
  fechaConsulta: string;
  version?: string;
}

/** Punto del calendario de seguimiento, en días relativos al alta (D+n). */
export interface Hito {
  id: string;
  diaRelativo: number | null;
  titulo: string;
  descripcion: string;
  fuente: Fuente | null;
  estado: EstadoFila;
}

/**
 * Lo que el paciente probablemente va a sentir y es normal.
 * Es el corazón del producto: la mayoría de los días la app normaliza.
 */
export interface SintomaEsperado {
  id: string;
  ventanaDias: [number, number];
  descripcion: string;
  /** Texto en lenguaje simple que se le muestra al paciente cuando aplica. */
  mensajeNormalizador: string;
  fuente: Fuente | null;
  estado: EstadoFila;
}

export interface SenalAlarma {
  id: string;
  color: Exclude<Color, "verde">;
  descripcion: string;
  /** Qué debe hacer el paciente o cuidador. Sin diagnóstico. */
  accion: string;
  fuente: Fuente | null;
  estado: EstadoFila;
}

// --- Check-in diario -------------------------------------------------------

export type TipoPregunta = "escala" | "si_no" | "opciones";

export interface OpcionRespuesta {
  valor: string;
  etiqueta: string;
}

export interface PreguntaCheckin {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones: OpcionRespuesta[];
  /** Si se define, la pregunta solo aparece dentro de esta ventana de días. */
  ventanaDias?: [number, number];
}

/**
 * El puente entre una respuesta del paciente y una señal de alarma.
 * Determinística por diseño: misma respuesta, mismo color, siempre.
 */
export interface Regla {
  id: string;
  preguntaId: string;
  /** Valores de respuesta que activan la regla. */
  cuandoRespuestaEs: string[];
  senalAlarmaId: string;
  fuente: Fuente | null;
  estado: EstadoFila;
}

export interface Escalamiento {
  color: Exclude<Color, "verde">;
  responsable: string | null;
  tiempoRespuesta: string | null;
  fueraDeHorario: string | null;
  estado: EstadoFila;
}

export interface MatrizClinica {
  id: string;
  cirugia: string;
  cie10: string;
  poblacion: string;
  ventanaSeguimientoDias: number;
  validadoPor: string | null;
  fechaValidacion: string | null;
  hitos: Hito[];
  sintomasEsperados: SintomaEsperado[];
  senalesAlarma: SenalAlarma[];
  preguntas: PreguntaCheckin[];
  reglas: Regla[];
  escalamiento: Escalamiento[];
}

// ---------------------------------------------------------------------------
// Salida del motor
// ---------------------------------------------------------------------------

export type Respuestas = Record<string, string>;

export interface AlertaDisparada {
  reglaId: string;
  senal: SenalAlarma;
  preguntaTexto: string;
  respuestaDada: string;
}

/** Regla que NO se evaluó porque le falta fuente clínica. Se reporta, no se ignora. */
export interface ReglaBloqueada {
  reglaId: string;
  motivo: string;
}

export interface Evaluacion {
  diaRelativo: number;
  color: Color;
  alertas: AlertaDisparada[];
  /** Síntomas esperados aplicables hoy: el material para tranquilizar. */
  normalizaciones: SintomaEsperado[];
  /** Hitos que caen hoy o en los próximos días. */
  hitosProximos: Hito[];
  reglasBloqueadas: ReglaBloqueada[];
  escalamiento: Escalamiento | null;
}
