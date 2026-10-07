"use client";

// Enunciado del evento con sus opciones (T057 · FR-003, FR-004, FR-005a).
//
// En español, con el `year` y el `source` que trae el backend (WIKIPEDIA o
// SEED cuando hubo que recurrir al catálogo de reserva) y **todas** las
// opciones del evento: la mortal se señala expresamente, como pide FR-005a.
//
// Los `deltas` no viajan en el contrato (data-model §2): no se adelanta qué
// cambia cada opción. Sólo se pide la decisión.

import type {
  EventSource,
  EventType,
  PresentedEvent,
} from "@/lib/api";

const TYPE_LABEL: Record<EventType, string> = {
  COTIDIANO: "Cotidiano",
  EDUCATIVO: "Educativo",
  LABORAL: "Laboral",
  RELACION: "Relaciones",
  SENTIMENTAL: "Sentimental",
};

const SOURCE_LABEL: Record<EventSource, string> = {
  WIKIPEDIA: "Sucesos reales de la época · Wikipedia",
  SEED: "Sucesos reales de la época · catálogo local",
};

const meta: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  fontSize: "0.85rem",
  color: "#6b7280",
  marginBottom: "0.75rem",
};

const fatalTag: React.CSSProperties = {
  color: "#b91c1c",
  fontWeight: 700,
  marginLeft: "0.5rem",
};

export function EventCard({
  event,
  onSelect,
  busy = false,
}: {
  event: PresentedEvent;
  onSelect: (optionId: string) => void;
  busy?: boolean;
}) {
  // `year` y `source` son opcionales en el contrato: si no vienen, no se
  // inventan, pero el evento sigue siendo visible y jugable.
  const source = event.source ? SOURCE_LABEL[event.source] : null;

  return (
    <section aria-live="polite" data-testid="event">
      <h2>{TYPE_LABEL[event.type]}</h2>
      <p style={meta}>
        {event.year ? (
          <span data-testid="event-year">{event.year}</span>
        ) : null}
        {source ? <span data-testid="event-source">{source}</span> : null}
      </p>
      <p style={{ marginBottom: "1rem" }}>{event.text}</p>

      <ul style={{ listStyle: "none" }}>
        {event.options.map((option) => (
          <li key={option.id} style={{ marginBottom: "0.5rem" }}>
            <button
              type="button"
              data-testid="event-option"
              disabled={busy}
              onClick={() => onSelect(option.id)}
              style={{ width: "100%", textAlign: "left" }}
            >
              {option.label}
              {option.fatal ? (
                <strong data-testid="event-option-fatal" style={fatalTag}>
                  ⚠ Opción mortal
                </strong>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
