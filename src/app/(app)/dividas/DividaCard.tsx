"use client";

import { useState } from "react";
import { registrarPagamentoDivida, excluirDivida } from "./actions";
import { fmtBRL, fmtPct, mesRefLabel } from "@/lib/utils";
import type { Divida } from "@/lib/queries";
import type { PlanoPagamento } from "@/lib/planoPagamento";

export function DividaCard({
  divida,
  plano,
  prioridade,
}: {
  divida: Divida;
  plano: PlanoPagamento;
  prioridade?: number;
}) {
  const [pagando, setPagando] = useState(false);
  const quitada = plano.saldo <= 0;

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {prioridade && <span className="badge bg-[var(--accent)] text-[#1a1400]">#{prioridade}</span>}
          <p className="font-semibold">{divida.credor}</p>
        </div>
        <form action={async () => { await excluirDivida(divida.id); }}>
          <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
        </form>
      </div>

      <p className="text-xs text-[var(--muted)]">{divida.negociacao_texto ?? "Sem negociação registrada"}</p>

      <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, plano.percentualPago)}%`, background: quitada ? "var(--receita)" : "var(--primary)" }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">Pago: {fmtBRL(plano.pago)} ({fmtPct(plano.percentualPago)})</span>
        <span className="font-semibold" style={{ color: quitada ? "var(--receita)" : "var(--divida)" }}>
          Saldo: {fmtBRL(plano.saldo)}
        </span>
      </div>

      {!quitada && plano.parcelasRestantes > 0 && (
        <p className="text-xs text-[var(--muted)]">
          ~{plano.parcelasRestantes}x de {fmtBRL(divida.valor_parcela)} · quitação prevista em{" "}
          {plano.mesRefFimPrevisto ? mesRefLabel(plano.mesRefFimPrevisto) : "—"}
        </p>
      )}

      {!quitada && (
        pagando ? (
          <form
            action={async (formData) => {
              await registrarPagamentoDivida(formData);
              setPagando(false);
            }}
            className="flex gap-2 items-end mt-1"
          >
            <input type="hidden" name="divida_id" value={divida.id} />
            <input
              name="valor"
              type="number"
              step="0.01"
              className="input flex-1"
              placeholder="Valor pago"
              defaultValue={divida.valor_parcela ?? ""}
              required
            />
            <input name="data" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} required />
            <button type="submit" className="btn-primary text-sm">OK</button>
            <button type="button" className="btn-secondary text-sm" onClick={() => setPagando(false)}>×</button>
          </form>
        ) : (
          <button className="btn-secondary text-sm mt-1 self-start" onClick={() => setPagando(true)}>
            Registrar pagamento
          </button>
        )
      )}
    </div>
  );
}
