// Las cuatro stats básicas en escala 0–100 (T029 · FR-004).
//
// En v1 solo existen estas cuatro: salud, felicidad, inteligencia y aspecto.
// Todas nacen en 50 para todos (FR-010).

import type { Stats } from "@/lib/api";

const BARS: { key: keyof Stats; name: string; color: string }[] = [
  { key: "health", name: "Salud", color: "#16a34a" },
  { key: "happiness", name: "Felicidad", color: "#f59e0b" },
  { key: "intelligence", name: "Inteligencia", color: "#2563eb" },
  { key: "looks", name: "Aspecto", color: "#db2777" },
];

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <section>
      <h2>Estadísticas</h2>
      <ul style={{ listStyle: "none" }}>
        {BARS.map(({ key, name, color }) => {
          const value = clamp(stats[key]);
          return (
            <li key={key} style={{ marginBottom: "0.6rem" }}>
              <span style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{name}</span>
                <span data-testid={`stat-${key}`}>{value}/100</span>
              </span>
              <span
                role="progressbar"
                aria-label={name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                style={{
                  display: "block",
                  height: 10,
                  borderRadius: 5,
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{ display: "block", width: `${value}%`, height: "100%", background: color }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
