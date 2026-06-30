import type { Divida, PagamentoDivida } from "@/lib/queries";
import { somaMeses, mesRefAtual } from "@/lib/utils";

export type PlanoPagamento = {
  pago: number;
  saldo: number;
  percentualPago: number;
  parcelasRestantes: number;
  mesRefFimPrevisto: string | null;
};

export function calcularPlano(divida: Divida, pagamentos: PagamentoDivida[]): PlanoPagamento {
  const pago = pagamentos
    .filter((p) => p.divida_id === divida.id)
    .reduce((acc, p) => acc + Number(p.valor), 0);
  const valorTotal = Number(divida.valor_total);
  const saldo = Math.max(0, valorTotal - pago);
  const percentualPago = valorTotal > 0 ? (pago / valorTotal) * 100 : 0;

  const valorParcela = Number(divida.valor_parcela || 0);
  if (saldo <= 0) {
    return { pago, saldo: 0, percentualPago: 100, parcelasRestantes: 0, mesRefFimPrevisto: null };
  }
  if (!valorParcela) {
    return { pago, saldo, percentualPago, parcelasRestantes: 0, mesRefFimPrevisto: null };
  }

  const parcelasRestantes = Math.ceil(saldo / valorParcela);
  const mesRefFimPrevisto = somaMeses(mesRefAtual(), Math.max(0, parcelasRestantes - 1));

  return { pago, saldo, percentualPago, parcelasRestantes, mesRefFimPrevisto };
}

export type Risco = "critico" | "alto" | "medio" | "baixo";

export function classificarRisco(divida: Divida, plano: PlanoPagamento): Risco {
  if (plano.saldo <= 0) return "baixo";
  const semNegociacao = !divida.negociacao_texto || divida.negociacao_texto.toLowerCase().includes("sem negocia");
  if (semNegociacao && plano.saldo > 0) return "critico";
  if (divida.status === "negociando" && plano.percentualPago < 20) return "alto";
  if (plano.percentualPago < 50) return "medio";
  return "baixo";
}

const LABEL_RISCO: Record<Risco, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

export function ordenarPorPrioridade(dividas: Divida[], pagamentos: PagamentoDivida[]) {
  return [...dividas]
    .map((d) => ({ divida: d, plano: calcularPlano(d, pagamentos) }))
    .filter((x) => x.plano.saldo > 0)
    .map((x) => ({ ...x, risco: classificarRisco(x.divida, x.plano) }))
    .sort((a, b) => {
      const ordemRisco: Record<Risco, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 };
      if (ordemRisco[a.risco] !== ordemRisco[b.risco]) return ordemRisco[a.risco] - ordemRisco[b.risco];
      return a.plano.saldo - b.plano.saldo;
    });
}

export function gerarPlanoEstrategico(dividas: Divida[], pagamentos: PagamentoDivida[]) {
  const prioridades = ordenarPorPrioridade(dividas, pagamentos);
  if (prioridades.length === 0) {
    return { passos: [], economiaResumo: "Sem dívidas em aberto — nenhuma estratégia necessária." };
  }

  const passos = prioridades.map((p, i) => {
    const acao = !p.divida.negociacao_texto || p.divida.negociacao_texto.toLowerCase().includes("sem negocia")
      ? `Negocie e parcele "${p.divida.credor}" o quanto antes — sem acordo, o risco de juros/protesto aumenta.`
      : `Concentre o pagamento extra em "${p.divida.credor}" (saldo ${LABEL_RISCO[p.risco].toLowerCase()}) até quitar, depois siga para a próxima.`;
    return {
      ordem: i + 1,
      credor: p.divida.credor,
      saldo: p.plano.saldo,
      risco: p.risco,
      riscoLabel: LABEL_RISCO[p.risco],
      acao,
    };
  });

  const economiaResumo =
    "Estratégia: bola de neve por risco — primeiro dívidas sem negociação (risco de juros/protesto), depois as de menor saldo. " +
    "Quitar a primeira da lista libera o valor da parcela para acelerar a próxima, reduzindo o tempo total de endividamento.";

  return { passos, economiaResumo };
}
