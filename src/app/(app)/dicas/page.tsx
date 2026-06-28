import { getCurrentHousehold } from "@/lib/household";
import { getCategorias, getLancamentosDoAno, getDividas, getPagamentosDivida, getConfig } from "@/lib/queries";
import { gerarDicas, type Dica } from "@/lib/dicas";
import { mesRefAtual, MESES, mesRefParaIndice } from "@/lib/utils";

const ICONES: Record<Dica["tipo"], string> = {
  economia: "💡",
  divida: "📉",
  meta: "🎯",
  alerta: "🔔",
};

const CORES: Record<Dica["tipo"], string> = {
  economia: "var(--accent)",
  divida: "var(--divida)",
  meta: "var(--invest)",
  alerta: "var(--danger)",
};

export default async function DicasPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const mesRef = mesRefAtual();
  const ano = Number(mesRef.split("-")[0]);

  const [categorias, lancamentosAno, dividas, pagamentos, config] = await Promise.all([
    getCategorias(household.householdId),
    getLancamentosDoAno(household.householdId, ano),
    getDividas(household.householdId),
    getPagamentosDivida(household.householdId),
    getConfig(household.householdId),
  ]);

  const dicas = gerarDicas({
    lancamentosAno,
    categorias,
    dividas,
    pagamentos,
    mesRef,
    metaPoupancaPct: Number(config.meta_poupanca_pct),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">💡 Dicas inteligentes</h1>
        <p className="text-sm text-[var(--muted)]">
          Geradas automaticamente a partir dos seus próprios dados de {MESES[mesRefParaIndice(mesRef)]}.
        </p>
      </div>

      {dicas.length === 0 ? (
        <p className="card p-6 text-sm text-[var(--muted)]">
          Ainda não há dados suficientes este mês para gerar dicas. Lance suas receitas e despesas em{" "}
          <a href="/lancamentos" className="underline">Lançamentos</a>.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {dicas.map((d, i) => (
            <div key={i} className="card p-4 flex flex-col gap-1">
              <p className="font-semibold flex items-center gap-2" style={{ color: CORES[d.tipo] }}>
                {ICONES[d.tipo]} {d.titulo}
              </p>
              <p className="text-sm text-[var(--muted)]">{d.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
