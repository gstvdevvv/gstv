import { getCurrentHousehold } from "@/lib/household";
import { getMetas, getCategorias, getLancamentosDoAno } from "@/lib/queries";
import { calcularIndicadores } from "@/lib/indicadores";
import { NovaMetaForm } from "./NovaMetaForm";
import { MetaCard } from "./MetaCard";

export default async function MetasPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const ano = new Date().getFullYear();
  const [metas, categorias, lancamentosAno] = await Promise.all([
    getMetas(household.householdId),
    getCategorias(household.householdId),
    getLancamentosDoAno(household.householdId, ano),
  ]);

  const indicadores = calcularIndicadores(lancamentosAno, categorias);
  const capacidadeMensalPoupanca = Math.max(0, (indicadores.receitaTotal - indicadores.despesaTotal) / 12);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">Metas</h1>

      <NovaMetaForm />

      <div className="grid md:grid-cols-2 gap-4">
        {metas.map((m) => (
          <MetaCard key={m.id} meta={m} capacidadeMensalPoupanca={capacidadeMensalPoupanca} />
        ))}
        {metas.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma meta cadastrada ainda.</p>}
      </div>
    </div>
  );
}
