/**
 * Extracción de documentación médica fotografiada.
 *
 * Aquí es donde Claude aporta valor irremplazable: leer papeles arrugados,
 * mal iluminados y torcidos, y estructurarlos conservando el texto original.
 *
 * Lo que este endpoint NO hace, por diseño:
 *   - decidir si algo es urgente (eso es motor.ts)
 *   - calcular, completar o sugerir dosis
 *   - resolver contradicciones entre documentos (las marca y las deja abiertas)
 *
 * La salida es un BORRADOR. Nada entra al baúl sin que una persona lo confirme.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODELO = "claude-opus-5";

const SYSTEM_PROMPT = `Eres el extractor de documentación postoperatoria del proyecto de continuidad de cuidados.
Tu única función es leer documentos médicos fotografiados o escaneados y estructurar lo que dicen.

Reglas que no puedes romper:

1. Transcribe, no interpretes. Para cada campo, "texto_original" debe ser la cita literal
   del documento, tal como está escrita. Si el documento abrevia, tú abrevias igual.
2. Nunca completes un dato que no esté en el documento. Si no aparece, el campo va en null
   y lo declaras en "datos_faltantes". No infieras una dosis, una fecha ni una frecuencia.
3. Las dosis, frecuencias y duraciones las escribió un profesional. Cópialas exactamente.
   No las conviertas de unidades, no las corrijas, no las completes aunque parezcan incompletas.
4. Si dos partes del documento se contradicen, describe el conflicto en "conflictos" y deja
   ambos valores. No elijas cuál es el correcto.
5. Marca "confianza" según lo que realmente puedas leer: "alta" si el texto es nítido e
   inequívoco, "media" si tuviste que interpretar caligrafía o el texto está parcialmente
   cortado, "baja" si estás adivinando. Prefiere declarar baja confianza antes que acertar.
6. Si detectas datos que parecen ser de una persona real (RUN, nombre completo, teléfono,
   dirección), no los transcribas: ponlos como null y anótalo en "advertencias". Este sistema
   trabaja únicamente con documentos sintéticos.
7. No emitas diagnósticos, no evalúes gravedad y no sugieras conductas. Otra parte del
   sistema decide eso a partir de una matriz clínica validada por un profesional.`;

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "tipo_documento",
    "fecha_alta",
    "medicamentos",
    "indicaciones_curacion",
    "proximo_control",
    "alergias",
    "datos_faltantes",
    "conflictos",
    "advertencias",
  ],
  properties: {
    tipo_documento: {
      type: "string",
      enum: [
        "informe_alta",
        "receta",
        "protocolo_operatorio",
        "examen",
        "indicaciones_curacion",
        "desconocido",
      ],
    },
    fecha_alta: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["valor", "texto_original", "confianza"],
      properties: {
        valor: { type: ["string", "null"], description: "AAAA-MM-DD si es inequívoco" },
        texto_original: { type: "string" },
        confianza: { type: "string", enum: ["alta", "media", "baja"] },
      },
    },
    medicamentos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "nombre",
          "dosis",
          "frecuencia",
          "duracion",
          "texto_original",
          "confianza",
        ],
        properties: {
          nombre: { type: "string" },
          dosis: { type: ["string", "null"] },
          frecuencia: { type: ["string", "null"] },
          duracion: { type: ["string", "null"] },
          texto_original: {
            type: "string",
            description: "La línea completa de la receta, tal cual",
          },
          confianza: { type: "string", enum: ["alta", "media", "baja"] },
        },
      },
    },
    indicaciones_curacion: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["valor", "texto_original", "confianza"],
      properties: {
        valor: { type: ["string", "null"] },
        texto_original: { type: "string" },
        confianza: { type: "string", enum: ["alta", "media", "baja"] },
      },
    },
    proximo_control: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["valor", "texto_original", "confianza"],
      properties: {
        valor: { type: ["string", "null"] },
        texto_original: { type: "string" },
        confianza: { type: "string", enum: ["alta", "media", "baja"] },
      },
    },
    alergias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["valor", "texto_original", "confianza"],
        properties: {
          valor: { type: "string" },
          texto_original: { type: "string" },
          confianza: { type: "string", enum: ["alta", "media", "baja"] },
        },
      },
    },
    datos_faltantes: {
      type: "array",
      items: { type: "string" },
      description: "Campos esperables que el documento no contiene",
    },
    conflictos: {
      type: "array",
      items: { type: "string" },
      description: "Contradicciones detectadas, sin resolver",
    },
    advertencias: {
      type: "array",
      items: { type: "string" },
      description: "Posibles datos personales reales u otros problemas",
    },
  },
} as const;

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const TIPOS_ACEPTADOS: MediaType[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Falta ANTHROPIC_API_KEY. Copia .env.example a .env.local y agrega la clave.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const archivos = formData.getAll("imagenes").filter((f): f is File => f instanceof File);

  if (archivos.length === 0) {
    return NextResponse.json(
      { error: "No se recibió ninguna imagen." },
      { status: 400 },
    );
  }

  const bloques = [];
  for (const archivo of archivos) {
    if (!TIPOS_ACEPTADOS.includes(archivo.type as MediaType)) {
      return NextResponse.json(
        { error: `Formato no aceptado: ${archivo.type || "desconocido"}` },
        { status: 400 },
      );
    }
    const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
    bloques.push({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: archivo.type as MediaType,
        data: base64,
      },
    });
  }

  const client = new Anthropic();

  try {
    const respuesta = await client.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: ESQUEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            ...bloques,
            {
              type: "text",
              text: "Extrae la información de estos documentos siguiendo tus reglas. Recuerda: cita literal en texto_original, null donde el documento no diga nada.",
            },
          ],
        },
      ],
    });

    if (respuesta.stop_reason === "refusal") {
      return NextResponse.json(
        {
          error:
            "El modelo declinó procesar estas imágenes. Verifica que sean documentos sintéticos del proyecto.",
        },
        { status: 422 },
      );
    }

    const texto = respuesta.content.find((b) => b.type === "text");
    if (!texto || texto.type !== "text") {
      return NextResponse.json(
        { error: "El modelo no devolvió contenido estructurado." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      borrador: JSON.parse(texto.text),
      uso: {
        tokensEntrada: respuesta.usage.input_tokens,
        tokensSalida: respuesta.usage.output_tokens,
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Límite de peticiones alcanzado. Reintenta en unos segundos." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "La ANTHROPIC_API_KEY no es válida." },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Error de la API (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    throw error;
  }
}
