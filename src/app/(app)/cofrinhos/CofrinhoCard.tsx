"use client";

import { useState } from "react";
import { registrarMovimentoCofrinho, excluirCofrinho } from "./actions";
import { fmtBRL } from "@/lib/utils";
import type { Cofrinho } from "@/lib/queries";
import { PiggyBank } from "lucide-react";

export function CofrinhoCard({ cofrinho, saldo }: { cofrinho: Cofrinho; saldo: number }) {
  const [movimentando, setMovimentando] = useState<"entrada" | "saida" | null>(null);
  const pct = cofrinho.meta_valor ? Math.min(100, (saldo / Number(cofrinho.meta_valor)) * 100) : null;

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--primary) 16%, transparent)", color: "var(--primary)" }}
          >
            <PiggyBank size={15} />
          </div>
          <p className="font-semibold">{cofrinho.nome}</p>
        </div>
        <form action={excluirCofrinho.bind(null, cofrinho.id)}>
          <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
        </form>
      </div>

      <p className="text-xl font-display num" style={{ color: saldo < 0 ? "var(--danger)" : "var(--receita)" }}>
        {fmtBRL(saldo)}
      </p>

      {cofrinho.meta_valor && (
        <>
          <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--primary)" }} />
          </div>
          <p className="text-xs text-[var(--muted)]">meta {fmtBRL(cofrinho.meta_valor)} ({pct?.toFixed(0)}%)</p>
        </>
      )}

      {movimentando ? (
        <form
          action={async (formData) => {
            await registrarMovimentoCofrinho(cofrinho.id, formData);
            setMovimentando(null);
          }}
          className="flex flex-col gap-2 mt-1"
        >
          <input type="hidden" name="tipo" value={movimentando} />
          <input name="valor" type="number" step="0.01" className="input" placeholder="Valor" required />
          <input name="descricao" className="input" placeholder="Descrição (opcional)" />
          <input name="data" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm flex-1">OK</button>
            <button type="button" className="btn-secondary text-sm" onClick={() => setMovimentando(null)}>×</button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 mt-1">
          <button className="btn-secondary text-sm flex-1" onClick={() => setMovimentando("entrada")}>
            + Guardar
          </button>
          <button className="btn-secondary text-sm flex-1" onClick={() => setMovimentando("saida")}>
            − Sacar
          </button>
        </div>
      )}
    </div>
  );
}
