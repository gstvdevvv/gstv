import type { Lancamento } from "@/lib/queries";
import { mesRefParaIndice } from "@/lib/utils";

export function calcularSequenciaPoupanca(lancamentosAno: Lancamento[], mesRefAtual: string, metaPoupancaPct: number) {
  const ano = Number(mesRefAtual.split("-")[0]);
  const idxAtual = mesRefParaIndice(mesRefAtual);

  let sequencia = 0;
  for (let idx = idxAtual; idx >= 0; idx--) {
    const ref = `${ano}-${String(idx + 1).padStart(2, "0")}`;
    const doMes = lancamentosAno.filter((l) => l.mes_ref === ref);
    const receita = doMes.filter((l) => l.tipo === "receita").reduce((a, l) => a + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    const despesa = doMes.filter((l) => l.tipo === "despesa").reduce((a, l) => a + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    if (receita <= 0) break;
    const pct = ((receita - despesa) / receita) * 100;
    if (pct < metaPoupancaPct) break;
    sequencia++;
  }

  return sequencia;
}
