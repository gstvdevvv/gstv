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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Cartões de Crédito</h1>
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
                <form action={async () => { await excluirCartao(c.id); }}>
                  <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
                </form>
              </div>
              <p className="text-xs text-[var(--muted)]">{c.bandeira ?? "—"}</p>
              <p className="text-xl font-bold mt-1">{fmtBRL(totalFatura)}</p>
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

      <div>
        <p className="font-semibold mb-2">Lançar gasto no cartão</p>
        <NovaCompraForm cartoes={cartoes} categorias={categorias} mesRef={mesRef} />
      </div>

      <div className="card p-4 overflow-x-auto">
        <p className="font-semibold mb-2">Fatura do mês</p>
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
                    <form action={async () => { await excluirGastoCartao(g.id); }}>
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
