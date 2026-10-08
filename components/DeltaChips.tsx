// Chips de deltas (+verde / -rosa) compartidos por el EventCard y por la
// línea de tiempo del historial: cada stat movida se pinta con su etiqueta
// en español y el signo correspondiente.

import type { Stats } from "@/lib/api";

export const STAT_LABEL: Record<keyof Stats, string> = {
  health: "Salud",
  happiness: "Felicidad",
  intelligence: "Inteligencia",
  looks: "Aspecto",
};

/** `true` si el objeto trae algún cambio distinto de cero. */
export function hasDeltas(deltas: Partial<Stats> | null | undefined): boolean {
  if (!deltas) return false;
  return (Object.keys(STAT_LABEL) as (keyof Stats)[]).some(
    (key) => typeof deltas[key] === "number" && deltas[key] !== 0,
  );
}

/** Pinta una fila de chips; sin cambios no pinta nada. */
export function DeltaChips({ deltas }: { deltas: Partial<Stats> }) {
  const entries = (Object.keys(STAT_LABEL) as (keyof Stats)[])
    .filter((key) => typeof deltas[key] === "number" && deltas[key] !== 0)
    .map((key) => ({ key, value: deltas[key] as number }));

  if (entries.length === 0) return null;

  return (
    <span className="chips">
      {entries.map(({ key, value }) => (
        <span key={key} className={`chip ${value > 0 ? "chip--pos" : "chip--neg"}`}>
          {STAT_LABEL[key]} {value > 0 ? `+${value}` : value}
        </span>
      ))}
    </span>
  );
}
