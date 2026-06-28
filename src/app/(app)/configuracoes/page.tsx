import { getCurrentHousehold } from "@/lib/household";
import { getCategorias, getConfig } from "@/lib/queries";
import { fmtBRL } from "@/lib/utils";
import { CategoriaForm } from "./CategoriaForm";
import { excluirCategoria, atualizarMetas } from "./actions";

const LABEL_TIPO: Record<string, string> = {
  receita: "Receitas",
  fixa: "Despesas Fixas",
  variavel: "Despesas Variáveis",
  investimento: "Investimentos",
};

export default async function ConfiguracoesPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  let categorias: Awaited<ReturnType<typeof getCategorias>> = [];
  let config: Awaited<ReturnType<typeof getConfig>> = { meta_poupanca_pct: 20, alerta_limite_pct: 90 };
  try {
    [categorias, config] = await Promise.all([
      getCategorias(household.householdId),
      getConfig(household.householdId),
    ]);
  } catch (err) {
    return (
      <pre className="card p-4 text-xs text-[var(--danger)] whitespace-pre-wrap">
        DEBUG ConfiguracoesPage: {err instanceof Error ? `${err.message}\n${err.stack}` : String(err)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="card p-4">
        <p className="font-semibold mb-1">Household</p>
        <p className="text-sm text-[var(--muted)]">
          {household.nome} — você está logado como {household.userEmail} ({household.papel})
        </p>
        <p className="text-xs text-[var(--muted)] mt-2">
          Para adicionar outro membro, crie o usuário em Authentication &gt; Users no painel do Supabase e vincule-o
          na tabela <code>usuarios_household</code> com este <code>household_id</code>.
        </p>
      </div>

      <div className="card p-4">
        <p className="font-semibold mb-3">Metas</p>
        <form action={atualizarMetas} className="grid grid-cols-2 gap-3 max-w-md">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Meta de poupança (%)</label>
            <input name="meta_poupanca_pct" type="number" step="0.1" className="input" defaultValue={config.meta_poupanca_pct} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Alerta de limite (%)</label>
            <input name="alerta_limite_pct" type="number" step="0.1" className="input" defaultValue={config.alerta_limite_pct} />
          </div>
          <button type="submit" className="btn-primary col-span-2 w-fit">Salvar metas</button>
        </form>
      </div>

      <div className="card p-4">
        <p className="font-semibold mb-3">Categorias</p>
        <CategoriaForm />

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {(["receita", "fixa", "variavel", "investimento"] as const).map((tipo) => (
            <div key={tipo}>
              <p className="text-sm font-semibold text-[var(--muted)] mb-1">{LABEL_TIPO[tipo]}</p>
              <ul className="flex flex-col gap-1">
                {categorias.filter((c) => c.tipo === tipo).map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm border-b border-[var(--border)]/40 py-1">
                    <span>{c.nome}{c.limite_padrao ? ` — limite ${fmtBRL(c.limite_padrao)}` : ""}</span>
                    <form action={async () => { await excluirCategoria(c.id); }}>
                      <button className="text-xs text-[var(--danger)] hover:underline">excluir</button>
                    </form>
                  </li>
                ))}
                {categorias.filter((c) => c.tipo === tipo).length === 0 && (
                  <li className="text-sm text-[var(--muted)]">Nenhuma categoria.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
