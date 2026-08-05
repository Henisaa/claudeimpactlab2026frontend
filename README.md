# Seguimiento postoperatorio — Claude Impact Lab 2026, Línea 03

App de continuidad de cuidados después del alta hospitalaria, orientada a
personas mayores y a quien las acompaña.

La investigación, las fuentes MINSAL/DEIS y las decisiones de alcance viven en
el vault de Obsidian del proyecto (`claudeimpactlab2026obsidian`). Este repo es
la implementación.

## La decisión de arquitectura que manda sobre todo

> **La alerta no la decide un modelo de lenguaje. La decide un motor de reglas
> determinístico sobre una matriz clínica validada por un profesional.**

```
FOTOS / PDF ──► [Claude visión]  ──►  EL BAÚL
                 extrae y cita        (cada dato con su procedencia)
                       │                      │
                       │              ┌───────┴────────┐
              nada entra sin          │  MOTOR         │◄── MATRIZ CLÍNICA
              confirmación humana     │ (determinista, │    (configuración
                                      │  sin modelo)   │     versionada,
                                      └───────┬────────┘     fuente por fila)
CHECK-IN DIARIO ─────────────────────────────►│
                                              ▼
                                      🟢 / 🟡 / 🔴  +  línea de tiempo
                                              │
                                    [Claude: lenguaje simple]
                                     explica, normaliza, responde
```

Esto da tres cosas a la vez: seguridad (se cumplen los descalificadores del
evento), reproducibilidad (la misma entrada da siempre la misma alerta) y costo
mínimo (el check-in diario no gasta tokens).

### Qué hace Claude

Leer papeles arrugados y mal iluminados, estructurarlos conservando la cita
literal, marcar lo que falta y lo que se contradice, y traducir a lenguaje
simple.

### Qué NO hace Claude

Decidir si algo es urgente, calcular o sugerir dosis, inventar fechas de
control, resolver contradicciones entre documentos.

## La regla de la fuente

Una fila de la matriz clínica solo puede quedar `vigente` si su `fuente` apunta
a un documento oficial verificado que respalde exactamente lo que la fila
afirma. Todo lo demás queda `informacion_insuficiente`, y el motor lo trata como
ausente: **no dispara alertas**.

Esto no es un detalle de implementación, es la propiedad que hace al sistema
honesto. Hoy `MATRIZ_ETC` tiene la mayoría de sus señales de alarma bloqueadas
esperando la validación profesional, y la app lo muestra en pantalla en vez de
esconderlo (`huecosDeLaMatriz()` en el panel del cuidador).

## Estructura

```
src/lib/tipos.ts          Baúl con trazabilidad por campo + matriz clínica
src/lib/motor.ts          Motor de reglas. Puro, determinístico, sin modelo.
src/lib/matriz-etc.ts     Matriz ETC v0 — CONFIGURACIÓN, no lógica
src/lib/caso-sintetico.ts Caso ficticio para probar el motor sin API
src/app/api/extraer/      Extracción con Claude visión (guardrails en el system prompt)
src/app/paciente/         Check-in diario: una pregunta a la vez, letra grande
src/app/cuidador/         Panel del baúl + estado de la matriz
src/app/cuidador/captura/ Foto → extracción → borrador editable
```

El motor no sabe qué cirugía está tratando. Para agregar cataratas o hernia se
escribe otra matriz; el motor no cambia.

## Correr

```bash
npm install
cp .env.example .env.local   # y agregar la ANTHROPIC_API_KEY
npm run dev
```

La API key solo hace falta para `/cuidador/captura`. El check-in y el panel
funcionan sin ella, contra el caso sintético.

## Reglas del proyecto (no negociables)

- Solo datos sintéticos. Cero PII de pacientes reales.
- Toda afirmación clínica con fuente verificable, o marcada como insuficiente.
- Sin diagnóstico ni indicación médica autónoma.
- El profesional de salud permanece en el circuito de decisión.

## Backend

El repo `claudeimpactlab2026backend` expone la API en el puerto 4000:
persistencia del baúl, roles (cuentas demo en `/acceso`, clave `demo1234`),
consentimiento, auditoría y el RAG "Pregúntale al baúl" (`/preguntar`), que
responde citando los documentos confirmados del paciente y el corpus oficial
MINSAL. Con sesión iniciada, la captura guarda y confirma contra el backend y
el check-in queda documentado en `seguimientos`; sin backend, todo sigue
funcionando contra el caso sintético local.

La matriz clínica se exporta al backend con `node scripts/exportar-matriz.ts`
(la fuente de verdad sigue siendo `src/lib/matriz-etc.ts`).

## Pendiente

1. Validación profesional: preguntas P1–P5 de `Tarea_01_Seleccion_Cirugia.txt`.
   P3 (calendario real de controles) y P4 (señales de alarma y escalamiento)
   son las que desbloquean las filas de la matriz.
2. Pantalla de consentimiento en el frontend (el backend ya lo exige por API).
3. Panel del cuidador leyendo el baúl persistente del backend (hoy muestra el
   caso local; captura, chat y check-in ya son persistentes).
4. Módulo pasivo de wearable (tendencia de movilidad). Roadmap declarado, fuera
   del camino de alertas por decisión explícita.
