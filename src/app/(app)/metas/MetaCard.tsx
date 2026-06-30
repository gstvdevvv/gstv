"use client";

import { useState } from "react";
import { atualizarProgressoMeta, excluirMeta } from "./actions";
import { fmtBRL, fmtPct } from "@/lib/utils";
import type { Meta } from "@/lib/queries";
import { calcularProgressoMeta } from "@/lib/metas";

const LABEL_STATUS: Record<string, { texto: string; cor: string }> = {
  concluida: { texto: "Concluída", cor: "var(--receita)" },
  no_prazo: { texto: "No prazo", cor: "var(--receita)" },
  atrasada: { texto: "Atrasada", cor: "var(--danger)" },
  sem_prazo: { texto: "Sem prazo definido", cor: "var(--muted)" },
};

export function MetaCard({ meta, capacidadeMensalPoupanca }: { meta: Meta; capacidadeMensalPoupanca: number }) {
  const [editando, setEditando] = useState(false);
  const progresso = calcularProgressoMeta(meta, capacidadeMensalPoupanca);
  const statusInfo = LABEL_STATUS[progresso.status];

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">{meta.categoria}</p>
          <p className="font-semibold">{meta.nome}</p>
        </div>
        <form action={excluirMeta.bind(null, meta.id)}>
          <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
        </form>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${progresso.pctAtingido}%`, background: statusInfo.cor }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">
          {fmtBRL(meta.valor_atual)} de {fmtBRL(meta.valor_alvo)} ({fmtPct(progresso.pctAtingido)})
        </span>
        <span className="font-medium" style={{ color: statusInfo.cor }}>{statusInfo.texto}</span>
      </div>

      {progresso.status !== "concluida" && (
        <p className="text-xs text-[var(--muted)]">
          {progresso.mesesRestantes !== null
            ? `Faltam ${fmtBRL(progresso.faltante)} em ${progresso.mesesRestantes} meses — aporte de ${fmtBRL(progresso.aporteMensalNecessario)}/mês necessário.`
            : `Faltam ${fmtBRL(progresso.faltante)} — defina um prazo para calcular o aporte mensal necessário.`}
        </p>
      )}

      {editando ? (
        <form
          action={async (formData) => {
            await atualizarProgressoMeta(meta.id, formData);
            setEditando(false);
          }}
          className="flex gap-2 items-end mt-1"
        >
          <input
            name="valor_atual"
            type="number"
            step="0.01"
            className="input flex-1"
            defaultValue={meta.valor_atual}
            required
          />
          <button type="submit" className="btn-primary text-sm">OK</button>
          <button type="button" className="btn-secondary text-sm" onClick={() => setEditando(false)}>×</button>
        </form>
      ) : (
        <button className="btn-secondary text-sm mt-1 self-start" onClick={() => setEditando(true)}>
          Atualizar valor atual
        </button>
      )}
    </div>
  );
}
