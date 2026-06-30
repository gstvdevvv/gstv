import { getCurrentHousehold } from "@/lib/household";
import { getDividas, getPagamentosDivida } from "@/lib/queries";
import { calcularPlano, ordenarPorPrioridade, gerarPlanoEstrategico } from "@/lib/planoPagamento";
import { fmtBRL, mesRefLabel } from "@/lib/utils";
import { NovaDividaForm } from "./NovaDividaForm";
import { DividaCard } from "./DividaCard";
import { KpiCard } from "@/components/KpiCard";
import { ListOrdered } from "lucide-react";

export default async function DividasPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const [dividas, pagamentos] = await Promise.all([
    getDividas(household.householdId),
    getPagamentosDivida(household.householdId),
  ]);

  const saldoTotal = dividas.reduce((acc, d) => acc + calcularPlano(d, pagamentos).saldo, 0);
  const pagoTotal = dividas.reduce((acc, d) => acc + calcularPlano(d, pagamentos).pago, 0);
  const prioridades = ordenarPorPrioridade(dividas, pagamentos);
  const planoEstrategico = gerarPlanoEstrategico(dividas, pagamentos);
  const mesQuitacaoGeral = prioridades.length > 0
    ? prioridades.reduce((maior, x) => {
        if (!x.plano.mesRefFimPrevisto) return maior;
        return !maior || x.plano.mesRefFimPrevisto > maior ? x.plano.mesRefFimPrevisto : maior;
      }, "" as string)
    : "";

  const idPrioridade = new Map(prioridades.map((p, i) => [p.divida.id, i + 1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Dívidas</h1>
        <NovaDividaForm />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard titulo="Saldo devedor total" valor={fmtBRL(saldoTotal)} cor="var(--divida)" />
        <KpiCard titulo="Já pago" valor={fmtBRL(pagoTotal)} cor="var(--receita)" />
        <KpiCard titulo="Quitação total prevista" valor={mesQuitacaoGeral ? mesRefLabel(mesQuitacaoGeral) : "—"} />
      </div>

      {planoEstrategico.passos.length > 0 && (
        <div className="card p-4">
          <p className="label-eyebrow mb-1.5 flex items-center gap-1.5">
            <ListOrdered size={13} /> Plano estratégico de quitação
          </p>
          <p className="text-sm text-[var(--muted)] mb-3">{planoEstrategico.economiaResumo}</p>
          <ol className="flex flex-col gap-2">
            {planoEstrategico.passos.map((p) => (
              <li key={p.credor} className="text-sm border-b border-[var(--border)]/40 pb-2 flex items-start gap-2">
                <span className="num text-[var(--muted)] shrink-0">{p.ordem}.</span>
                <span>
                  <span
                    className={`badge mr-2 ${
                      p.risco === "critico" || p.risco === "alto" ? "text-[var(--danger)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {p.riscoLabel}
                  </span>
                  {p.acao}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {dividas.map((d) => (
          <DividaCard
            key={d.id}
            divida={d}
            plano={calcularPlano(d, pagamentos)}
            prioridade={idPrioridade.get(d.id)}
          />
        ))}
        {dividas.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma dívida cadastrada.</p>}
      </div>
    </div>
  );
}
