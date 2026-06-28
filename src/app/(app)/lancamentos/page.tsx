import { getCurrentHousehold } from "@/lib/household";
import { getCategorias, getLancamentosDoMes } from "@/lib/queries";
import { fmtBRL, mesRefAtual } from "@/lib/utils";
import { MesSelector } from "@/components/MesSelector";
import { NovoLancamentoForm } from "./NovoLancamentoForm";
import { LancamentoRow } from "./LancamentoRow";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import type { ComponentType } from "react";

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const { mes } = await searchParams;
  const mesRef = mes || mesRefAtual();

  const [categorias, lancamentos] = await Promise.all([
    getCategorias(household.householdId),
    getLancamentosDoMes(household.householdId, mesRef),
  ]);

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const fixas = lancamentos.filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "fixa");
  const variaveis = lancamentos.filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "variavel");

  function totalRealizado(lista: typeof lancamentos) {
    return lista.reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  }

  function Secao({
    titulo,
    cor,
    Icon,
    itens,
  }: {
    titulo: string;
    cor: string;
    Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
    itens: typeof lancamentos;
  }) {
    return (
      <div className="card p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="label-eyebrow flex items-center gap-1.5" style={{ color: cor }}>
            <Icon size={13} strokeWidth={2} /> {titulo}
          </p>
          <p className="font-semibold num">{fmtBRL(totalRealizado(itens))}</p>
        </div>
        {itens.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-2">Nenhum lançamento.</p>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-1.5 pr-2">Categoria</th>
                <th className="py-1.5 pr-2">Descrição</th>
                <th className="py-1.5 pr-2 text-right">Previsto</th>
                <th className="py-1.5 pr-2 text-right">Realizado</th>
                <th className="py-1.5 pr-2">Forma pgto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((l) => (
                <LancamentoRow key={l.id} lancamento={l} categoria={categoriaPorId.get(l.categoria_id ?? "")} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Lançamentos</h1>
        <MesSelector mesRef={mesRef} />
      </div>

      <NovoLancamentoForm categorias={categorias} mesRef={mesRef} />

      <Secao titulo="Receitas" cor="var(--receita)" Icon={ArrowUpCircle} itens={receitas} />
      <Secao titulo="Despesas Fixas" cor="var(--foreground)" Icon={Wallet} itens={fixas} />
      <Secao titulo="Despesas Variáveis" cor="var(--primary)" Icon={ArrowDownCircle} itens={variaveis} />
    </div>
  );
}
