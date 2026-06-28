import { getCurrentHousehold } from "@/lib/household";
import { getCategorias, getConfig } from "@/lib/queries";
import { fmtBRL } from "@/lib/utils";
import { detectarCategoriasDuplicadas } from "@/lib/indicadores";
import { CategoriaForm } from "./CategoriaForm";
import { excluirCategoria, atualizarMetas } from "./actions";
import { AlertTriangle } from "lucide-react";

const LABEL_TIPO: Record<string, string> = {
  receita: "Receitas",
  fixa: "Despesas Fixas",
  variavel: "Despesas Variáveis",
  investimento: "Investimentos",
};

export default async function ConfiguracoesPage() {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const [categorias, config] = await Promise.all([
    getCategorias(household.householdId),
    getConfig(household.householdId),
  ]);
  const categoriasDuplicadas = detectarCategoriasDuplicadas(categorias);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">Configurações</h1>

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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Meta de reserva (meses de custo fixo)</label>
            <input name="meses_reserva_meta" type="number" step="1" className="input" defaultValue={config.meses_reserva_meta} />
          </div>
          <button type="submit" className="btn-primary col-span-2 w-fit">Salvar metas</button>
        </form>
      </div>

      {categoriasDuplicadas.length > 0 && (
        <div className="card p-4 border-[var(--danger)]/40">
          <p className="font-semibold mb-3 flex items-center gap-2 text-[var(--danger)]">
            <AlertTriangle size={16} /> Categorias possivelmente duplicadas
          </p>
          <p className="text-sm text-[var(--muted)] mb-3">
            Estas categorias parecem representar a mesma coisa. Considere unificá-las para indicadores mais precisos.
          </p>
          <ul className="flex flex-col gap-2">
            {categoriasDuplicadas.map((grupo, i) => (
              <li key={i} className="text-sm border-b border-[var(--border)]/40 pb-2">
                <span className="text-xs uppercase text-[var(--muted)] mr-2">{LABEL_TIPO[grupo[0].tipo]}</span>
                {grupo.map((c) => c.nome).join("  •  ")}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                    <form action={excluirCategoria.bind(null, c.id)}>
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
