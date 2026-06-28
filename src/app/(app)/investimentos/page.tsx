import { getCurrentHousehold } from "@/lib/household";
import { getInvestimentosDoAno } from "@/lib/queries";
import { fmtBRL, MESES, mesRefAtual } from "@/lib/utils";
import { MesSelector } from "@/components/MesSelector";
import { NovoAporteForm } from "./NovoAporteForm";
import { excluirAporte } from "./actions";
import { PatrimonioChart } from "@/components/charts/PatrimonioChart";

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

  let investimentosAno: Awaited<ReturnType<typeof getInvestimentosDoAno>> = [];
  try {
    investimentosAno = await getInvestimentosDoAno(household.householdId, ano);
  } catch (err) {
    return (
      <pre className="card p-4 text-xs text-[var(--danger)] whitespace-pre-wrap">
        DEBUG InvestimentosPage: {err instanceof Error ? `${err.message}\n${err.stack}` : String(err)}
      </pre>
    );
  }
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
        <h1 className="text-2xl font-bold">Investimentos</h1>
        <MesSelector mesRef={mesRef} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs uppercase text-[var(--muted)]">Planejado no mês</p>
          <p className="text-2xl font-bold">{fmtBRL(totalPlanejadoMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-[var(--muted)]">Aportado no mês</p>
          <p className="text-2xl font-bold" style={{ color: "var(--invest)" }}>{fmtBRL(totalAportadoMes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-[var(--muted)]">Patrimônio acumulado no ano</p>
          <p className="text-2xl font-bold" style={{ color: "var(--receita)" }}>{fmtBRL(acumulado)}</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-semibold mb-2">Evolução patrimonial — {ano}</p>
        <PatrimonioChart dados={evolucao} />
      </div>

      <NovoAporteForm mesRef={mesRef} />

      <div className="card p-4 overflow-x-auto">
        <p className="font-semibold mb-2">Aportes do mês</p>
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
                    <form action={async () => { await excluirAporte(i.id); }}>
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
