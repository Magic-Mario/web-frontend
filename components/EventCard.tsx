// Enunciado del evento con sus opciones (T057 · FR-003, FR-004, FR-005a).
//
// En español, con el `year` y el `source` que trae el backend (WIKIPEDIA o
// SEED cuando hubo que recurrir al catálogo de reserva) y **todas** las
// opciones del evento: la mortal se señala con un aviso (icono SVG, nunca
// emojis), como pide FR-005a.
//
// Los `deltas` de cada opción no viajan en el contrato (data-model §2): no se
// adelanta qué cambia. Lo que sí se muestra es `periodDeltas`, la deriva
// natural del período que acaba de aplicar `POST /lives/advance`
// (`AdvanceResponse.derived`), para que el jugador la vea junto al suceso.

import type { EventSource, EventType, PresentedEvent, Stats } from "@/lib/api";
import {
  HeartIcon,
  HomeIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "@/components/icons";
import { DeltaChips, hasDeltas } from "@/components/DeltaChips";

const TYPE_LABEL: Record<EventType, string> = {
  MAIN: "Del año",
  DAILY: "Día a día",
  RELATIONSHIPS: "Relaciones",
};

const TYPE_ICON: Record<EventType, React.ReactNode> = {
  MAIN: <SparklesIcon />,
  DAILY: <HomeIcon />,
  RELATIONSHIPS: <HeartIcon />,
};

const SOURCE_LABEL: Record<EventSource, string> = {
  WIKIPEDIA: "Sucesos reales de la época · Wikipedia",
  SEED: "Sucesos reales de la época · catálogo local",
};

export function EventCard({
  event,
  onSelect,
  periodDeltas = null,
  busy = false,
}: {
  event: PresentedEvent;
  onSelect: (optionId: string) => void;
  /** Deriva natural del período (`AdvanceResponse.derived`), si la hubo. */
  periodDeltas?: Partial<Stats> | null;
  busy?: boolean;
}) {
  // `year` y `source` son opcionales en el contrato: si no vienen, no se
  // inventan, pero el evento sigue siendo visible y jugable.
  const source = event.source ? SOURCE_LABEL[event.source] : null;
  const showPeriodDeltas = hasDeltas(periodDeltas);

  return (
    <section className="panel event" aria-live="polite" data-testid="event">
      <div className="panel__head">
        <span className="panel__icon" data-testid="event-icon">
          {TYPE_ICON[event.type]}
        </span>
        <div>
          <span className="badge" data-type={event.type}>
            {TYPE_LABEL[event.type]}
          </span>
          <p className="panel__subtitle" style={{ marginTop: 4 }}>
            {event.year ? <span data-testid="event-year">{event.year} · </span> : null}
            {source ? <span data-testid="event-source">{source}</span> : "Suceso de tu vida"}
          </p>
        </div>
      </div>

      <p className="event__text" data-testid="event-text">
        {event.text}
      </p>

      {showPeriodDeltas ? (
        <p className="event__deltas" data-testid="derived">
          <span className="event__deltas-label">Este período</span>
          <DeltaChips deltas={periodDeltas as Partial<Stats>} />
        </p>
      ) : null}

      <ul className="options">
        {event.options.map((option, index) => (
          <li key={option.id}>
            <button
              type="button"
              data-testid="event-option"
              disabled={busy}
              className={`option${option.fatal ? " option--fatal" : ""}`}
              onClick={() => onSelect(option.id)}
            >
              <span className="option__key" aria-hidden="true">
                {index + 1}
              </span>
              <span className="option__label">{option.label}</span>
              {option.fatal ? (
                <span className="option__fatal" data-testid="event-option-fatal">
                  <TriangleAlertIcon width={16} height={16} />
                  Opción mortal
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
