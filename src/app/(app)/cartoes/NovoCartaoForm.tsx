"use client";

import { useRef, useState } from "react";
import { criarCartao } from "./actions";

export function NovoCartaoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button className="btn-secondary" onClick={() => setAberto(true)}>
        + Novo cartão
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarCartao(formData);
        formRef.current?.reset();
        setAberto(false);
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-2 items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Nome</label>
        <input name="nome" className="input" required placeholder="Nubank" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Bandeira</label>
        <input name="bandeira" className="input" placeholder="Mastercard" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Limite (R$)</label>
        <input name="limite" type="number" step="0.01" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Dia fechamento</label>
        <input name="dia_fechamento" type="number" min="1" max="31" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Dia vencimento</label>
        <input name="dia_vencimento" type="number" min="1" max="31" className="input" />
      </div>
      <div className="col-span-2 md:col-span-5 flex gap-2">
        <button type="submit" className="btn-primary">Salvar</button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  );
}
