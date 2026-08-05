import type { MatrizClinica } from "@/lib/tipos";
import { Marca } from "./ui";

/**
 * La columna vertebral del producto: los 90 días desde el alta.
 *
 * Los hitos con día definido se marcan sobre el riel. Los que no lo tienen no
 * se inventan ni se esconden: bajan a una lista aparte, rotulada como pendiente
 * de validación. Esa asimetría visible es información honesta sobre el estado
 * real del proyecto.
 */
export function LineaTiempo({
  matriz,
  dia,
}: {
  matriz: MatrizClinica;
  dia: number;
}) {
  const total = matriz.ventanaSeguimientoDias;
  const hoy = Math.min(Math.max(dia, 0), total);
  const pct = (d: number) => `${(d / total) * 100}%`;

  /**
   * Cerca de los extremos, centrar la etiqueta la saca del riel. Se ancla al
   * borde en su lugar: legibilidad antes que simetría.
   */
  const anclaje = (d: number) => {
    const p = (d / total) * 100;
    if (p < 8) return "translate-x-0";
    if (p > 92) return "-translate-x-full";
    return "-translate-x-1/2";
  };

  const conFecha = matriz.hitos
    .filter((h) => h.diaRelativo !== null)
    .sort((a, b) => a.diaRelativo! - b.diaRelativo!);
  const sinFecha = matriz.hitos.filter((h) => h.diaRelativo === null);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-titulo text-3xl font-semibold">
          Día <span className="cifra">{dia}</span>
        </p>
        <Marca>Ventana de seguimiento · {total} días</Marca>
      </div>

      <div className="relative mt-8 h-px w-full bg-linea-fuerte">
        {/* Tramo recorrido */}
        <div
          className="absolute inset-y-0 left-0 bg-tinta"
          style={{ width: pct(hoy) }}
        />

        {/* Hitos con día definido */}
        {conFecha.map((hito) => (
          <div
            key={hito.id}
            className={`absolute ${anclaje(hito.diaRelativo!)}`}
            style={{ left: pct(hito.diaRelativo!), top: "-2.1rem" }}
          >
            <span className="block whitespace-nowrap text-xs font-semibold text-tinta">
              {hito.titulo}
            </span>
            <span className="mt-1 block h-4 w-px bg-linea-fuerte" />
          </div>
        ))}

        {/* Marcador de hoy */}
        <div
          className="absolute -translate-x-1/2"
          style={{ left: pct(hoy), top: "-0.3rem" }}
        >
          <span className="block size-[0.7rem] rotate-45 border-2 border-tinta bg-papel" />
        </div>

        {/* Reglas cada 30 días */}
        {[0, 30, 60, 90]
          .filter((d) => d <= total)
          .map((d) => (
            <div
              key={d}
              className={`absolute ${anclaje(d)}`}
              style={{ left: pct(d), top: "0.6rem" }}
            >
              <span className="marca cifra">D+{d}</span>
            </div>
          ))}
      </div>

      {sinFecha.length > 0 && (
        <div className="mt-14 border-t border-dashed border-linea-fuerte pt-4">
          <Marca>
            Sin fecha definida · {sinFecha.length} · pendiente de validación
            profesional
          </Marca>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
            {sinFecha.map((hito) => (
              <li
                key={hito.id}
                className="border border-dashed border-linea-fuerte px-3 py-1 text-sm text-tinta-media"
              >
                {hito.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
