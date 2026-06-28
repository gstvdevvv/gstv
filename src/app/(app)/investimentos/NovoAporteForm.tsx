"use client";

import { useRef } from "react";
import { criarAporte } from "./actions";

export function NovoAporteForm({ mesRef }: { mesRef: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarAporte(formData);
        formRef.current?.reset();
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-2 items-end"
    >
      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Ativo / Destino</label>
        <input name="ativo_destino" className="input" required placeholder="Reserva de Emergência" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Planejado (R$)</label>
        <input name="valor_planejado" type="number" step="0.01" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Aportado (R$)</label>
        <input name="valor_aportado" type="number" step="0.01" className="input" />
      </div>
      <input type="hidden" name="mes_ref" value={mesRef} />
      <button type="submit" className="btn-primary">Adicionar</button>
    </form>
  );
}
