"use client";

// Perfil de la vida en curso con su única interacción de avance
// (T058 · FR-002, FR-004, FR-011, FR-012).
//
// FR-012: **no existe menú de acciones**. Toda la partida se juega con dos
// interacciones: pulsar «Avanzar» y elegir una opción del evento. Aquí vive
// la primera, junto a la edad, la granularidad vigente (que no cambia desde
// el nacimiento, FR-002) y las cuatro stats (FR-004).
//
// El evento no se dibuja aquí: entra por `children`, que `app/page.tsx`
// coloca justo encima del botón para que el orden de lectura sea
// edad → stats → suceso → decisión → avanzar.

import { StatsBar } from "@/components/StatsBar";
import type { Life, Stats } from "@/lib/api";

const STAT_LABEL: Record<keyof Stats, string> = {
  health: "Salud",
  happiness: "Felicidad",
  intelligence: "Inteligencia",
  looks: "Aspecto",
};

const GRANULARITY_LABEL: Record<Life["granularity"], string> = {
  YEAR: "anual",
  MONTH: "mensual",
};

const errorStyle: React.CSSProperties = { color: "#b91c1c" };

/** `0 años y 3 meses` / `12 años y 5 meses`: edad legible con ambas unidades. */
function ageLabel(ageMonths: number): string {
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months > 0 || parts.length === 0) {
    parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  }
  return parts.join(" y ");
}

/** `Salud -1 · Felicidad +2`, omitiendo las stats que no se movieron. */
function derivedLabel(derived: Partial<Stats>): string {
  return (Object.keys(STAT_LABEL) as (keyof Stats)[])
    .filter((key) => typeof derived[key] === "number" && derived[key] !== 0)
    .map((key) => {
      const value = derived[key] as number;
      return `${STAT_LABEL[key]} ${value > 0 ? "+" : ""}${value}`;
    })
    .join(" · ");
}

export function LifeView({
  life,
  derived,
  onAdvance,
  pending = false,
  busy = false,
  children,
}: {
  life: Life;
  derived?: Partial<Stats> | null;
  onAdvance: () => void;
  /** Hay un evento sin decidir: no se puede avanzar otra vez (el backend responde `409`). */
  pending?: boolean;
  /** Hay una petición en vuelo: evita el doble clic sobre «Avanzar». */
  busy?: boolean;
  children?: React.ReactNode;
}) {
  const alive = life.status === "ALIVE";
  const drift = derived ? derivedLabel(derived) : "";

  return (
    <section aria-live="polite" data-testid="life">
      <h2>
        {ageLabel(life.age_months)} · {life.city} ({life.country})
      </h2>
      <p data-testid="profile">
        Nacido/a en {life.birth_year} · {life.current_year} · avance{" "}
        {GRANULARITY_LABEL[life.granularity]}
      </p>

      <StatsBar stats={life.stats} />

      {children}

      {drift ? (
        <p data-testid="derived" style={{ fontSize: "0.9rem" }}>
          Este período: {drift}
        </p>
      ) : null}

      {alive ? (
        <button
          type="button"
          data-testid="advance"
          disabled={pending || busy}
          onClick={onAdvance}
        >
          Avanzar
        </button>
      ) : (
        <p role="alert" data-testid="dead" style={errorStyle}>
          Tu historia ha terminado.
        </p>
      )}
    </section>
  );
}
