"use client";

// Portada del juego (T032 + T059): **la interfaz principal es el juego**
// (FR-009, SC-009).
//
// - Sin vida → formulario de nacimiento (con el catálogo de FR-001).
// - Con vida → `LifeView` con cabecera (nombre, lugar, edad y estado),
//   stats, el `EventCard` o el botón «Avanzar», personas cercanas y, al
//   lado, la línea de tiempo del historial (`GET /lives/events`). Las dos
//   interacciones de **juego** siguen siendo avanzar y elegir opción, sin
//   menú de acciones (FR-012); «Nueva partida» es sólo un control de sesión
//   (con confirmación) que borra la partida y vuelve al nacimiento.
// - Al recargar se retoma la partida tal cual quedó, incluido un suceso
//   pendiente de decisión que el backend devuelve en `GET /lives`
//   (FR-008, SC-006).
// - Al morir, `GET /lives/summary` levanta la compuerta (409 en vida) y se
//   pinta `DeathSummary` con el resumen **y** el historial completo; «Empezar
//   de nuevo» borra todo con `DELETE /lives`, limpia la identidad anónima y
//   vuelve al formulario sin rastro de la partida anterior (SC-004).

import { useCallback, useEffect, useRef, useState } from "react";

import { BirthForm } from "@/components/BirthForm";
import type { BirthFormData } from "@/components/BirthForm";
import { DeathSummary } from "@/components/DeathSummary";
import { EventTimeline } from "@/components/EventTimeline";
import type { TimelineState } from "@/components/EventTimeline";
import { LifeView } from "@/components/LifeView";
import type { StatFlash } from "@/components/StatsBar";
import { SparklesIcon, TriangleAlertIcon } from "@/components/icons";
import { hasDeltas } from "@/components/DeltaChips";
import {
  ApiError,
  advanceLife,
  createLife,
  deleteLife,
  getBirthCatalog,
  getLife,
  getLifeEvents,
  getSummary,
  submitDecision,
} from "@/lib/api";
import type {
  BirthCountry,
  EventHistory,
  Life,
  LifeSummary,
  PresentedEvent,
  Stats,
} from "@/lib/api";
import { clearCharacterName, getCharacterName, setCharacterName } from "@/lib/characterName";
import { clearPlayerId } from "@/lib/playerId";

type Phase = "loading" | "birth" | "life";

/** Cabecera y pie comunes a las tres fases del juego. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark">
            <SparklesIcon width={24} height={24} />
          </span>
          <div>
            <h1 className="brand__title">Simulador de vida</h1>
            <p className="brand__tagline">
              Nace, crece y decide sobre los sucesos de la época
            </p>
          </div>
        </div>
      </header>

      <main className="app__main stack">{children}</main>

      <footer className="app__footer">
        Partida anónima: tu identidad y tu nombre se guardan solo en este
        navegador.
      </footer>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [life, setLife] = useState<Life | null>(null);
  const [event, setEvent] = useState<PresentedEvent | null>(null);
  /** Deriva natural del período (`AdvanceResponse.derived`). */
  const [periodDeltas, setPeriodDeltas] = useState<Partial<Stats> | null>(null);
  /** Delta recién aplicado, para el flash sobre las stats. */
  const [flash, setFlash] = useState<StatFlash | null>(null);
  const [summary, setSummary] = useState<LifeSummary | null>(null);
  const [history, setHistory] = useState<EventHistory | null>(null);
  const [historyState, setHistoryState] = useState<TimelineState>("loading");
  const [countries, setCountries] = useState<BirthCountry[]>([]);
  const [characterName, setCharacterNameState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Contador para reiniciar la animación del flash en cada suceso. */
  const flashId = useRef(0);

  /** Carga la vida y, con ella, el suceso que estuviera sin decidir. */
  const adoptLife = useCallback((next: Life) => {
    setLife(next);
    setEvent(next.pending_event ?? null);
    setPeriodDeltas(null);
    setFlash(null);
    setSummary(null);
    setPhase("life");
  }, []);

  /**
   * Recarga el histórico. Si el backend todavía no publica `/lives/events`
   * (o responde con error), no se rompe nada: el panel se queda vacío.
   */
  const refreshHistory = useCallback(async () => {
    setHistoryState("loading");
    try {
      const data = await getLifeEvents();
      setHistory(data);
      setHistoryState("ready");
    } catch {
      setHistory(null);
      setHistoryState("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await getLife();
        if (cancelled) return;
        adoptLife(existing);
        setCharacterNameState(getCharacterName());
        void refreshHistory();
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
  }, [adoptLife, refreshHistory]);

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

  // El flash de deltas es breve: se apaga solo a los pocos segundos.
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const pushFlash = useCallback((deltas: Partial<Stats> | null) => {
    if (!deltas || !hasDeltas(deltas)) return;
    flashId.current += 1;
    setFlash({ deltas, id: flashId.current });
  }, []);

  const handleCreate = useCallback(
    async (input: BirthFormData) => {
      setBusy(true);
      setError(null);
      const { name, ...payload } = input;
      try {
        const created = await createLife(payload);
        // El nombre no viaja al servidor: se queda en el navegador.
        setCharacterName(name);
        setCharacterNameState(name);
        adoptLife(created);
        void refreshHistory();
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Una partida por jugador en v1 (FR-008): la retomamos.
          try {
            adoptLife(await getLife());
            setCharacterNameState(getCharacterName());
            void refreshHistory();
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
    [adoptLife, refreshHistory],
  );

  const handleAdvance = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await advanceLife();
      setLife(outcome.life);
      // FR-007: el avance abre el lote del período; se presenta el primero y
      // los siguientes van llegando con cada decisión.
      setEvent(outcome.events[0]);
      const derived = outcome.derived ?? null;
      setPeriodDeltas(derived);
      pushFlash(derived);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo avanzar.");
    } finally {
      setBusy(false);
    }
  }, [pushFlash]);

  const handleDecide = useCallback(
    async (optionId: string) => {
      if (!event) return;
      setBusy(true);
      setError(null);
      try {
        const outcome = await submitDecision(event.id, optionId);
        setLife(outcome.life);
        // FR-007: si quedaban sucesos en el lote, el siguiente ya viene en la
        // respuesta; si no, el período está resuelto y reaparece «Avanzar».
        setEvent(outcome.life.pending_event ?? null);
        setPeriodDeltas(null);
        pushFlash(outcome.deltas);
        // La decisión ya está en el servidor: se refresca el historial.
        void refreshHistory();
      } catch (err) {
        setError(
          err instanceof ApiError ? err.detail : "No se pudo registrar la decisión.",
        );
      } finally {
        setBusy(false);
      }
    },
    [event, pushFlash, refreshHistory],
  );

  const handleRestart = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteLife();
      // SC-004: sin rastro de la partida anterior; se vuelve al formulario.
      clearPlayerId();
      clearCharacterName();
      setCharacterNameState("");
      setLife(null);
      setSummary(null);
      setEvent(null);
      setPeriodDeltas(null);
      setFlash(null);
      setHistory(null);
      setHistoryState("loading");
      setPhase("birth");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No se pudo borrar la vida.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (phase === "loading") {
    return (
      <Shell>
        <div className="loading-screen" role="status">
          <span className="loader" aria-hidden="true" />
          <p>Cargando tu partida…</p>
        </div>
      </Shell>
    );
  }

  if (phase === "birth") {
    return (
      <Shell>
        <BirthForm
          countries={countries}
          onSubmit={handleCreate}
          error={error}
          busy={busy}
        />
      </Shell>
    );
  }

  if (!life) return null;

  const alert = error ? (
    <p className="alert alert--error" role="alert">
      <TriangleAlertIcon width={16} height={16} className="alert__icon" />
      {error}
    </p>
  ) : null;

  // --- fin de la vida: resumen + historial completo --------------------
  if (life.status === "DEAD") {
    return (
      <Shell>
        {alert}
        {summary ? (
          <DeathSummary
            summary={summary}
            history={history}
            historyState={historyState}
            onRestart={handleRestart}
            onRetryHistory={refreshHistory}
            busy={busy}
          />
        ) : (
          <div className="loading-screen" role="status">
            <span className="loader" aria-hidden="true" />
            <p>Cargando el resumen de tu vida…</p>
          </div>
        )}
      </Shell>
    );
  }

  // --- vida en curso: HUD + historial lateral --------------------------
  const countryName = countries.find((entry) => entry.code === life.country)?.name;

  return (
    <Shell>
      {alert}
      <div className="game-layout">
        <div className="game-layout__main">
          <LifeView
            life={life}
            countryName={countryName}
            characterName={characterName}
            event={event}
            periodDeltas={periodDeltas}
            flash={flash}
            busy={busy}
            people={life.people}
            onAdvance={handleAdvance}
            onDecide={handleDecide}
            onRestart={handleRestart}
          />
        </div>
        <aside className="game-layout__side">
          <EventTimeline
            history={history}
            state={historyState}
            onRetry={refreshHistory}
          />
        </aside>
      </div>
    </Shell>
  );
}
