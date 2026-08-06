/**
 * Cliente del backend (claudeimpactlab2026backend, Express + SQLite).
 *
 * La sesión vive en localStorage. Si no hay sesión o el backend no está
 * levantado, las pantallas siguen funcionando contra el caso sintético local:
 * el backend agrega persistencia, no reemplaza la demo sin conexión.
 */

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface Sesion {
  token: string;
  usuario: {
    id: string;
    username: string;
    tipo: "paciente" | "cuidador" | "profesional" | "admin";
    pacienteId: string | null;
    cuidadorId: string | null;
    profesionalId: string | null;
  };
  /** Paciente sobre el que trabaja esta sesión (propio o acompañado). */
  pacienteActivo: string | null;
}

const CLAVE_SESION = "etc.sesion";

export function sesionActual(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION);
    return crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  window.localStorage.removeItem(CLAVE_SESION);
}

async function pedir<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const sesion = sesionActual();
  const respuesta = await fetch(`${BASE}/api/v1${ruta}`, {
    ...opciones,
    headers: {
      ...(opciones.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}),
      ...opciones.headers,
    },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(
      (datos as { error?: string }).error ?? `Error ${respuesta.status}`,
    );
  }
  return datos as T;
}

// --- Autenticación ----------------------------------------------------------

export async function ingresar(username: string, password: string): Promise<Sesion> {
  const datos = await pedir<Omit<Sesion, "pacienteActivo">>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  let pacienteActivo = datos.usuario.pacienteId;
  const sesionBase = { ...datos, pacienteActivo };
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionBase));
  // Cuidador y profesional: el backend resuelve qué pacientes pueden ver.
  if (!pacienteActivo) {
    try {
      const { alertas } = await pedir<{ alertas: { paciente_id: string }[] }>("/alertas");
      pacienteActivo = alertas[0]?.paciente_id ?? null;
    } catch {
      /* sin pacientes visibles */
    }
  }
  if (datos.usuario.tipo === "cuidador" && !pacienteActivo) {
    pacienteActivo = "SYN-ETC-0007"; // caso demo del cuidador
  }
  const sesion = { ...datos, pacienteActivo };
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion;
}

// --- Baúl y RAG -------------------------------------------------------------

export function obtenerBaul(pacienteId: string) {
  return pedir<Record<string, unknown>>(`/pacientes/${pacienteId}/baul`);
}

export interface RespuestaBaul {
  respuesta: string;
  informacion_insuficiente: boolean;
  requiere_revision_profesional: boolean;
  fragmentos: {
    n: number;
    tipo: string;
    fuente: string;
    seccion: string | null;
    url: string | null;
  }[];
}

export function preguntarAlBaul(pacienteId: string, pregunta: string) {
  return pedir<RespuestaBaul>(`/pacientes/${pacienteId}/preguntar`, {
    method: "POST",
    body: JSON.stringify({ pregunta }),
  });
}

// --- Documentos -------------------------------------------------------------

export function subirDocumento(pacienteId: string, archivos: File[]) {
  const cuerpo = new FormData();
  for (const a of archivos) cuerpo.append("imagenes", a);
  return pedir<{ documentoId: string; borrador: unknown }>(
    `/pacientes/${pacienteId}/documentos`,
    { method: "POST", body: cuerpo },
  );
}

export function confirmarDocumento(documentoId: string) {
  return pedir<{ ok: boolean; camposConfirmados: number }>(
    `/documentos/${documentoId}/confirmar`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

// --- Check-in ---------------------------------------------------------------

export function registrarCheckin(
  pacienteId: string,
  respuestas: Record<string, string>,
) {
  return pedir<{ seguimientoId: string; evaluacion: unknown; notificaciones: string[] }>(
    `/pacientes/${pacienteId}/checkins`,
    { method: "POST", body: JSON.stringify({ respuestas }) },
  );
}

// --- Avisos a la persona de apoyo (canal WhatsApp) --------------------------

export interface Aviso {
  id: string;
  canal: string;
  destinatario_tipo: string;
  evento: string;
  estado: "pendiente" | "enviada" | "fallida" | "cancelada";
  ultimo_error: string | null;
  creada_en: string;
  enviada_en: string | null;
  mensaje: string | null;
}

export function verAvisos(pacienteId: string) {
  return pedir<{ proveedor: string; notificaciones: Aviso[] }>(
    `/pacientes/${pacienteId}/notificaciones`,
  );
}

export function procesarAvisos(pacienteId: string) {
  return pedir<{ enviadas: number; canceladas: number; fallidas: number }>(
    `/pacientes/${pacienteId}/notificaciones/procesar`,
    { method: "POST", body: JSON.stringify({}) },
  );
}
