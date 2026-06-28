import type { Lancamento, Categoria } from "@/lib/queries";

function val(l: Lancamento) {
  return Number(l.valor_realizado ?? l.valor_previsto ?? 0);
}

function totalPorPalavras(lancs: Lancamento[], categorias: Categoria[], palavras: string[]) {
  const nomesAlvo = new Set(
    categorias
      .filter((c) => palavras.some((p) => c.nome.toLowerCase().includes(p)))
      .map((c) => c.id)
  );
  return lancs.filter((l) => l.tipo === "despesa" && l.categoria_id && nomesAlvo.has(l.categoria_id)).reduce((a, l) => a + val(l), 0);
}

export function calcularIndicadores(lancamentosAno: Lancamento[], categorias: Categoria[]) {
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const receitaTotal = lancamentosAno.filter((l) => l.tipo === "receita").reduce((a, l) => a + val(l), 0);
  const despesaTotal = lancamentosAno.filter((l) => l.tipo === "despesa").reduce((a, l) => a + val(l), 0);
  const fixasTotal = lancamentosAno
    .filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "fixa")
    .reduce((a, l) => a + val(l), 0);
  const variaveisTotal = lancamentosAno
    .filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "variavel")
    .reduce((a, l) => a + val(l), 0);

  const moradia = totalPorPalavras(lancamentosAno, categorias, ["aluguel", "condomínio", "condominio", "energia", "internet"]);
  const alimentacao = totalPorPalavras(lancamentosAno, categorias, ["alimenta", "supermercado"]);
  const lazer = totalPorPalavras(lancamentosAno, categorias, ["lazer", "entreten", "viagem", "viagens"]);

  return {
    receitaTotal,
    despesaTotal,
    fixasTotal,
    variaveisTotal,
    taxaPoupancaPct: receitaTotal > 0 ? ((receitaTotal - despesaTotal) / receitaTotal) * 100 : 0,
    pctFixasPct: receitaTotal > 0 ? (fixasTotal / receitaTotal) * 100 : 0,
    pctVariaveisPct: receitaTotal > 0 ? (variaveisTotal / receitaTotal) * 100 : 0,
    pctMoradiaPct: receitaTotal > 0 ? (moradia / receitaTotal) * 100 : 0,
    pctAlimentacaoPct: receitaTotal > 0 ? (alimentacao / receitaTotal) * 100 : 0,
    pctLazerPct: receitaTotal > 0 ? (lazer / receitaTotal) * 100 : 0,
    despesaFixaMediaMensal: fixasTotal / 12,
  };
}

export function calcularReserva(
  investimentosTodos: { ativo_destino: string; valor_aportado: number | null }[],
  despesaFixaMediaMensal: number,
  mesesMeta: number
) {
  const reservaAtual = investimentosTodos
    .filter((i) => i.ativo_destino.toLowerCase().includes("reserva"))
    .reduce((a, i) => a + Number(i.valor_aportado ?? 0), 0);
  const metaValor = despesaFixaMediaMensal * mesesMeta;
  const mesesCobertura = despesaFixaMediaMensal > 0 ? reservaAtual / despesaFixaMediaMensal : 0;
  const pctMeta = metaValor > 0 ? Math.min(100, (reservaAtual / metaValor) * 100) : 0;

  return { reservaAtual, metaValor, mesesCobertura, mesesMeta, pctMeta };
}

export function detectarCategoriasDuplicadas(categorias: Categoria[]) {
  function normaliza(nome: string) {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter((p) => p.length > 3)
      .sort()
      .slice(0, 2)
      .join(" ");
  }

  const grupos = new Map<string, Categoria[]>();
  for (const cat of categorias) {
    const chave = `${cat.tipo}:${normaliza(cat.nome)}`;
    if (!chave.split(":")[1]) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(cat);
  }

  return Array.from(grupos.values()).filter((g) => g.length > 1);
}
