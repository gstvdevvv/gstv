export function fmtBRL(valor: number | null | undefined) {
  const v = valor ?? 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtPct(valor: number | null | undefined) {
  const v = valor ?? 0;
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function mesRefAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function mesRefLabel(mesRef: string) {
  const [ano, mes] = mesRef.split("-").map(Number);
  return `${MESES[mes - 1]} ${ano}`;
}

export function mesRefParaIndice(mesRef: string) {
  const [, mes] = mesRef.split("-").map(Number);
  return mes - 1;
}

export function somaMeses(mesRef: string, qtd: number) {
  const [ano, mes] = mesRef.split("-").map(Number);
  const data = new Date(ano, mes - 1 + qtd, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function listaMesesAno(ano: number) {
  return Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);
}
