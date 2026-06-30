import type { CofrinhoMovimento } from "@/lib/queries";

export function saldoCofrinho(cofrinhoId: string, movimentos: CofrinhoMovimento[]) {
  return movimentos
    .filter((m) => m.cofrinho_id === cofrinhoId)
    .reduce((acc, m) => acc + (m.tipo === "entrada" ? Number(m.valor) : -Number(m.valor)), 0);
}
