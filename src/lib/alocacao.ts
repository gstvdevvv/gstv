export type PerfilRisco = "conservador" | "moderado" | "arrojado";

export type ClasseAlocacao = {
  classe: string;
  percentual: number;
  explicacao: string;
};

export function sugerirAlocacao(perfil: PerfilRisco, reservaCompleta: boolean): ClasseAlocacao[] {
  if (!reservaCompleta) {
    return [
      {
        classe: "Reserva de emergência (Tesouro Selic / CDB liquidez diária)",
        percentual: 100,
        explicacao:
          "A reserva ainda não atingiu a meta de meses de custo fixo. Priorize 100% dos aportes nela antes de qualquer investimento de risco — é o que evita nova dívida numa emergência.",
      },
    ];
  }

  const TABELA: Record<PerfilRisco, ClasseAlocacao[]> = {
    conservador: [
      { classe: "Tesouro Selic / CDB / LCI/LCA", percentual: 60, explicacao: "Baixo risco, liquidez alta — base de segurança." },
      { classe: "Tesouro IPCA+", percentual: 20, explicacao: "Protege o poder de compra no longo prazo com risco baixo." },
      { classe: "Fundos Imobiliários (FIIs)", percentual: 15, explicacao: "Renda passiva mensal, risco moderado." },
      { classe: "Ações / ETFs", percentual: 5, explicacao: "Exposição pequena a renda variável para não perder rentabilidade no longo prazo." },
    ],
    moderado: [
      { classe: "Tesouro Selic / CDB / LCI/LCA", percentual: 35, explicacao: "Liquidez e segurança para o curto prazo." },
      { classe: "Tesouro IPCA+", percentual: 20, explicacao: "Proteção contra inflação para objetivos de médio/longo prazo." },
      { classe: "Fundos Imobiliários (FIIs)", percentual: 20, explicacao: "Renda passiva e diversificação em imóveis sem precisar comprar um." },
      { classe: "Ações / ETFs", percentual: 20, explicacao: "Crescimento de patrimônio no longo prazo, com volatilidade maior." },
      { classe: "Previdência Privada", percentual: 5, explicacao: "Complementa a aposentadoria com benefício tributário de longo prazo." },
    ],
    arrojado: [
      { classe: "Tesouro Selic / CDB / LCI/LCA", percentual: 15, explicacao: "Apenas o necessário para liquidez de curto prazo." },
      { classe: "Tesouro IPCA+", percentual: 15, explicacao: "Proteção parcial contra inflação." },
      { classe: "Fundos Imobiliários (FIIs)", percentual: 20, explicacao: "Renda passiva e diversificação." },
      { classe: "Ações / ETFs", percentual: 40, explicacao: "Maior exposição a renda variável visando crescimento patrimonial no longo prazo." },
      { classe: "Criptoativos", percentual: 10, explicacao: "Alta volatilidade — só faz sentido como pequena parcela especulativa, nunca a maior parte da carteira." },
    ],
  };

  return TABELA[perfil];
}
