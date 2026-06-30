import { createClient } from "@/lib/supabase/server";
import { listaMesesAno } from "@/lib/utils";

export type Categoria = {
  id: string;
  tipo: "receita" | "fixa" | "variavel" | "investimento";
  nome: string;
  limite_padrao: number | null;
};

export type Lancamento = {
  id: string;
  categoria_id: string | null;
  tipo: "receita" | "despesa";
  descricao: string;
  valor_previsto: number | null;
  valor_realizado: number | null;
  data: string;
  mes_ref: string;
  forma_pagamento: string | null;
  cartao_id: string | null;
  recorrente: boolean;
};

export async function getCategorias(householdId: string): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, tipo, nome, limite_padrao")
    .eq("household_id", householdId)
    .order("nome");
  return data ?? [];
}

export async function getLancamentosDoMes(householdId: string, mesRef: string): Promise<Lancamento[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("household_id", householdId)
    .eq("mes_ref", mesRef)
    .order("data");
  return data ?? [];
}

export async function getLancamentosDoAno(householdId: string, ano: number): Promise<Lancamento[]> {
  const supabase = await createClient();
  const meses = listaMesesAno(ano);
  const { data } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("household_id", householdId)
    .in("mes_ref", meses);
  return data ?? [];
}

export type Divida = {
  id: string;
  credor: string;
  valor_total: number;
  negociacao_texto: string | null;
  parcelas_qtd: number | null;
  valor_parcela: number | null;
  data_primeira_parcela: string | null;
  status: "ativa" | "negociando" | "paga";
};

export type PagamentoDivida = {
  id: string;
  divida_id: string;
  valor: number;
  data: string;
  mes_ref: string;
};

export async function getDividas(householdId: string): Promise<Divida[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dividas")
    .select("*")
    .eq("household_id", householdId)
    .order("valor_total", { ascending: false });
  return data ?? [];
}

export async function getPagamentosDivida(householdId: string): Promise<PagamentoDivida[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pagamentos_divida")
    .select("*")
    .eq("household_id", householdId)
    .order("data");
  return data ?? [];
}

export type Investimento = {
  id: string;
  ativo_destino: string;
  mes_ref: string;
  valor_planejado: number | null;
  valor_aportado: number | null;
};

export async function getInvestimentosDoAno(householdId: string, ano: number): Promise<Investimento[]> {
  const supabase = await createClient();
  const meses = listaMesesAno(ano);
  const { data } = await supabase
    .from("investimentos")
    .select("*")
    .eq("household_id", householdId)
    .in("mes_ref", meses);
  return data ?? [];
}

export type Cartao = {
  id: string;
  nome: string;
  bandeira: string | null;
  limite: number | null;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
};

export async function getCartoes(householdId: string): Promise<Cartao[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cartoes")
    .select("*")
    .eq("household_id", householdId)
    .order("nome");
  return data ?? [];
}

export type GastoCartao = {
  id: string;
  cartao_id: string;
  descricao: string;
  categoria_id: string | null;
  valor_total: number;
  parcelas: number;
  parcela_atual: number;
  data_compra: string;
  fatura_mes_ref: string;
};

export async function getGastosCartaoDoMes(householdId: string, mesRef: string): Promise<GastoCartao[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gastos_cartao")
    .select("*")
    .eq("household_id", householdId)
    .eq("fatura_mes_ref", mesRef)
    .order("data_compra");
  return data ?? [];
}

export type Meta = {
  id: string;
  nome: string;
  categoria: string;
  valor_alvo: number;
  valor_atual: number;
  prazo: string | null;
};

export async function getMetas(householdId: string): Promise<Meta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metas")
    .select("*")
    .eq("household_id", householdId)
    .order("prazo", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function getConfig(householdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config")
    .select("*")
    .eq("household_id", householdId)
    .maybeSingle();
  return {
    meta_poupanca_pct: 20,
    alerta_limite_pct: 90,
    meses_reserva_meta: 6,
    ...data,
  };
}

export function saldoDivida(divida: Divida, pagamentos: PagamentoDivida[]) {
  const pago = pagamentos
    .filter((p) => p.divida_id === divida.id)
    .reduce((acc, p) => acc + Number(p.valor), 0);
  return { pago, saldo: Number(divida.valor_total) - pago };
}

export function resumoMes(lancamentos: Lancamento[]) {
  const receita = lancamentos
    .filter((l) => l.tipo === "receita")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  const despesas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  return { receita, despesas, saldo: receita - despesas };
}
