"use client";

import { useRef } from "react";
import { criarMeta } from "./actions";

const CATEGORIAS = ["Casa", "Carro", "Viagem", "Reserva", "Aposentadoria", "Filhos", "Faculdade", "Reforma", "Investimentos", "Outros"];

export function NovaMetaForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarMeta(formData);
        formRef.current?.reset();
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-2 items-end"
    >
      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Nome da meta</label>
        <input name="nome" className="input" required placeholder="Viagem para a praia" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Categoria</label>
        <select name="categoria" className="input" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Valor alvo (R$)</label>
        <input name="valor_alvo" type="number" step="0.01" className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Prazo</label>
        <input name="prazo" type="date" className="input" />
      </div>
      <input type="hidden" name="valor_atual" value="0" />
      <button type="submit" className="btn-primary col-span-2 md:col-span-1">Criar meta</button>
    </form>
  );
}
