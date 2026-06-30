import { getCurrentHousehold } from "@/lib/household";
import { getCofrinhos, getMovimentosCofrinhos } from "@/lib/queries";
import { saldoCofrinho } from "@/lib/cofrinhos";
import { fmtBRL } from "@/lib/utils";
import { NovoCofrinhoForm } from "./NovoCofrinhoForm";
import { CofrinhoCard } from "./CofrinhoCard";
import { KpiCard } from "@/components/KpiCard";
import { PiggyBank } from "lucide-react";

export default async function CofrinhosPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const [cofrinhos, movimentos] = await Promise.all([
    getCofrinhos(household.householdId),
    getMovimentosCofrinhos(household.householdId),
  ]);

  const saldoTotal = cofrinhos.reduce((acc, c) => acc + saldoCofrinho(c.id, movimentos), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">Cofrinhos</h1>
      <p className="text-sm text-[var(--muted)] -mt-4">
        Reservas separadas por finalidade (combustível, reserva de emergência, etc). Ao lançar uma despesa, você pode
        descontar o valor de um cofrinho em vez de registrar como gasto novo.
      </p>

      <KpiCard titulo="Total guardado nos cofrinhos" valor={fmtBRL(saldoTotal)} cor="var(--receita)" Icon={PiggyBank} />

      <NovoCofrinhoForm />

      <div className="grid md:grid-cols-3 gap-4">
        {cofrinhos.map((c) => (
          <CofrinhoCard key={c.id} cofrinho={c} saldo={saldoCofrinho(c.id, movimentos)} />
        ))}
        {cofrinhos.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum cofrinho criado ainda.</p>}
      </div>
    </div>
  );
}
