import type { MatrizClinica } from "@/lib/tipos";
import { Marca } from "./ui";

/**
 * La columna vertebral del producto: los 90 días desde el alta.
 *
 * En pantalla de teléfono el riel horizontal no cabe; se muestra una barra de
 * avance compacta y los hitos como lista vertical. Los hitos sin día definido
 * no se inventan ni se esconden: bajan a una lista aparte, rotulada como
 * pendiente de validación profesional. Esa asimetría visible es información
 * honesta sobre el estado real del proyecto.
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

  const conFecha = matriz.hitos
    .filter((h) => h.diaRelativo !== null)
    .sort((a, b) => a.diaRelativo! - b.diaRelativo!);
  const sinFecha = matriz.hitos.filter((h) => h.diaRelativo === null);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold">
          Día <span className="cifra">{dia}</span>
          <span className="text-base font-semibold text-tinta-tenue"> de {total}</span>
        </p>
        <Marca>Su recuperación</Marca>
      </div>

      {/* Barra de avance */}
      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-papel-hondo"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hoy}
        aria-label={`Día ${hoy} de ${total} de recuperación`}
      >
        <div
          className="h-full rounded-full bg-primario"
          style={{ width: `${(hoy / total) * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        {[0, 30, 60, 90]
          .filter((d) => d <= total)
          .map((d) => (
            <span key={d} className="marca cifra">
              D+{d}
            </span>
          ))}
      </div>

      {/* Hitos con día definido */}
      {conFecha.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {conFecha.map((hito) => {
            const pasado = hito.diaRelativo! <= hoy;
            return (
              <li key={hito.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`grid size-2.5 shrink-0 place-items-center rounded-full ${
                    pasado ? "bg-primario" : "border-2 border-borde-control bg-papel-alto"
                  }`}
                />
                <span
                  className={`cifra w-12 shrink-0 text-sm font-bold ${
                    pasado ? "text-primario-hondo" : "text-tinta-tenue"
                  }`}
                >
                  D+{hito.diaRelativo}
                </span>
                <span className={`text-sm ${pasado ? "text-tinta" : "text-tinta-media"}`}>
                  {hito.titulo}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {sinFecha.length > 0 && (
        <div className="mt-5 border-t border-dashed border-linea-fuerte pt-3.5">
          <Marca>
            Sin fecha definida · {sinFecha.length} · pendiente de validación
            profesional
          </Marca>
          <ul className="mt-2.5 flex flex-wrap gap-x-2 gap-y-2">
            {sinFecha.map((hito) => (
              <li
                key={hito.id}
                className="rounded-full border border-dashed border-linea-fuerte px-3 py-1 text-sm text-tinta-media"
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
