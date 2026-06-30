import { getCurrentHousehold } from "@/lib/household";
import { getDividas, getPagamentosDivida, getInvestimentosDoAno } from "@/lib/queries";
import { fmtBRL, MESES } from "@/lib/utils";
import { KpiCard } from "@/components/KpiCard";
import { PatrimonioLiquidoChart, type PontoPatrimonioLiquido } from "@/components/charts/PatrimonioLiquidoChart";

export default async function PatrimonioPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const ano = new Date().getFullYear();
  const [dividas, pagamentos, investimentosAno] = await Promise.all([
    getDividas(household.householdId),
    getPagamentosDivida(household.householdId),
    getInvestimentosDoAno(household.householdId, ano),
  ]);

  const valorTotalDividasInicial = dividas.reduce((acc, d) => acc + Number(d.valor_total), 0);

  let ativosAcumulado = 0;
  const evolucao: PontoPatrimonioLiquido[] = MESES.map((nomeMes, idx) => {
    const mesRef = `${ano}-${String(idx + 1).padStart(2, "0")}`;
    const aportadoMes = investimentosAno
      .filter((i) => i.mes_ref === mesRef)
      .reduce((acc, i) => acc + Number(i.valor_aportado ?? 0), 0);
    ativosAcumulado += aportadoMes;

    const pagamentosAcumulados = pagamentos
      .filter((p) => p.mes_ref <= mesRef)
      .reduce((acc, p) => acc + Number(p.valor), 0);
    const passivos = Math.max(0, valorTotalDividasInicial - pagamentosAcumulados);

    return { mes: nomeMes.slice(0, 3), ativos: ativosAcumulado, passivos, liquido: ativosAcumulado - passivos };
  });

  const atual = evolucao[evolucao.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">Patrimônio Líquido</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard titulo="Ativos (investido)" valor={fmtBRL(atual.ativos)} cor="var(--invest)" />
        <KpiCard titulo="Passivos (dívidas)" valor={fmtBRL(atual.passivos)} cor="var(--divida)" />
        <KpiCard
          titulo="Patrimônio líquido"
          valor={fmtBRL(atual.liquido)}
          cor={atual.liquido >= 0 ? "var(--receita)" : "var(--despesa)"}
        />
      </div>

      <div className="card p-4">
        <p className="label-eyebrow mb-3">Evolução do patrimônio líquido — {ano}</p>
        <PatrimonioLiquidoChart dados={evolucao} />
        <p className="text-xs text-[var(--muted)] mt-3">
          Ativos = soma dos aportes registrados em Investimentos. Passivos = saldo devedor das dívidas cadastradas
          (valor total menos pagamentos registrados até o mês). Não inclui imóveis, veículos ou outros bens não cadastrados no sistema.
        </p>
      </div>
    </div>
  );
}
