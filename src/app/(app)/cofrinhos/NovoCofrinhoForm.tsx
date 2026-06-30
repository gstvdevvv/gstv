"use client";

import { useRef } from "react";
import { criarCofrinho } from "./actions";

export function NovoCofrinhoForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarCofrinho(formData);
        formRef.current?.reset();
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-3 gap-2 items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Nome do cofrinho</label>
        <input name="nome" className="input" required placeholder="Combustível" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Meta (R$, opcional)</label>
        <input name="meta_valor" type="number" step="0.01" className="input" />
      </div>
      <button type="submit" className="btn-primary">Criar cofrinho</button>
    </form>
  );
}
