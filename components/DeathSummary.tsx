// Cierre de la partida (T064 · FR-005, SC-004).
//
// Sólo se pinta cuando la vida ha terminado y el backend ya tiene el
// resumen: edad alcanzada en años cumplidos, la causa de muerte traducida a
// español, el desglose por los tres sistemas que agrupa el backend —
// educación, trabajo y relaciones — y **la línea de tiempo completa** con
// todos los sucesos vividos. `COTIDIANO` queda fuera de ese desglose, igual
// que en el servidor (T062).
//
// El botón «Empezar de nuevo» es la única salida de la pantalla: borra la
// partida con `DELETE /lives`, limpia la identidad anónima y el nombre del
// personaje, y deja el formulario de nacimiento vacío (SC-004).

import { EventTimeline } from "@/components/EventTimeline";
import type { TimelineState } from "@/components/EventTimeline";
import {
  BriefcaseIcon,
  GraduationCapIcon,
  RotateCcwIcon,
  SkullIcon,
  UsersIcon,
} from "@/components/icons";
import type { CauseOfDeath, EventHistory, LifeSummary, SystemDigest } from "@/lib/api";

const CAUSE_LABEL: Record<CauseOfDeath, string> = {
  HEALTH_ZERO: "Tu salud llegó a cero.",
  FATAL_OPTION: "Elegiste una opción que acabó con tu vida.",
  FATAL_RANDOM: "El azar se llevó por delante tu vida.",
};

const SYSTEMS: {
  key: keyof LifeSummary["by_system"];
  name: string;
  icon: React.ReactNode;
}[] = [
  { key: "education", name: "Educación", icon: <GraduationCapIcon width={18} height={18} /> },
  { key: "work", name: "Trabajo", icon: <BriefcaseIcon width={18} height={18} /> },
  { key: "relationships", name: "Relaciones", icon: <UsersIcon width={18} height={18} /> },
];

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
  history = null,
  historyState = "ready",
  onRestart,
  onRetryHistory,
  busy = false,
}: {
  summary: LifeSummary;
  /** Histórico completo de sucesos de la vida terminada. */
  history?: EventHistory | null;
  historyState?: TimelineState;
  onRestart: () => void;
  onRetryHistory?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="stack" aria-live="polite" data-testid="death-summary">
      <section className="panel death">
        <span className="death__icon">
          <SkullIcon width={32} height={32} />
        </span>
        <h2 className="death__title">Fin de tu historia</h2>
        <p className="death__age" data-testid="age-reached">
          {ageLabel(summary.age_reached)}
        </p>
        <p className="death__cause" data-testid="cause-of-death">
          {CAUSE_LABEL[summary.cause_of_death]}
        </p>

        <div className="systems">
          {SYSTEMS.map(({ key, name, icon }) => {
            const digest = summary.by_system[key];
            const highlights = digest.highlights ?? [];
            return (
              <div key={key} className="system" data-testid={`system-${key}`}>
                <p className="system__head">
                  <span className="system__icon">{icon}</span>
                  {name}
                </p>
                <p className="system__count">{digestLine(digest)}</p>
                {highlights.length === 0 ? (
                  <p className="system__count">Nada que contar por aquí.</p>
                ) : (
                  <ul className="system__highlights">
                    {highlights.map((highlight, index) => (
                      <li key={`${key}-${index}`}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="form-actions" style={{ marginTop: "var(--space-5)" }}>
          <button
            type="button"
            className="btn btn--accent btn--lg btn--block"
            data-testid="restart"
            disabled={busy}
            onClick={onRestart}
          >
            <RotateCcwIcon width={20} height={20} className="btn__icon" />
            {busy ? "Reiniciando…" : "Empezar de nuevo"}
          </button>
        </div>
      </section>

      {/* Línea de tiempo completa: la vida entera, suceso a suceso. */}
      <EventTimeline history={history} state={historyState} onRetry={onRetryHistory} />
    </div>
  );
}
