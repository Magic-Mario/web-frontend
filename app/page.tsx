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
// - Al morir, `GET /lives/summary` levanta la compuerta (409 en vida) y se
//   pinta `DeathSummary`; «Empezar de nuevo» borra todo con `DELETE /lives`
//   y vuelve al formulario sin rastro de la partida anterior (SC-004).

import { useCallback, useEffect, useState } from "react";

import { BirthForm } from "@/components/BirthForm";
import { DeathSummary } from "@/components/DeathSummary";
import { EventCard } from "@/components/EventCard";
import { LifeView } from "@/components/LifeView";
import { PeopleList } from "@/components/PeopleList";
import {
  ApiError,
  advanceLife,
  createLife,
  deleteLife,
  getBirthCatalog,
  getLife,
  getSummary,
  submitDecision,
} from "@/lib/api";
import type {
  BirthCountry,
  CreateLifeInput,
  Life,
  LifeSummary,
  PresentedEvent,
  Stats,
} from "@/lib/api";

type Phase = "loading" | "birth" | "life";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [life, setLife] = useState<Life | null>(null);
  const [event, setEvent] = useState<PresentedEvent | null>(null);
  const [derived, setDerived] = useState<Partial<Stats> | null>(null);
  const [summary, setSummary] = useState<LifeSummary | null>(null);
  const [countries, setCountries] = useState<BirthCountry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Carga la vida y, con ella, el suceso que estuviera sin decidir. */
  const adoptLife = useCallback((next: Life) => {
    setLife(next);
    setEvent(next.pending_event ?? null);
    setDerived(null);
    setSummary(null);
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

  // El resumen sólo existe con la vida terminada: `GET /lives/summary`
  // responde `409` mientras corre (FR-005), así que se pide aquí, tanto al
  // morir como al recargar una partida que ya había muerto.
  useEffect(() => {
    if (!life || life.status !== "DEAD" || summary) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getSummary();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.detail : "No se pudo cargar el resumen.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [life, summary]);

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

  const handleRestart = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteLife();
      // SC-004: sin rastro de la partida anterior; se vuelve al formulario.
      setLife(null);
      setSummary(null);
      setEvent(null);
      setDerived(null);
      setPhase("birth");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo borrar la vida.");
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
      {life.status === "DEAD" ? (
        summary ? (
          <DeathSummary summary={summary} onRestart={handleRestart} busy={busy} />
        ) : (
          <p>Cargando el resumen…</p>
        )
      ) : null}
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
