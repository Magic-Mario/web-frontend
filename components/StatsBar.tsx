// Las cuatro stats básicas en escala 0–100 (T029 · FR-004).
//
// En v1 solo existen estas cuatro: salud, felicidad, inteligencia y aspecto.
// Todas nacen en 50 para todos (FR-010). Cada stat pinta icono SVG, etiqueta,
// valor numérico y una barra de progreso **coloreada por umbral**: verde a
// partir de 70, ámbar entre 40 y 69, rosa por debajo.
//
// `flash` es el delta recién aplicado (deriva natural al avanzar o decisión
// al elegir una opción): el valor lleva un chip breve +/- que aparece y se
// apaga, usando `flash.id` como `key` para que la animación se repita con
// cada suceso. Accesible: `role="progressbar"` con `aria-valuenow`.

import type { Stats } from "@/lib/api";
import { ActivityIcon, LightbulbIcon, SmileIcon, WandIcon } from "@/components/icons";

/** Delta recién aplicado + id incremental para reiniciar la animación. */
export interface StatFlash {
  deltas: Partial<Stats>;
  id: number;
}

const BARS: { key: keyof Stats; name: string; icon: React.ReactNode }[] = [
  { key: "health", name: "Salud", icon: <ActivityIcon /> },
  { key: "happiness", name: "Felicidad", icon: <SmileIcon /> },
  { key: "intelligence", name: "Inteligencia", icon: <LightbulbIcon /> },
  { key: "looks", name: "Aspecto", icon: <WandIcon /> },
];

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Umbral de color de la barra: alto / medio / bajo. */
const level = (value: number) => (value >= 70 ? "high" : value >= 40 ? "mid" : "low");

export function StatsBar({
  stats,
  flash = null,
}: {
  stats: Stats;
  flash?: StatFlash | null;
}) {
  return (
    <section className="stats-section" aria-labelledby="stats-heading">
      <h3 id="stats-heading" className="stats__title">
        Estadísticas
      </h3>
      <ul className="stats">
        {BARS.map(({ key, name, icon }) => {
          const value = clamp(stats[key]);
          const raw = flash?.deltas[key];
          // Sin cambio (o cambio a cero) no se pinta chip alguno.
          const change = typeof raw === "number" && raw !== 0 ? raw : null;

          return (
            <li
              key={key}
              className="stat"
              data-flash={change === null ? undefined : change > 0 ? "up" : "down"}
            >
              <span className="stat__icon" style={{ color: `var(--stat-${key})` }}>
                {icon}
              </span>
              <span className="stat__name">{name}</span>
              <span className="stat__value">
                <span data-testid={`stat-${key}`}>{value}/100</span>
                {change === null ? null : (
                  <span
                    key={`${flash?.id ?? 0}-${key}`}
                    className={`stat__flash ${
                      change > 0 ? "stat__flash--up" : "stat__flash--down"
                    } stat__flash--on`}
                    aria-hidden="true"
                  >
                    {change > 0 ? `+${change}` : change}
                  </span>
                )}
              </span>
              <span
                role="progressbar"
                aria-label={name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="stat__track"
              >
                <span
                  className="stat__fill"
                  data-level={level(value)}
                  style={{ width: `${value}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
