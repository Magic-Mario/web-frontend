"use client";

// Portada del juego (T032): **la interfaz principal pasa a ser el juego**
// (FR-009, SC-009).
//
// - Sin vida → formulario de nacimiento (con el catálogo de FR-001).
// - Con vida → perfil con las cuatro stats (FR-004) y las personas cercanas
//   (FR-014), retomando la partida tras recargar o reiniciar (FR-008).

import { useCallback, useEffect, useState } from "react";

import { BirthForm } from "@/components/BirthForm";
import { PeopleList } from "@/components/PeopleList";
import { StatsBar } from "@/components/StatsBar";
import { ApiError, createLife, getBirthCatalog, getLife } from "@/lib/api";
import type { BirthCountry, CreateLifeInput, Life } from "@/lib/api";

type Phase = "loading" | "birth" | "life";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [life, setLife] = useState<Life | null>(null);
  const [countries, setCountries] = useState<BirthCountry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await getLife();
        if (!cancelled) {
          setLife(existing);
          setPhase("life");
        }
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
  }, []);

  const handleCreate = useCallback(async (input: CreateLifeInput) => {
    setBusy(true);
    setError(null);
    try {
      setLife(await createLife(input));
      setPhase("life");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Una partida por jugador en v1 (FR-008): la retomamos.
        try {
          setLife(await getLife());
          setPhase("life");
          return;
        } catch {
          // cae al mensaje de abajo
        }
      }
      setError(err instanceof ApiError ? err.detail : "No se pudo crear la vida.");
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

  const ageYears = Math.floor(life.age_months / 12);

  return (
    <main style={main}>
      <h1>Simulador de vida</h1>
      <p data-testid="profile">
        <strong>
          {life.city}, {life.country}
        </strong>{" "}
        · nacido en {life.birth_year} · {ageYears} años · {life.current_year}
      </p>
      <StatsBar stats={life.stats} />
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
