"use client";

import { useRef } from "react";
import { criarCategoria } from "./actions";

export function CategoriaForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarCategoria(formData);
        formRef.current?.reset();
      }}
      className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Tipo</label>
        <select name="tipo" className="input" required>
          <option value="receita">Receita</option>
          <option value="fixa">Despesa fixa</option>
          <option value="variavel">Despesa variável</option>
          <option value="investimento">Investimento</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Nome</label>
        <input name="nome" className="input" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Limite mensal (R$, opcional)</label>
        <input name="limite_padrao" type="number" step="0.01" className="input" />
      </div>
      <button type="submit" className="btn-primary col-span-2 md:col-span-1">Adicionar</button>
    </form>
  );
}
