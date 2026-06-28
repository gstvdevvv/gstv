"use client";

import { useRef } from "react";
import { criarGastoCartao } from "./actions";
import type { Cartao, Categoria } from "@/lib/queries";

export function NovaCompraForm({ cartoes, categorias, mesRef }: { cartoes: Cartao[]; categorias: Categoria[]; mesRef: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const categoriasVariaveis = categorias.filter((c) => c.tipo === "variavel");

  if (cartoes.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Cadastre um cartão para lançar gastos.</p>;
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarGastoCartao(formData);
        formRef.current?.reset();
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-7 gap-2 items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Cartão</label>
        <select name="cartao_id" className="input" required>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Descrição</label>
        <input name="descricao" className="input" required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Categoria</label>
        <select name="categoria_id" className="input">
          <option value="">—</option>
          {categoriasVariaveis.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Valor total (R$)</label>
        <input name="valor_total" type="number" step="0.01" className="input" required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Parcelas</label>
        <input name="parcelas" type="number" min="1" defaultValue={1} className="input" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Data da compra</label>
        <input name="data_compra" type="date" className="input" defaultValue={`${mesRef}-01`} required />
      </div>

      <input type="hidden" name="fatura_mes_ref" value={mesRef} />

      <button type="submit" className="btn-primary">Lançar gasto</button>
    </form>
  );
}
