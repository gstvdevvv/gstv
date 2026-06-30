import type { LucideIcon } from "lucide-react";

export function KpiCard({
  titulo,
  valor,
  cor,
  sub,
  Icon,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  sub?: string;
  Icon?: LucideIcon;
}) {
  const corFinal = cor ?? "var(--primary)";
  return (
    <div className="card p-4 flex flex-col gap-1.5 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${corFinal}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">{titulo}</p>
        {Icon && (
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${corFinal} 16%, transparent)`, color: corFinal }}
          >
            <Icon size={15} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="text-2xl font-display num" style={{ color: corFinal }}>
        {valor}
      </p>
      {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
