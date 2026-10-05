"use client";

import { useCallback, useEffect, useState } from "react";

import { Balance } from "@/components/Balance";
import { MovementForm } from "@/components/MovementForm";
import { MovementList } from "@/components/MovementList";
import type { Balance as BalanceData, CreateMovementInput, Movement } from "@/lib/api";

export default function Home() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [balanceCents, setBalanceCents] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [movementsData, balanceData] = await Promise.all([
      fetch("/api/movements", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/balance", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { balance_cents: 0 }))
        .catch(() => ({ balance_cents: 0 })),
    ]);
    setMovements(movementsData as Movement[]);
    setBalanceCents((balanceData as BalanceData).balance_cents);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function create(input: CreateMovementInput) {
    const response = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error("backend_unavailable");
    }
    await refresh();
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>Finance · demo cloud (Floci + EKS)</h1>
      <Balance balanceCents={balanceCents} />
      <MovementForm onSubmit={create} />
      {loading ? <p>Cargando…</p> : <MovementList movements={movements} />}
    </main>
  );
}
