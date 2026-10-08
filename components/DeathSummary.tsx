"use client";

// Cierre de la partida (T064 · FR-005, SC-004).
//
// Sólo se pinta cuando la vida ha terminado y el backend ya tiene el
// resumen: edad alcanzada en años cumplidos, la causa de muerte traducida
// a español y el desglose por los tres sistemas que agrupa el backend —
// educación, trabajo y relaciones. `COTIDIANO` queda fuera de ese desglose,
// igual que en el servidor (T062).
//
// El botón «Empezar de nuevo» es la única salida de la pantalla: borra la
// partida con `DELETE /lives` y deja el formulario de nacimiento vacío.

import type { CauseOfDeath, LifeSummary, SystemDigest } from "@/lib/api";

const CAUSE_LABEL: Record<CauseOfDeath, string> = {
  HEALTH_ZERO: "Tu salud llegó a cero.",
  FATAL_OPTION: "Elegiste una opción que acabó con tu vida.",
  FATAL_RANDOM: "El azar se llevó por delante tu vida.",
};

const SYSTEMS: { key: keyof LifeSummary["by_system"]; name: string }[] = [
  { key: "education", name: "Educación" },
  { key: "work", name: "Trabajo" },
  { key: "relationships", name: "Relaciones" },
];

const muted: React.CSSProperties = { color: "#6b7280", fontSize: "0.9rem" };

/** `Viviste 25 años.` — con menos de un año cumplido no se redondea a 0. */
function ageLabel(ageReached: number): string {
  if (ageReached <= 0) return "Viviste menos de un año.";
  return `Viviste ${ageReached} ${ageReached === 1 ? "año" : "años"}.`;
}

/** `events` y `decisions` llegan opcionales en el contrato: se informan igual. */
function digestLine(digest: SystemDigest): string {
  const events = digest.events ?? 0;
  const decisions = digest.decisions ?? 0;
  return `${events} ${events === 1 ? "suceso" : "sucesos"} · ${decisions} ${
    decisions === 1 ? "decisión" : "decisiones"
  }`;
}

export function DeathSummary({
  summary,
  onRestart,
  busy = false,
}: {
  summary: LifeSummary;
  onRestart: () => void;
  busy?: boolean;
}) {
  return (
    <section aria-live="polite" data-testid="death-summary">
      <h2>Resumen de tu vida</h2>
      <p data-testid="age-reached">{ageLabel(summary.age_reached)}</p>
      <p data-testid="cause-of-death">{CAUSE_LABEL[summary.cause_of_death]}</p>

      {SYSTEMS.map(({ key, name }) => {
        const digest = summary.by_system[key];
        const highlights = digest.highlights ?? [];
        return (
          <div
            key={key}
            data-testid={`system-${key}`}
            style={{ marginBottom: "1rem" }}
          >
            <h3>{name}</h3>
            <p style={muted}>{digestLine(digest)}</p>
            {highlights.length === 0 ? (
              <p style={muted}>Nada que contar por aquí.</p>
            ) : (
              <ul style={{ listStyle: "none" }}>
                {highlights.map((highlight, index) => (
                  <li key={`${key}-${index}`}>{highlight}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <button
        type="button"
        data-testid="restart"
        disabled={busy}
        onClick={onRestart}
      >
        {busy ? "Reiniciando…" : "Empezar de nuevo"}
      </button>
    </section>
  );
}
