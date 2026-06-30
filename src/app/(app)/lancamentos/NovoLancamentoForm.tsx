"use client";

import { useRef, useState } from "react";
import { criarLancamento } from "./actions";
import type { Categoria, Cofrinho } from "@/lib/queries";

export function NovoLancamentoForm({
  categorias,
  mesRef,
  cofrinhos,
}: {
  categorias: Categoria[];
  mesRef: string;
  cofrinhos: Cofrinho[];
}) {
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const formRef = useRef<HTMLFormElement>(null);

  const categoriasDoTipo = categorias.filter((c) =>
    tipo === "receita" ? c.tipo === "receita" : c.tipo === "fixa" || c.tipo === "variavel"
  );

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await criarLancamento(formData);
        formRef.current?.reset();
      }}
      className="card p-4 grid grid-cols-2 md:grid-cols-7 gap-2 items-end"
    >
      <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
        <label className="text-xs text-[var(--muted)]">Tipo</label>
        <select name="tipo" className="input" value={tipo} onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Categoria</label>
        <select name="categoria_id" className="input" required>
          <option value="">Selecione</option>
          {categoriasDoTipo.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-xs text-[var(--muted)]">Descrição</label>
        <input name="descricao" className="input" required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Previsto (R$)</label>
        <input name="valor_previsto" type="number" step="0.01" className="input" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Realizado (R$)</label>
        <input name="valor_realizado" type="number" step="0.01" className="input" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Data</label>
        <input name="data" type="date" className="input" defaultValue={`${mesRef}-01`} required />
      </div>

      <input type="hidden" name="mes_ref" value={mesRef} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--muted)]">Forma pgto</label>
        <input name="forma_pagamento" className="input" placeholder="PIX, boleto..." />
      </div>

      {tipo === "despesa" && cofrinhos.length > 0 && (
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs text-[var(--muted)]">Saiu de algum cofrinho?</label>
          <select name="cofrinho_id" className="input" defaultValue="">
            <option value="">Não — é um gasto novo</option>
            {cofrinhos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="btn-primary h-fit">Adicionar</button>
    </form>
  );
}
