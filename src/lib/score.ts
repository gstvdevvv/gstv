type Componente = {
  nome: string;
  nota: number; // 0-100
  peso: number; // soma dos pesos = 1
  explicacao: string;
  recomendacao: string;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function calcularScoreSaude(params: {
  taxaPoupancaPct: number;
  pctFixasPct: number;
  mesesCoberturaReserva: number;
  mesesMetaReserva: number;
  saldoDividasTotal: number;
  receitaAnualTotal: number;
  pctVariaveisPct: number;
}) {
  const {
    taxaPoupancaPct,
    pctFixasPct,
    mesesCoberturaReserva,
    mesesMetaReserva,
    saldoDividasTotal,
    receitaAnualTotal,
    pctVariaveisPct,
  } = params;

  const componentes: Componente[] = [];

  // 1) Taxa de poupança — meta de referência 20%
  const notaPoupanca = clamp((taxaPoupancaPct / 20) * 100);
  componentes.push({
    nome: "Taxa de poupança",
    nota: notaPoupanca,
    peso: 0.25,
    explicacao: `Vocês guardam ${taxaPoupancaPct.toFixed(1)}% da renda. A referência saudável é a partir de 20%.`,
    recomendacao:
      notaPoupanca >= 100
        ? "Taxa de poupança saudável — mantenha o ritmo."
        : "Corte custos fixos ou variáveis para chegar a 20% de poupança da renda.",
  });

  // 2) Comprometimento com custos fixos — referência regra 50/30/20 (até 50%)
  const notaFixas = clamp(100 - Math.max(0, pctFixasPct - 50) * 2);
  componentes.push({
    nome: "Comprometimento com custos fixos",
    nota: notaFixas,
    peso: 0.2,
    explicacao: `Custos fixos consomem ${pctFixasPct.toFixed(1)}% da renda. Acima de 50% reduz a margem de manobra.`,
    recomendacao:
      pctFixasPct > 50
        ? "Renegocie ou reduza despesas fixas (aluguel, financiamentos, assinaturas) — é onde a economia mais se repete."
        : "Nível de custos fixos sob controle.",
  });

  // 3) Reserva de emergência
  const notaReserva = clamp(mesesMetaReserva > 0 ? (mesesCoberturaReserva / mesesMetaReserva) * 100 : 0);
  componentes.push({
    nome: "Reserva de emergência",
    nota: notaReserva,
    peso: 0.25,
    explicacao: `A reserva cobre ${mesesCoberturaReserva.toFixed(1)} de ${mesesMetaReserva} meses de custo fixo.`,
    recomendacao:
      notaReserva < 100
        ? "Priorize aportes na reserva antes de qualquer investimento de risco — ela é o que evita nova dívida numa emergência."
        : "Reserva no nível recomendado.",
  });

  // 4) Endividamento — saldo de dívidas vs renda anual
  const pctDividaRenda = receitaAnualTotal > 0 ? (saldoDividasTotal / receitaAnualTotal) * 100 : 0;
  const notaDivida = clamp(100 - pctDividaRenda * 2);
  componentes.push({
    nome: "Nível de endividamento",
    nota: notaDivida,
    peso: 0.2,
    explicacao: `O saldo total de dívidas equivale a ${pctDividaRenda.toFixed(1)}% da renda anual do casal.`,
    recomendacao:
      pctDividaRenda > 30
        ? "Endividamento alto em relação à renda — concentre esforço em quitar as dívidas antes de novos investimentos de risco."
        : "Nível de endividamento controlado.",
  });

  // 5) Dependência de variáveis/cartão como proxy de impulso de consumo
  const notaVariaveis = clamp(100 - Math.max(0, pctVariaveisPct - 30) * 2);
  componentes.push({
    nome: "Disciplina em gastos variáveis",
    nota: notaVariaveis,
    peso: 0.1,
    explicacao: `Despesas variáveis (lazer, compras, cartão) representam ${pctVariaveisPct.toFixed(1)}% da renda.`,
    recomendacao:
      pctVariaveisPct > 30
        ? "Gastos variáveis acima do recomendado — vale revisar compras por impulso e parcelamentos no cartão."
        : "Gastos variáveis dentro de uma faixa saudável.",
  });

  const notaFinal = componentes.reduce((acc, c) => acc + c.nota * c.peso, 0);

  let classificacao: string;
  if (notaFinal >= 80) classificacao = "Excelente";
  else if (notaFinal >= 60) classificacao = "Boa";
  else if (notaFinal >= 40) classificacao = "Atenção";
  else classificacao = "Crítica";

  return { notaFinal: Math.round(notaFinal), classificacao, componentes };
}
