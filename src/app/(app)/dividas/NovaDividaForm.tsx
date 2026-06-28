"use client";

import { useRef, useState } from "react";
import { criarDivida } from "./actions";

export function NovaDividaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button className="btn-secondary" onClick={() => setAberto(true)}>
        + Nova dívida
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarDivida(formData);
        formRef.current?.reset();
        setAberto(false);
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-6 gap-2 items-end"
    >
      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Credor</label>
        <input name="credor" className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Valor total (R$)</label>
        <input name="valor_total" type="number" step="0.01" className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Parcelas</label>
        <input name="parcelas_qtd" type="number" min="1" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Valor da parcela (R$)</label>
        <input name="valor_parcela" type="number" step="0.01" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">1ª parcela em</label>
        <input name="data_primeira_parcela" type="date" className="input" />
      </div>
      <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
        <label className="text-xs text-[var(--muted)]">Negociação</label>
        <input name="negociacao_texto" className="input" placeholder="Ex: 12x de 291, sem negociação..." />
      </div>
      <div className="col-span-2 md:col-span-6 flex gap-2">
        <button type="submit" className="btn-primary">Salvar</button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  );
}
