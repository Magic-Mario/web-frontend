"use client";

// Portada del juego (T032 + T059): **la interfaz principal pasa a ser el
// juego** (FR-009, SC-009).
//
// - Sin vida → formulario de nacimiento (con el catálogo de FR-001).
// - Con vida → `LifeView` con edad, granularidad vigente, stats y personas,
//   y `EventCard` cuando toca decidir. Son **las dos únicas interacciones**
//   de la partida: avanzar y elegir opción, sin menú de acciones (FR-012).
// - Al recargar se retoma la partida tal cual quedó, incluido un suceso
//   pendiente de decisión que el backend devuelve en `GET /lives`
//   (FR-008, SC-006).

import { useCallback, useEffect, useState } from "react";

import { BirthForm } from "@/components/BirthForm";
import { EventCard } from "@/components/EventCard";
import { LifeView } from "@/components/LifeView";
import { PeopleList } from "@/components/PeopleList";
import {
  ApiError,
  advanceLife,
  createLife,
  getBirthCatalog,
  getLife,
  submitDecision,
} from "@/lib/api";
import type { BirthCountry, CreateLifeInput, Life, PresentedEvent, Stats } from "@/lib/api";

type Phase = "loading" | "birth" | "life";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [life, setLife] = useState<Life | null>(null);
  const [event, setEvent] = useState<PresentedEvent | null>(null);
  const [derived, setDerived] = useState<Partial<Stats> | null>(null);
  const [countries, setCountries] = useState<BirthCountry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Carga la vida y, con ella, el suceso que estuviera sin decidir. */
  const adoptLife = useCallback((next: Life) => {
    setLife(next);
    setEvent(next.pending_event ?? null);
    setDerived(null);
    setPhase("life");
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await getLife();
        if (!cancelled) adoptLife(existing);
      } catch (err) {
        if (cancelled) return;
        // 404 = todavía no hay partida: se ofrece el formulario de nacimiento.
        if (err instanceof ApiError && err.status === 404) setPhase("birth");
        else {
          setError("No se pudo recuperar tu partida.");
          setPhase("birth");
        }
      }

      try {
        const catalog = await getBirthCatalog();
        if (!cancelled) setCountries(catalog.countries);
      } catch {
        if (!cancelled) setError("No se pudo cargar el catálogo de nacimiento.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adoptLife]);

  const handleCreate = useCallback(
    async (input: CreateLifeInput) => {
      setBusy(true);
      setError(null);
      try {
        adoptLife(await createLife(input));
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Una partida por jugador en v1 (FR-008): la retomamos.
          try {
            adoptLife(await getLife());
            return;
          } catch {
            // cae al mensaje de abajo
          }
        }
        setError(err instanceof ApiError ? err.detail : "No se pudo crear la vida.");
      } finally {
        setBusy(false);
      }
    },
    [adoptLife],
  );

  const handleAdvance = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await advanceLife();
      setLife(outcome.life);
      setEvent(outcome.event);
      setDerived(outcome.derived ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo avanzar.");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDecide = useCallback(async (optionId: string) => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await submitDecision(optionId);
      setLife(outcome.life);
      setEvent(null);
      setDerived(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "No se pudo registrar la decisión.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  if (phase === "loading") {
    return (
      <main style={main}>
        <h1>Simulador de vida</h1>
        <p>Cargando…</p>
      </main>
    );
  }

  if (phase === "birth") {
    return (
      <main style={main}>
        <h1>Simulador de vida</h1>
        <BirthForm countries={countries} onSubmit={handleCreate} error={error} busy={busy} />
      </main>
    );
  }

  if (!life) return null;

  return (
    <main style={main}>
      <h1>Simulador de vida</h1>
      <LifeView
        life={life}
        derived={derived}
        pending={event !== null}
        busy={busy}
        onAdvance={handleAdvance}
      >
        {event ? <EventCard event={event} onSelect={handleDecide} busy={busy} /> : null}
      </LifeView>
      <PeopleList people={life.people} />
      {error ? (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      ) : null}
    </main>
  );
}

const main: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  padding: "2rem",
  maxWidth: 640,
  margin: "0 auto",
};
