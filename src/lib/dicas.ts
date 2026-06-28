import type { Lancamento, Categoria, Divida, PagamentoDivida } from "@/lib/queries";
import { calcularPlano, ordenarPorPrioridade } from "@/lib/planoPagamento";
import { fmtBRL, fmtPct, mesRefParaIndice } from "@/lib/utils";

export type Dica = {
  titulo: string;
  texto: string;
  tipo: "economia" | "divida" | "meta" | "alerta";
};

export function gerarDicas({
  lancamentosAno,
  categorias,
  dividas,
  pagamentos,
  mesRef,
  metaPoupancaPct,
}: {
  lancamentosAno: Lancamento[];
  categorias: Categoria[];
  dividas: Divida[];
  pagamentos: PagamentoDivida[];
  mesRef: string;
  metaPoupancaPct: number;
}): Dica[] {
  const dicas: Dica[] = [];
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const idxMesAtual = mesRefParaIndice(mesRef);
  const ano = Number(mesRef.split("-")[0]);

  const mesesAnteriores = Array.from({ length: idxMesAtual }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);

  function totalCategoriaNoMes(categoriaNome: string, ref: string) {
    return lancamentosAno
      .filter((l) => l.mes_ref === ref && l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.nome === categoriaNome)
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  }

  // 1) categorias variaveis que dispararam vs media dos meses anteriores
  const categoriasVariaveis = categorias.filter((c) => c.tipo === "variavel");
  for (const cat of categoriasVariaveis) {
    if (mesesAnteriores.length < 2) break;
    const valoresAnteriores = mesesAnteriores.map((ref) => totalCategoriaNoMes(cat.nome, ref)).filter((v) => v > 0);
    if (valoresAnteriores.length < 2) continue;
    const media = valoresAnteriores.reduce((a, b) => a + b, 0) / valoresAnteriores.length;
    const atual = totalCategoriaNoMes(cat.nome, mesRef);
    if (media > 0 && atual > media * 1.2) {
      const pctAumento = ((atual - media) / media) * 100;
      dicas.push({
        titulo: `${cat.nome} acima do normal`,
        texto: `Este mês você gastou ${fmtBRL(atual)} em "${cat.nome}", ${fmtPct(pctAumento)} acima da média dos últimos ${valoresAnteriores.length} meses (${fmtBRL(media)}). Vale revisar o que mudou.`,
        tipo: "economia",
      });
    }
  }

  // 2) maior categoria variavel do mes + simulacao de reducao aplicada a divida prioritaria
  const gastosVariaveisMes = categoriasVariaveis
    .map((cat) => ({ cat, valor: totalCategoriaNoMes(cat.nome, mesRef) }))
    .filter((x) => x.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  if (gastosVariaveisMes.length > 0) {
    const lider = gastosVariaveisMes[0];
    const economiaMensal = lider.valor * 0.1;
    const prioridades = ordenarPorPrioridade(dividas, pagamentos);
    const alvo = prioridades.find((p) => Number(p.divida.valor_parcela) > 0);

    if (alvo) {
      const planoAtual = alvo.plano;
      const novaParcela = Number(alvo.divida.valor_parcela) + economiaMensal;
      const novasParcelasRestantes = Math.ceil(planoAtual.saldo / novaParcela);
      const mesesGanhos = planoAtual.parcelasRestantes - novasParcelasRestantes;

      if (mesesGanhos >= 1) {
        dicas.push({
          titulo: `Acelere a quitação de "${alvo.divida.credor}"`,
          texto: `Reduzindo 10% do gasto com "${lider.cat.nome}" (economiza ${fmtBRL(economiaMensal)}/mês) e aplicando esse valor na parcela de "${alvo.divida.credor}", você quita essa dívida aproximadamente ${mesesGanhos} ${mesesGanhos === 1 ? "mês" : "meses"} antes.`,
          tipo: "divida",
        });
      }
    }
  }

  // 3) taxa de poupanca do mes vs meta
  const receitaMes = lancamentosAno
    .filter((l) => l.mes_ref === mesRef && l.tipo === "receita")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  const despesaMes = lancamentosAno
    .filter((l) => l.mes_ref === mesRef && l.tipo === "despesa")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  const percentPoupanca = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes) * 100 : 0;

  if (receitaMes > 0) {
    if (percentPoupanca < metaPoupancaPct) {
      const faltaPct = metaPoupancaPct - percentPoupanca;
      const faltaValor = (faltaPct / 100) * receitaMes;
      dicas.push({
        titulo: "Meta de poupança não atingida",
        texto: `Você poupou ${fmtPct(percentPoupanca)} da renda este mês, abaixo da meta de ${fmtPct(metaPoupancaPct)}. Faltam ${fmtBRL(faltaValor)} para bater a meta — revise as categorias variáveis acima.`,
        tipo: "meta",
      });
    } else {
      dicas.push({
        titulo: "Meta de poupança atingida",
        texto: `Parabéns! Você poupou ${fmtPct(percentPoupanca)} da renda este mês, acima da meta de ${fmtPct(metaPoupancaPct)}.`,
        tipo: "meta",
      });
    }
  }

  // 4) dividas sem negociacao
  const semNegociacao = dividas.filter((d) => {
    const { saldo } = calcularPlano(d, pagamentos);
    return saldo > 0 && (!d.negociacao_texto || d.negociacao_texto.toLowerCase().includes("sem negocia"));
  });
  if (semNegociacao.length > 0) {
    const totalSemNeg = semNegociacao.reduce((acc, d) => acc + calcularPlano(d, pagamentos).saldo, 0);
    dicas.push({
      titulo: "Dívidas sem negociação",
      texto: `${semNegociacao.length} dívida(s) somando ${fmtBRL(totalSemNeg)} ainda não têm negociação (${semNegociacao.map((d) => d.credor).join(", ")}). Negociar parcelamento costuma reduzir juros e aliviar o caixa mensal.`,
      tipo: "alerta",
    });
  }

  return dicas;
}
