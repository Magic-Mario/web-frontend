import type { Movement } from "@/lib/api";

export function MovementList({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return <p>Sin movimientos todavía.</p>;
  }

  return (
    <section>
      <h2>Movimientos</h2>
      <ul>
        {movements.map((movement) => (
          <li key={movement.id}>
            {movement.type === "INCOME" ? "Ingreso" : "Gasto"} · $
            {(movement.amount_cents / 100).toFixed(2)} ·{" "}
            {movement.description || "—"} ·{" "}
            {new Date(movement.occurred_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
