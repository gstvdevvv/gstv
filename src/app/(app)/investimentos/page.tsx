import { getCurrentHousehold } from "@/lib/household";
import { getInvestimentosDoAno } from "@/lib/queries";
import { fmtBRL, MESES, mesRefAtual } from "@/lib/utils";
import { MesSelector } from "@/components/MesSelector";
import { NovoAporteForm } from "./NovoAporteForm";
import { excluirAporte } from "./actions";
import { PatrimonioChart } from "@/components/charts/PatrimonioChart";
import { KpiCard } from "@/components/KpiCard";

export default async function InvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const { mes } = await searchParams;
  const mesRef = mes || mesRefAtual();
  const ano = Number(mesRef.split("-")[0]);

  const investimentosAno = await getInvestimentosDoAno(household.householdId, ano);
  const doMes = investimentosAno.filter((i) => i.mes_ref === mesRef);

  let acumulado = 0;
  const evolucao = MESES.map((nomeMes, idx) => {
    const ref = `${ano}-${String(idx + 1).padStart(2, "0")}`;
    const aportadoMes = investimentosAno
      .filter((i) => i.mes_ref === ref)
      .reduce((acc, i) => acc + Number(i.valor_aportado ?? 0), 0);
    acumulado += aportadoMes;
    return { mes: nomeMes.slice(0, 3), acumulado };
  });

  const totalPlanejadoMes = doMes.reduce((acc, i) => acc + Number(i.valor_planejado ?? 0), 0);
  const totalAportadoMes = doMes.reduce((acc, i) => acc + Number(i.valor_aportado ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Investimentos</h1>
        <MesSelector mesRef={mesRef} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard titulo="Planejado no mês" valor={fmtBRL(totalPlanejadoMes)} />
        <KpiCard titulo="Aportado no mês" valor={fmtBRL(totalAportadoMes)} cor="var(--invest)" />
        <KpiCard titulo="Patrimônio acumulado no ano" valor={fmtBRL(acumulado)} cor="var(--receita)" />
      </div>

      <div className="card p-4">
        <p className="label-eyebrow mb-3">Evolução patrimonial — {ano}</p>
        <PatrimonioChart dados={evolucao} />
      </div>

      <NovoAporteForm mesRef={mesRef} />

      <div className="card p-4 overflow-x-auto">
        <p className="label-eyebrow mb-3">Aportes do mês</p>
        {doMes.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-2">Nenhum aporte lançado neste mês.</p>
        ) : (
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-1.5 pr-2">Ativo / Destino</th>
                <th className="py-1.5 pr-2 text-right">Planejado</th>
                <th className="py-1.5 pr-2 text-right">Aportado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {doMes.map((i) => (
                <tr key={i.id} className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-2">{i.ativo_destino}</td>
                  <td className="py-1.5 pr-2 text-right">{fmtBRL(i.valor_planejado)}</td>
                  <td className="py-1.5 pr-2 text-right">{fmtBRL(i.valor_aportado)}</td>
                  <td className="py-1.5 pr-2 text-right">
                    <form action={excluirAporte.bind(null, i.id)}>
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
