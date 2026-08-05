/**
 * Motor de reglas. Determinístico y sin llamadas al modelo.
 *
 * Invariante del proyecto: el nivel de alerta lo decide este archivo,
 * a partir de la matriz clínica validada. Claude no participa.
 *
 * Consecuencias buscadas:
 *  - La misma entrada produce siempre la misma alerta (auditable).
 *  - Ninguna alerta puede aparecer sin una fuente clínica detrás.
 *  - El check-in diario cuesta cero tokens.
 */

import type {
  AlertaDisparada,
  Color,
  Escalamiento,
  Evaluacion,
  Hito,
  MatrizClinica,
  PreguntaCheckin,
  ReglaBloqueada,
  Respuestas,
  SintomaEsperado,
} from "./tipos";

/** Días transcurridos desde el alta. D+0 es el día del alta. */
export function diaRelativo(fechaAlta: string, hoy: Date = new Date()): number {
  const alta = new Date(`${fechaAlta}T00:00:00`);
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const ms = dia.getTime() - alta.getTime();
  return Math.floor(ms / 86_400_000);
}

function dentroDeVentana(dia: number, ventana: [number, number]): boolean {
  return dia >= ventana[0] && dia <= ventana[1];
}

/**
 * Preguntas que corresponden al día. Se mantienen pocas a propósito:
 * el usuario es una persona mayor respondiendo todos los días.
 */
export function preguntasDelDia(
  matriz: MatrizClinica,
  dia: number,
): PreguntaCheckin[] {
  return matriz.preguntas.filter(
    (p) => !p.ventanaDias || dentroDeVentana(dia, p.ventanaDias),
  );
}

const PRIORIDAD: Record<Color, number> = { verde: 0, amarillo: 1, rojo: 2 };

/**
 * Evalúa un check-in.
 *
 * Una regla solo se evalúa si ella y su señal están vigentes y con fuente.
 * Lo que no cumple eso se devuelve en `reglasBloqueadas` para que quede
 * visible en pantalla, en vez de desaparecer en silencio.
 */
export function evaluar(
  matriz: MatrizClinica,
  respuestas: Respuestas,
  dia: number,
): Evaluacion {
  const alertas: AlertaDisparada[] = [];
  const reglasBloqueadas: ReglaBloqueada[] = [];

  for (const regla of matriz.reglas) {
    const senal = matriz.senalesAlarma.find((s) => s.id === regla.senalAlarmaId);

    if (!senal) {
      reglasBloqueadas.push({
        reglaId: regla.id,
        motivo: `La señal de alarma "${regla.senalAlarmaId}" no existe en la matriz.`,
      });
      continue;
    }
    if (regla.estado !== "vigente" || !regla.fuente) {
      reglasBloqueadas.push({
        reglaId: regla.id,
        motivo: "La regla no tiene fuente clínica verificada.",
      });
      continue;
    }
    if (senal.estado !== "vigente" || !senal.fuente) {
      reglasBloqueadas.push({
        reglaId: regla.id,
        motivo: `La señal "${senal.id}" no tiene fuente clínica verificada.`,
      });
      continue;
    }

    const respuesta = respuestas[regla.preguntaId];
    if (respuesta === undefined) continue;
    if (!regla.cuandoRespuestaEs.includes(respuesta)) continue;

    const pregunta = matriz.preguntas.find((p) => p.id === regla.preguntaId);
    alertas.push({
      reglaId: regla.id,
      senal,
      preguntaTexto: pregunta?.texto ?? regla.preguntaId,
      respuestaDada:
        pregunta?.opciones.find((o) => o.valor === respuesta)?.etiqueta ??
        respuesta,
    });
  }

  const color = alertas.reduce<Color>(
    (peor, a) => (PRIORIDAD[a.senal.color] > PRIORIDAD[peor] ? a.senal.color : peor),
    "verde",
  );

  const escalamiento =
    color === "verde"
      ? null
      : (matriz.escalamiento.find((e) => e.color === color) ?? null);

  return {
    diaRelativo: dia,
    color,
    alertas,
    normalizaciones: normalizacionesDelDia(matriz, dia),
    hitosProximos: hitosProximos(matriz, dia),
    reglasBloqueadas,
    escalamiento,
  };
}

/**
 * Los síntomas esperados para hoy. Es lo que la app muestra la mayoría de los
 * días: "esto que sientes es lo normal en el día 7".
 */
export function normalizacionesDelDia(
  matriz: MatrizClinica,
  dia: number,
): SintomaEsperado[] {
  return matriz.sintomasEsperados.filter(
    (s) => s.estado === "vigente" && s.fuente && dentroDeVentana(dia, s.ventanaDias),
  );
}

/** Hitos de hoy y de los próximos días, para el timeline y los recordatorios. */
export function hitosProximos(
  matriz: MatrizClinica,
  dia: number,
  horizonte = 7,
): Hito[] {
  return matriz.hitos
    .filter((h) => h.diaRelativo !== null)
    .filter((h) => h.diaRelativo! >= dia && h.diaRelativo! <= dia + horizonte)
    .sort((a, b) => a.diaRelativo! - b.diaRelativo!);
}

/**
 * Estado de completitud de la matriz. Alimenta el panel del profesional:
 * qué falta validar antes de que el sistema pueda alertar de verdad.
 */
export function huecosDeLaMatriz(matriz: MatrizClinica): string[] {
  const huecos: string[] = [];

  if (!matriz.validadoPor) {
    huecos.push("La matriz completa está pendiente de validación profesional.");
  }
  for (const h of matriz.hitos) {
    if (h.estado !== "vigente" || h.diaRelativo === null || !h.fuente) {
      huecos.push(`Hito sin fuente o sin día definido: ${h.titulo}`);
    }
  }
  for (const s of matriz.senalesAlarma) {
    if (s.estado !== "vigente" || !s.fuente) {
      huecos.push(`Señal de alarma sin fuente verificada: ${s.descripcion}`);
    }
  }
  for (const e of matriz.escalamiento) {
    if (e.estado !== "vigente" || !e.responsable) {
      huecos.push(`Escalamiento ${e.color} sin responsable definido.`);
    }
  }
  return huecos;
}
