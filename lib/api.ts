// Cliente REST del frontend hacia el backend.
// En el clúster, `backend` es el Service (sin selector) + Endpoints que apunta
// al NodePort del backend. Nunca se accede al almacenamiento directamente.

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? "http://backend:8000";

export type MovementType = "INCOME" | "EXPENSE";

export interface Movement {
  id: string;
  type: MovementType;
  amount_cents: number;
  description: string;
  occurred_at: string;
}

export interface Balance {
  balance_cents: number;
}

export interface CreateMovementInput {
  type: MovementType;
  amount_cents: number;
  description?: string;
}

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`backend respondió ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getBalance(): Promise<Balance> {
  return backendFetch<Balance>("/balance");
}

export function listMovements(): Promise<Movement[]> {
  return backendFetch<Movement[]>("/movements");
}

export function createMovement(input: CreateMovementInput): Promise<Movement> {
  return backendFetch<Movement>("/movements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
