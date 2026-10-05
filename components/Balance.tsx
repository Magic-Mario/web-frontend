export function Balance({ balanceCents }: { balanceCents: number }) {
  const value = (balanceCents / 100).toFixed(2);
  return (
    <section>
      <h2>Saldo</h2>
      <p data-testid="balance">${value}</p>
    </section>
  );
}
