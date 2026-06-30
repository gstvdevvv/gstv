import { getCurrentHousehold } from "@/lib/household";
import { getInvestimentosDoAno, getConfig, getLancamentosDoAno, getCategorias } from "@/lib/queries";
import { fmtBRL, fmtPct, MESES, mesRefAtual } from "@/lib/utils";
import { calcularIndicadores, calcularReserva } from "@/lib/indicadores";
import { projetarPatrimonio } from "@/lib/projecoes";
import { sugerirAlocacao, type PerfilRisco } from "@/lib/alocacao";
import { MesSelector } from "@/components/MesSelector";
import { NovoAporteForm } from "./NovoAporteForm";
import { excluirAporte } from "./actions";
import { PatrimonioChart } from "@/components/charts/PatrimonioChart";
import { KpiCard } from "@/components/KpiCard";
import { TrendingUp, Compass } from "lucide-react";

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

  const [investimentosAno, config, categorias, lancamentosAno] = await Promise.all([
    getInvestimentosDoAno(household.householdId, ano),
    getConfig(household.householdId),
    getCategorias(household.householdId),
    getLancamentosDoAno(household.householdId, ano),
  ]);
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

  const indicadores = calcularIndicadores(lancamentosAno, categorias);
  const reserva = calcularReserva(investimentosAno, indicadores.despesaFixaMediaMensal, config.meses_reserva_meta);
  const aporteMedioMensal = acumulado / 12;
  const projecoes = projetarPatrimonio(acumulado, aporteMedioMensal);
  const alocacaoSugerida = sugerirAlocacao(config.perfil_risco as PerfilRisco, reserva.pctMeta >= 100);

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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="label-eyebrow mb-3 flex items-center gap-1.5">
            <TrendingUp size={13} /> Projeção patrimonial
          </p>
          <p className="text-xs text-[var(--muted)] mb-3">
            Estimativa simples assumindo o aporte médio mensal atual ({fmtBRL(aporteMedioMensal)}) e retorno real de 6% a.a. —
            é uma projeção, não uma garantia de resultado.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-1.5 pr-2 font-normal">Horizonte</th>
                <th className="py-1.5 pr-2 text-right font-normal">Patrimônio projetado</th>
              </tr>
            </thead>
            <tbody>
              {projecoes.map((p) => (
                <tr key={p.anos} className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-2">{p.anos} {p.anos === 1 ? "ano" : "anos"}</td>
                  <td className="py-1.5 pr-2 text-right num">{fmtBRL(p.patrimonioProjetado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <p className="label-eyebrow mb-3 flex items-center gap-1.5">
            <Compass size={13} /> Alocação sugerida — perfil {config.perfil_risco}
          </p>
          {reserva.pctMeta < 100 && (
            <p className="text-xs text-[var(--danger)] mb-2">
              Reserva de emergência ainda em {fmtPct(reserva.pctMeta)} da meta — priorize ela antes de diversificar.
            </p>
          )}
          <div className="flex flex-col gap-2.5">
            {alocacaoSugerida.map((a) => (
              <div key={a.classe} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{a.classe}</span>
                  <span className="num font-semibold">{a.percentual}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${a.percentual}%`, background: "var(--invest)" }} />
                </div>
                <p className="text-xs text-[var(--muted)]">{a.explicacao}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-3 italic">
            Sugestão educativa baseada no perfil informado em Configurações — não constitui recomendação de investimento personalizada.
          </p>
        </div>
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
