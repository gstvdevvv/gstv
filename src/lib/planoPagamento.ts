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

export function ordenarPorPrioridade(dividas: Divida[], pagamentos: PagamentoDivida[]) {
  return [...dividas]
    .map((d) => ({ divida: d, plano: calcularPlano(d, pagamentos) }))
    .filter((x) => x.plano.saldo > 0)
    .sort((a, b) => {
      const semNegA = !a.divida.negociacao_texto || a.divida.negociacao_texto.toLowerCase().includes("sem negocia");
      const semNegB = !b.divida.negociacao_texto || b.divida.negociacao_texto.toLowerCase().includes("sem negocia");
      if (semNegA !== semNegB) return semNegA ? -1 : 1;
      return a.plano.saldo - b.plano.saldo;
    });
}
