// HUD de la vida en curso (T058 · FR-002, FR-004, FR-011, FR-012).
//
// FR-012: **no existe menú de acciones de juego**. Toda la partida se juega
// con dos interacciones: pulsar «Avanzar» y elegir una opción del evento.
// Aquí vive la primera, junto a la cabecera (nombre y lugar, edad actual y
// estado), la granularidad vigente (que no cambia desde el nacimiento,
// FR-002), las cuatro stats (FR-004) y las personas cercanas.
//
// «Nueva partida» no es una acción de juego sino un **control de sesión** (y
// pide confirmación): borra la partida con `DELETE /lives` y devuelve al
// jugador al formulario con una identidad nueva, para poder probar varias
// vidas seguidas.
//
// El suceso pendiente se dibuja con `EventCard` cuando existe; si no lo hay
// se ofrece el botón «Avanzar». `pending_event` de `GET /lives` garantiza
// que al recargar no se pierda un suceso a medio decidir (SC-006): ese
// suceso llega como `event` y bloquea el avance mientras no se decida.

import { EventCard } from "@/components/EventCard";
import { PeopleList } from "@/components/PeopleList";
import { StatsBar } from "@/components/StatsBar";
import type { StatFlash } from "@/components/StatsBar";
import {
  CalendarIcon,
  ChevronsRightIcon,
  ClockIcon,
  HeartPulseIcon,
  MapPinIcon,
  RotateCcwIcon,
  SkullIcon,
  UserIcon,
} from "@/components/icons";
import type { Life, PersonaCercana, PresentedEvent, Stats } from "@/lib/api";

const GENDER_LABEL: Record<Life["gender"], string> = {
  MALE: "Hombre",
  FEMALE: "Mujer",
};

const GRANULARITY_LABEL: Record<Life["granularity"], string> = {
  YEAR: "anual",
  MONTH: "mensual",
};

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

export function LifeView({
  life,
  countryName,
  characterName,
  event = null,
  periodDeltas = null,
  flash = null,
  onAdvance,
  onDecide,
  onRestart,
  busy = false,
  people,
}: {
  life: Life;
  /** Nombre del país traducido (del catálogo de nacimiento), si se conoce. */
  countryName?: string;
  /** Nombre local del personaje (no viaja al backend, ver `characterName.ts`). */
  characterName?: string;
  /** Suceso pendiente de decisión; llega de `pending_event` al recargar. */
  event?: PresentedEvent | null;
  /** Deriva natural del período, para enseñarla junto al suceso. */
  periodDeltas?: Partial<Stats> | null;
  /** Delta recién aplicado, para el flash sobre las stats. */
  flash?: StatFlash | null;
  onAdvance: () => void;
  onDecide: (optionId: string) => void;
  /** Borra la partida (DELETE /lives) y vuelve al formulario de nacimiento. */
  onRestart: () => void;
  /** Hay una petición en vuelo: evita el doble clic. */
  busy?: boolean;
  people: PersonaCercana[];
}) {
  const alive = life.status === "ALIVE";
  const place = countryName ? `${life.city} (${countryName})` : `${life.city} (${life.country})`;

  // Acción destructiva (borra la partida en el servidor): se confirma antes
  // de mandar al jugador al formulario con una identidad nueva.
  const handleNewGame = () => {
    if (busy) return;
    const ok = window.confirm(
      "¿Borrar esta partida y volver al inicio? Se eliminará todo el progreso y podrás crear un personaje nuevo.",
    );
    if (ok) onRestart();
  };

  return (
    <div className="stack" aria-live="polite" data-testid="life">
      {/* --- cabecera del HUD + stats ------------------------------------ */}
      <section className="panel">
        <div className="hud__head">
          <div>
            <p className="hud__name">
              <UserIcon width={16} height={16} />
              {characterName ? characterName : "Personaje"} · {GENDER_LABEL[life.gender]}
            </p>
            <h2 className="hud__age" data-testid="age">
              {ageLabel(life.age_months)}
            </h2>
            <p className="hud__meta" data-testid="profile">
              <span className="hud__meta-item">
                <MapPinIcon width={16} height={16} />
                {place}
              </span>
              <span className="hud__meta-item">
                <CalendarIcon width={16} height={16} />
                {life.birth_year} → {life.current_year}
              </span>
              <span className="hud__meta-item">
                <ClockIcon width={16} height={16} />
                Avance {GRANULARITY_LABEL[life.granularity]}
              </span>
            </p>
          </div>

          <div className="hud__head-side">
            <span className="hud__status" data-status={life.status}>
              {alive ? (
                <HeartPulseIcon width={18} height={18} />
              ) : (
                <SkullIcon width={18} height={18} />
              )}
              {alive ? "Vivo/a" : "Finado/a"}
            </span>

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              data-testid="new-game"
              disabled={busy}
              onClick={handleNewGame}
            >
              <RotateCcwIcon width={16} height={16} className="btn__icon" />
              Nueva partida
            </button>
          </div>
        </div>

        <StatsBar stats={life.stats} flash={flash} />
      </section>

      {/* --- suceso pendiente o botón de avance --------------------------- */}
      {event ? (
        <EventCard
          event={event}
          periodDeltas={periodDeltas}
          onSelect={onDecide}
          busy={busy}
        />
      ) : alive ? (
        <div className="advance-box">
          <p className="advance-box__hint">
            Toca «Avanzar» para vivir el siguiente período de tu vida.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            data-testid="advance"
            disabled={busy}
            onClick={onAdvance}
          >
            <ChevronsRightIcon width={22} height={22} className="btn__icon" />
            {busy ? "Avanzando…" : "Avanzar"}
          </button>
        </div>
      ) : (
        <p className="alert alert--error" role="alert" data-testid="dead">
          Tu historia ha terminado.
        </p>
      )}

      <PeopleList people={people} />
    </div>
  );
}
