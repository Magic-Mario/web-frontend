"use client";

import { useState } from "react";

import type { CreateMovementInput, MovementType } from "@/lib/api";

export function MovementForm({
  onSubmit,
}: {
  onSubmit: (input: CreateMovementInput) => Promise<void>;
}) {
  const [type, setType] = useState<MovementType>("INCOME");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        type,
        amount_cents: Math.round(Number(amount) * 100),
        description,
      });
      setAmount("");
      setDescription("");
    } catch {
      setError("No se pudo registrar el movimiento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Registrar movimiento</h2>
      <form onSubmit={handleSubmit}>
        <select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
          <option value="INCOME">Ingreso</option>
          <option value="EXPENSE">Gasto</option>
        </select>
        <input
          aria-label="Monto"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto"
          required
        />
        <input
          aria-label="Descripción"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
        />
        <button type="submit" disabled={busy || amount === ""}>
          {busy ? "Guardando…" : "Registrar"}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
