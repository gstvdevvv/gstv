"use client";

import { useState } from "react";
import { atualizarRealizado, excluirLancamento } from "./actions";
import { fmtBRL } from "@/lib/utils";
import type { Lancamento, Categoria } from "@/lib/queries";

export function LancamentoRow({ lancamento, categoria }: { lancamento: Lancamento; categoria: Categoria | undefined }) {
  const [realizado, setRealizado] = useState(lancamento.valor_realizado ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvarRealizado() {
    setSalvando(true);
    await atualizarRealizado(lancamento.id, Number(realizado) || 0);
    setSalvando(false);
  }

  return (
    <tr className="border-b border-[var(--border)]/40">
      <td className="py-1.5 pr-2">{categoria?.nome ?? "—"}</td>
      <td className="py-1.5 pr-2">{lancamento.descricao}</td>
      <td className="py-1.5 pr-2 text-right">{fmtBRL(lancamento.valor_previsto)}</td>
      <td className="py-1.5 pr-2 text-right">
        <input
          type="number"
          step="0.01"
          className="input w-24 text-right py-1"
          value={realizado}
          onChange={(e) => setRealizado(e.target.value)}
          onBlur={salvarRealizado}
        />
      </td>
      <td className="py-1.5 pr-2 text-[var(--muted)]">{lancamento.forma_pagamento ?? "—"}</td>
      <td className="py-1.5 pr-2 text-right">
        <button
          onClick={() => excluirLancamento(lancamento.id)}
          className="text-[var(--danger)] text-xs hover:underline"
          disabled={salvando}
        >
          excluir
        </button>
      </td>
    </tr>
  );
}
