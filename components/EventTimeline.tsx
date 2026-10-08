// Línea de tiempo del histórico de sucesos (historial de la partida).
//
// Pinta `GET /lives/events`: cada entrada lleva la edad alcanzada, el badge
// del tipo de suceso (con su color), el enunciado, la opción elegida y sus
// deltas como chips +verde/-rosa. Siempre en **orden cronológico** (`seq`
// ascendente), con un punto por suceso y una línea conectora vertical.
//
// El endpoint es nuevo en el backend: si aún no está publicado o responde
// con error, no se rompe nada — el panel queda en su estado vacío y el
// juego sigue funcionando con el resto de operaciones.

import { useEffect, useRef } from "react";
import type { EventHistory, EventHistoryItem, EventType, Stats } from "@/lib/api";
import {
  CheckIcon,
  ClockIcon,
  HistoryIcon,
  TriangleAlertIcon,
} from "@/components/icons";
import { DeltaChips, hasDeltas } from "@/components/DeltaChips";

/** Estado de la carga del histórico, decidido en `app/page.tsx`. */
export type TimelineState = "loading" | "ready" | "error";

const TYPE_LABEL: Record<EventType, string> = {
  COTIDIANO: "Cotidiano",
  EDUCATIVO: "Educativo",
  LABORAL: "Laboral",
  RELACION: "Relaciones",
  SENTIMENTAL: "Sentimental",
};

/** `12 años` / `8 meses`: la edad cumplida al resolver ese período. */
function ageLabel(item: EventHistoryItem): string {
  if (item.age_years > 0) {
    return `${item.age_years} ${item.age_years === 1 ? "año" : "años"}`;
  }
  const months = item.age_months;
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

export function EventTimeline({
  history,
  state,
  onRetry,
}: {
  history: EventHistory | null;
  state: TimelineState;
  /** Recarga el histórico (se ofrece cuando el endpoint no respondió). */
  onRetry?: () => void;
}) {
  // Orden cronológico garantizado: el backend ya envía `seq` ascendente,
  // pero se reordena aquí por si acaso (no se confía en el orden externo).
  const events = [...(history?.events ?? [])].sort((a, b) => a.seq - b.seq);

  // El listado es la zona de scroll: cuando entra un suceso nuevo se salta
  // siempre al más reciente (el último, abajo) en vez de quedarse arriba.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <section
      className="panel timeline"
      aria-labelledby="timeline-heading"
      data-testid="timeline"
    >
      <div className="panel__head">
        <span className="panel__icon">
          <HistoryIcon />
        </span>
        <div>
          <h2 id="timeline-heading" className="panel__title">
            Historial
          </h2>
          <p className="panel__subtitle">
            {state === "ready"
              ? `${history?.count ?? events.length} ${
                  (history?.count ?? events.length) === 1 ? "suceso vivido" : "sucesos vividos"
                }`
              : "Tu vida, suceso a suceso"}
          </p>
        </div>
      </div>

      {state === "loading" ? (
        <p className="timeline__state" role="status">
          <span className="loader loader--inline" aria-hidden="true" />
          Cargando el historial…
        </p>
      ) : null}

      {state === "error" ? (
        <div className="timeline__state">
          <TriangleAlertIcon width={28} height={28} />
          <p className="timeline__state-title">Historial no disponible</p>
          <p>Todavía no se puede cargar el histórico de sucesos.</p>
          {onRetry ? (
            <button type="button" className="btn btn--ghost" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {state === "ready" && events.length === 0 ? (
        <div className="timeline__state">
          <ClockIcon width={28} height={28} />
          <p className="timeline__state-title">Aún no hay historia</p>
          <p>Avanza períodos y toma decisiones para ir llenando tu línea de tiempo.</p>
        </div>
      ) : null}

      {state === "ready" && events.length > 0 ? (
        <ol
          ref={listRef}
          className="timeline__list"
          aria-labelledby="timeline-heading"
          tabIndex={0}
        >
          {events.map((item) => (
            <li
              key={item.seq}
              className="timeline__item"
              data-type={item.type}
              data-fatal={item.fatal ? "true" : "false"}
              data-testid="timeline-entry"
            >
              <span className="timeline__dot" aria-hidden="true" />
              <div className="timeline__card">
                <div className="timeline__head">
                  <span className="timeline__age">
                    <ClockIcon width={16} height={16} className="timeline__age-icon" />
                    {ageLabel(item)}
                  </span>
                  <span className="badge" data-type={item.type}>
                    {TYPE_LABEL[item.type]}
                  </span>
                  {item.fatal ? (
                    <span className="badge badge--fatal">Opción mortal</span>
                  ) : null}
                  <span className="timeline__seq">#{item.seq}</span>
                </div>

                <p className="timeline__text">{item.text}</p>

                <p className="timeline__decision">
                  <CheckIcon width={16} height={16} className="timeline__decision-icon" />
                  <span>
                    Elegiste: <strong>{item.option_label}</strong>
                  </span>
                </p>

                {hasDeltas(item.deltas as Partial<Stats>) ? (
                  <div className="timeline__deltas">
                    <DeltaChips deltas={item.deltas as Partial<Stats>} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
