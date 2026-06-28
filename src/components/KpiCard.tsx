export function KpiCard({
  titulo,
  valor,
  cor,
  sub,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  sub?: string;
}) {
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <p className="label-eyebrow">{titulo}</p>
      <p className="text-2xl font-display num" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
      {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
