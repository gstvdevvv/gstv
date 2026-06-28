import { getCurrentHousehold } from "@/lib/household";
import { getDividas, getPagamentosDivida } from "@/lib/queries";
import { calcularPlano, ordenarPorPrioridade } from "@/lib/planoPagamento";
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

      {prioridades.length > 0 && (
        <div className="card p-4">
          <p className="label-eyebrow mb-1.5 flex items-center gap-1.5">
            <ListOrdered size={13} /> Ordem sugerida de pagamento
          </p>
          <p className="text-sm text-[var(--muted)]">
            Prioriza dívidas sem negociação e, entre as negociadas, as de menor saldo primeiro (método bola de neve) —
            quita mais rápido e libera fôlego no orçamento.
          </p>
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
