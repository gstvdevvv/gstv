const ANOS_PROJECAO = [1, 5, 10, 20];
const TAXA_REAL_ANUAL_PADRAO = 0.06; // referência conservadora pós-inflação, ajustável

export function projetarFluxoCaixa(saldoMedioMensal: number) {
  return ANOS_PROJECAO.map((anos) => ({
    anos,
    acumulado: saldoMedioMensal * 12 * anos,
  }));
}

export function projetarPatrimonio(
  patrimonioAtual: number,
  aporteMensal: number,
  taxaAnual: number = TAXA_REAL_ANUAL_PADRAO
) {
  const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

  return ANOS_PROJECAO.map((anos) => {
    const meses = anos * 12;
    const valorFuturoAtual = patrimonioAtual * Math.pow(1 + taxaMensal, meses);
    const valorFuturoAportes =
      taxaMensal > 0 ? aporteMensal * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal) : aporteMensal * meses;
    return { anos, patrimonioProjetado: valorFuturoAtual + valorFuturoAportes };
  });
}
