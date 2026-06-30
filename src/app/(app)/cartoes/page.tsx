import { getCurrentHousehold } from "@/lib/household";
import { getCartoes, getCategorias, getGastosCartaoDoMes } from "@/lib/queries";
import { fmtBRL, mesRefAtual } from "@/lib/utils";
import { MesSelector } from "@/components/MesSelector";
import { NovoCartaoForm } from "./NovoCartaoForm";
import { NovaCompraForm } from "./NovaCompraForm";
import { excluirGastoCartao, excluirCartao } from "./actions";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const { mes } = await searchParams;
  const mesRef = mes || mesRefAtual();

  const [cartoes, categorias, gastos] = await Promise.all([
    getCartoes(household.householdId),
    getCategorias(household.householdId),
    getGastosCartaoDoMes(household.householdId, mesRef),
  ]);

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

  const totalFaturaMes = gastos.reduce((acc, g) => acc + Number(g.valor_total), 0);
  const porCategoria = new Map<string, number>();
  for (const g of gastos) {
    const nome = categoriaPorId.get(g.categoria_id ?? "")?.nome ?? "Sem categoria";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + Number(g.valor_total));
  }
  const categoriaDados = Array.from(porCategoria.entries())
    .map(([categoria, valor]) => ({ categoria, valor, pct: totalFaturaMes > 0 ? (valor / totalFaturaMes) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Cartões de Crédito</h1>
        <MesSelector mesRef={mesRef} />
      </div>

      <div className="flex flex-wrap gap-3">
        {cartoes.map((c) => {
          const totalFatura = gastos
            .filter((g) => g.cartao_id === c.id)
            .reduce((acc, g) => acc + Number(g.valor_total), 0);
          const pctLimite = c.limite ? (totalFatura / Number(c.limite)) * 100 : null;
          return (
            <div key={c.id} className="card p-4 w-full sm:w-64 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.nome}</p>
                <form action={excluirCartao.bind(null, c.id)}>
                  <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
                </form>
              </div>
              <p className="text-xs text-[var(--muted)]">{c.bandeira ?? "—"}</p>
              <p className="text-xl font-display num mt-1">{fmtBRL(totalFatura)}</p>
              {c.limite && (
                <>
                  <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, pctLimite ?? 0)}%`,
                        background: (pctLimite ?? 0) >= 90 ? "var(--danger)" : "var(--primary)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)]">de {fmtBRL(c.limite)} de limite</p>
                </>
              )}
            </div>
          );
        })}
        <div className="flex items-center"><NovoCartaoForm /></div>
      </div>

      {categoriaDados.length > 0 && (
        <div className="card p-4">
          <p className="label-eyebrow mb-3">Gastos por categoria no cartão — fatura do mês</p>
          <div className="flex flex-col gap-2.5">
            {categoriaDados.map((c) => (
              <div key={c.categoria} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{c.categoria}</span>
                  <span className="num text-[var(--muted)]">{fmtBRL(c.valor)} · {c.pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: "var(--primary)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="label-eyebrow mb-3">Lançar gasto no cartão</p>
        <NovaCompraForm cartoes={cartoes} categorias={categorias} mesRef={mesRef} />
      </div>

      <div className="card p-4 overflow-x-auto">
        <p className="label-eyebrow mb-3">Fatura do mês</p>
        {gastos.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-2">Nenhum gasto lançado neste mês.</p>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-1.5 pr-2">Cartão</th>
                <th className="py-1.5 pr-2">Descrição</th>
                <th className="py-1.5 pr-2">Categoria</th>
                <th className="py-1.5 pr-2">Data</th>
                <th className="py-1.5 pr-2 text-right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id} className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-2">{cartoes.find((c) => c.id === g.cartao_id)?.nome ?? "—"}</td>
                  <td className="py-1.5 pr-2">{g.descricao}</td>
                  <td className="py-1.5 pr-2">{categoriaPorId.get(g.categoria_id ?? "")?.nome ?? "—"}</td>
                  <td className="py-1.5 pr-2">{new Date(g.data_compra).toLocaleDateString("pt-BR")}</td>
                  <td className="py-1.5 pr-2 text-right">{fmtBRL(g.valor_total)}</td>
                  <td className="py-1.5 pr-2 text-right">
                    <form action={excluirGastoCartao.bind(null, g.id)}>
                      <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
