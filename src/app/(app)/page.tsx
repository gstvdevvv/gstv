import { getCurrentHousehold } from "@/lib/household";
import {
  getCategorias,
  getLancamentosDoAno,
  getDividas,
  getPagamentosDivida,
  getInvestimentosDoAno,
  getConfig,
  saldoDivida,
} from "@/lib/queries";
import { fmtBRL, fmtPct, MESES, mesRefAtual, mesRefParaIndice } from "@/lib/utils";
import { KpiCard } from "@/components/KpiCard";
import { EvolucaoMensalChart, type PontoMensal } from "@/components/charts/EvolucaoMensalChart";
import { CategoriaBarChart, type PontoCategoria } from "@/components/charts/CategoriaBarChart";
import { calcularIndicadores, calcularReserva } from "@/lib/indicadores";
import { calcularScoreSaude } from "@/lib/score";
import { calcularSequenciaPoupanca } from "@/lib/sequencia";
import { MesSelector } from "@/components/MesSelector";
import { BellRing, ShieldCheck, Gauge, HeartPulse, Flame, Wallet, TrendingDown, Scale, PiggyBank, CreditCard } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const household = await getCurrentHousehold();
  if (!household) return null;

  const { mes } = await searchParams;
  const mesSel = mes || mesRefAtual();
  const ano = Number(mesSel.split("-")[0]);
  const idxMesSel = mesRefParaIndice(mesSel);
  const ehMesAtual = mesSel === mesRefAtual();

  const [categorias, lancamentosAno, dividas, pagamentos, investimentosAno, config] = await Promise.all([
    getCategorias(household.householdId),
    getLancamentosDoAno(household.householdId, ano),
    getDividas(household.householdId),
    getPagamentosDivida(household.householdId),
    getInvestimentosDoAno(household.householdId, ano),
    getConfig(household.householdId),
  ]);

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const lancamentosMesAtual = lancamentosAno.filter((l) => l.mes_ref === mesSel);

  const receitaMes = lancamentosMesAtual
    .filter((l) => l.tipo === "receita")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  const despesaMes = lancamentosMesAtual
    .filter((l) => l.tipo === "despesa")
    .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
  const saldoMes = receitaMes - despesaMes;

  const investidoMes = investimentosAno
    .filter((i) => i.mes_ref === mesSel)
    .reduce((acc, i) => acc + Number(i.valor_aportado ?? 0), 0);

  const dividasAbertas = dividas.filter((d) => d.status !== "paga");
  const saldoDividasTotal = dividasAbertas.reduce((acc, d) => acc + saldoDivida(d, pagamentos).saldo, 0);

  const percentPoupanca = receitaMes > 0 ? (saldoMes / receitaMes) * 100 : 0;

  // evolucao mensal (jan-dez do ano atual)
  const evolucao: PontoMensal[] = MESES.map((nomeMes, idx) => {
    const mesRef = `${ano}-${String(idx + 1).padStart(2, "0")}`;
    const doMes = lancamentosAno.filter((l) => l.mes_ref === mesRef);
    const receita = doMes
      .filter((l) => l.tipo === "receita")
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    const despesa = doMes
      .filter((l) => l.tipo === "despesa")
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    return { mes: nomeMes.slice(0, 3), receita, despesa, saldo: receita - despesa };
  });

  // despesas por categoria no mes atual
  const porCategoria = new Map<string, number>();
  for (const l of lancamentosMesAtual) {
    if (l.tipo !== "despesa") continue;
    const cat = l.categoria_id ? categoriaPorId.get(l.categoria_id) : null;
    const nome = cat?.nome ?? "Outras";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + Number(l.valor_realizado ?? l.valor_previsto ?? 0));
  }
  const categoriaDados: PontoCategoria[] = Array.from(porCategoria.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // custos fixos do mes, por categoria (para o card de analise e alertas)
  const fixosPorCategoria = new Map<string, number>();
  for (const l of lancamentosMesAtual) {
    if (l.tipo !== "despesa") continue;
    const cat = l.categoria_id ? categoriaPorId.get(l.categoria_id) : null;
    if (cat?.tipo !== "fixa") continue;
    fixosPorCategoria.set(cat.nome, (fixosPorCategoria.get(cat.nome) ?? 0) + Number(l.valor_realizado ?? l.valor_previsto ?? 0));
  }
  const fixosDados = Array.from(fixosPorCategoria.entries())
    .map(([categoria, valor]) => ({ categoria, valor, pctRenda: receitaMes > 0 ? (valor / receitaMes) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);
  const totalFixoMes = fixosDados.reduce((acc, x) => acc + x.valor, 0);
  const pctFixoRenda = receitaMes > 0 ? (totalFixoMes / receitaMes) * 100 : 0;

  // indicadores fixos do ano + reserva de emergencia
  const indicadores = calcularIndicadores(lancamentosAno, categorias);
  const reserva = calcularReserva(investimentosAno, indicadores.despesaFixaMediaMensal, config.meses_reserva_meta);
  const score = calcularScoreSaude({
    taxaPoupancaPct: indicadores.taxaPoupancaPct,
    pctFixasPct: indicadores.pctFixasPct,
    mesesCoberturaReserva: reserva.mesesCobertura,
    mesesMetaReserva: reserva.mesesMeta,
    saldoDividasTotal,
    receitaAnualTotal: indicadores.receitaTotal,
    pctVariaveisPct: indicadores.pctVariaveisPct,
  });
  const sequenciaPoupanca = calcularSequenciaPoupanca(lancamentosAno, mesRefAtual(), config.meta_poupanca_pct);

  // alertas
  const alertas: { texto: string; tipo: "alerta" | "info" }[] = [];

  if (receitaMes > 0 && pctFixoRenda > 50) {
    alertas.push({
      texto: `Custos fixos consomem ${fmtPct(pctFixoRenda)} da renda do mês (recomendado: até 50%). Maior item: "${fixosDados[0]?.categoria}" (${fmtBRL(fixosDados[0]?.valor ?? 0)}).`,
      tipo: "alerta",
    });
  }

  for (const cat of categorias.filter((c) => c.tipo === "variavel" && c.limite_padrao)) {
    const gasto = porCategoria.get(cat.nome) ?? 0;
    const limite = Number(cat.limite_padrao);
    const pct = (gasto / limite) * 100;
    if (pct >= config.alerta_limite_pct) {
      alertas.push({
        texto: `"${cat.nome}" já consumiu ${fmtPct(pct)} do limite de ${fmtBRL(limite)} este mês.`,
        tipo: "alerta",
      });
    }
  }

  if (receitaMes > 0 && percentPoupanca < config.meta_poupanca_pct) {
    alertas.push({
      texto: `Sua taxa de poupança este mês está em ${fmtPct(percentPoupanca)}, abaixo da meta de ${fmtPct(config.meta_poupanca_pct)}.`,
      tipo: "alerta",
    });
  }

  if (indicadores.despesaFixaMediaMensal > 0 && reserva.mesesCobertura < reserva.mesesMeta) {
    alertas.push({
      texto: `Reserva de emergência cobre ${reserva.mesesCobertura.toFixed(1)} meses de custo fixo, abaixo da meta de ${reserva.mesesMeta} meses.`,
      tipo: reserva.mesesCobertura < reserva.mesesMeta / 2 ? "alerta" : "info",
    });
  }

  const maiorDividaSemNegociacao = dividasAbertas
    .filter((d) => !d.negociacao_texto || d.negociacao_texto.toLowerCase().includes("sem negocia"))
    .sort((a, b) => saldoDivida(b, pagamentos).saldo - saldoDivida(a, pagamentos).saldo)[0];
  if (maiorDividaSemNegociacao) {
    const { saldo } = saldoDivida(maiorDividaSemNegociacao, pagamentos);
    if (saldo > 0) {
      alertas.push({
        texto: `A dívida com "${maiorDividaSemNegociacao.credor}" (${fmtBRL(saldo)}) ainda não tem negociação — considere parcelar.`,
        tipo: "info",
      });
    }
  }

  // resumo anual (tabela)
  const resumoAnual = MESES.map((nomeMes, idx) => {
    const mesRef = `${ano}-${String(idx + 1).padStart(2, "0")}`;
    const doMes = lancamentosAno.filter((l) => l.mes_ref === mesRef);
    const receita = doMes
      .filter((l) => l.tipo === "receita")
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    const fixas = doMes
      .filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "fixa")
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    const variaveis = doMes
      .filter((l) => l.tipo === "despesa" && categoriaPorId.get(l.categoria_id ?? "")?.tipo === "variavel")
      .reduce((acc, l) => acc + Number(l.valor_realizado ?? l.valor_previsto ?? 0), 0);
    const dividasPagasNoMes = pagamentos
      .filter((p) => p.mes_ref === mesRef)
      .reduce((acc, p) => acc + Number(p.valor), 0);
    const investido = investimentosAno
      .filter((i) => i.mes_ref === mesRef)
      .reduce((acc, i) => acc + Number(i.valor_aportado ?? 0), 0);
    const saldo = receita - fixas - variaveis - dividasPagasNoMes - investido;
    const poupanca = receita > 0 ? (saldo / receita) * 100 : 0;
    return { mes: nomeMes, receita, fixas, variaveis, dividas: dividasPagasNoMes, investido, saldo, poupanca, idx };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">{MESES[idxMesSel]} {ano}</h1>
          <p className="text-sm text-[var(--muted)]">
            Visão geral das finanças do casal{!ehMesAtual && " — visualizando mês anterior/futuro"}
          </p>
        </div>
        <MesSelector mesRef={mesSel} />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label-eyebrow flex items-center gap-1.5">
            <HeartPulse size={13} /> Score de saúde financeira
          </p>
          <div className="flex items-center gap-3">
            {sequenciaPoupanca > 0 && (
              <span className="badge flex items-center gap-1 text-[var(--primary)]">
                <Flame size={13} /> {sequenciaPoupanca} {sequenciaPoupanca === 1 ? "mês" : "meses"} batendo a meta
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display num">{score.notaFinal}</span>
              <span className="text-sm text-[var(--muted)]">/100 · {score.classificacao}</span>
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden mb-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${score.notaFinal}%`,
              background: score.notaFinal >= 60 ? "var(--receita)" : score.notaFinal >= 40 ? "var(--primary)" : "var(--danger)",
            }}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {score.componentes.map((c) => (
            <div key={c.nome} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{c.nome}</span>
                <span className="num text-[var(--muted)]">{Math.round(c.nota)}/100</span>
              </div>
              <p className="text-xs text-[var(--muted)]">{c.explicacao}</p>
              <p className="text-xs text-[var(--muted)] italic mt-0.5">{c.recomendacao}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard titulo="Receita do mês" valor={fmtBRL(receitaMes)} cor="var(--receita)" Icon={Wallet} />
        <KpiCard titulo="Gastos do mês" valor={fmtBRL(despesaMes)} cor="var(--despesa)" Icon={CreditCard} />
        <KpiCard
          titulo="Saldo do mês"
          valor={fmtBRL(saldoMes)}
          cor={saldoMes >= 0 ? "var(--receita)" : "var(--despesa)"}
          sub={fmtPct(percentPoupanca) + " poupado"}
          Icon={Scale}
        />
        <KpiCard titulo="Investido no mês" valor={fmtBRL(investidoMes)} cor="var(--invest)" Icon={PiggyBank} />
        <KpiCard titulo="Dívidas em aberto" valor={fmtBRL(saldoDividasTotal)} cor="var(--divida)" Icon={TrendingDown} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="label-eyebrow mb-3 flex items-center gap-1.5">
            <ShieldCheck size={13} /> Reserva de emergência
          </p>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-lg font-semibold num">{fmtBRL(reserva.reservaAtual)}</span>
            <span className="text-sm text-[var(--muted)] num">meta {fmtBRL(reserva.metaValor)}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${reserva.pctMeta}%`, background: reserva.pctMeta >= 100 ? "var(--receita)" : "var(--primary)" }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            {reserva.mesesCobertura.toFixed(1)} de {reserva.mesesMeta} meses de custo fixo cobertos ({fmtPct(reserva.pctMeta)} da meta).
          </p>
        </div>

        <div className="card p-4">
          <p className="label-eyebrow mb-3 flex items-center gap-1.5">
            <Gauge size={13} /> Indicadores do ano
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--muted)]">Taxa de poupança</p>
              <p className="num font-semibold">{fmtPct(indicadores.taxaPoupancaPct)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Custos fixos / renda</p>
              <p className="num font-semibold">{fmtPct(indicadores.pctFixasPct)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Moradia / renda</p>
              <p className="num font-semibold">{fmtPct(indicadores.pctMoradiaPct)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Alimentação / renda</p>
              <p className="num font-semibold">{fmtPct(indicadores.pctAlimentacaoPct)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Lazer / renda</p>
              <p className="num font-semibold">{fmtPct(indicadores.pctLazerPct)}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Variáveis / renda</p>
              <p className="num font-semibold">{fmtPct(indicadores.pctVariaveisPct)}</p>
            </div>
          </div>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="card p-4 flex flex-col gap-2.5">
          <p className="label-eyebrow flex items-center gap-1.5">
            <BellRing size={13} /> Alertas
          </p>
          {alertas.map((a, i) => (
            <p key={i} className={`text-sm ${a.tipo === "alerta" ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
              {a.texto}
            </p>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="label-eyebrow mb-3">Evolução anual</p>
          <EvolucaoMensalChart dados={evolucao} />
        </div>
        <div className="card p-4">
          <p className="label-eyebrow mb-3">Gastos por categoria — {MESES[idxMesSel]}</p>
          {categoriaDados.length > 0 ? (
            <CategoriaBarChart dados={categoriaDados} />
          ) : (
            <p className="text-sm text-[var(--muted)] py-8 text-center">Sem lançamentos este mês ainda.</p>
          )}
        </div>
      </div>

      {fixosDados.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label-eyebrow">Custos fixos — {MESES[idxMesSel]}</p>
            <p className={`text-sm font-medium num ${pctFixoRenda > 50 ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
              {fmtBRL(totalFixoMes)} · {fmtPct(pctFixoRenda)} da renda
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {fixosDados.map((f) => (
              <div key={f.categoria} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{f.categoria}</span>
                  <span className="num text-[var(--muted)]">{fmtBRL(f.valor)} · {fmtPct(f.pctRenda)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, f.pctRenda * 2)}%`, background: "var(--primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">
            Custos fixos são os que mais valem renegociar — a economia se repete todo mês. Veja sugestões em{" "}
            <a href="/dicas" className="underline">Dicas</a>.
          </p>
        </div>
      )}

      <div className="card p-4 overflow-x-auto">
        <p className="label-eyebrow mb-3">Resumo mensal — {ano}</p>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-2 font-normal">Mês</th>
              <th className="py-2 pr-2 text-right font-normal">Receita</th>
              <th className="py-2 pr-2 text-right font-normal">Fixas</th>
              <th className="py-2 pr-2 text-right font-normal">Variáveis</th>
              <th className="py-2 pr-2 text-right font-normal">Dívidas</th>
              <th className="py-2 pr-2 text-right font-normal">Investido</th>
              <th className="py-2 pr-2 text-right font-normal">Saldo</th>
              <th className="py-2 pr-2 text-right font-normal">% Poupança</th>
            </tr>
          </thead>
          <tbody>
            {resumoAnual.map((r) => (
              <tr key={r.mes} className={`border-b border-[var(--border-soft)] ${r.idx === idxMesSel ? "bg-[var(--bg-soft)]" : ""}`}>
                <td className="py-1.5 pr-2">{r.mes}</td>
                <td className="py-1.5 pr-2 text-right num text-[var(--receita)]">{fmtBRL(r.receita)}</td>
                <td className="py-1.5 pr-2 text-right num">{fmtBRL(r.fixas)}</td>
                <td className="py-1.5 pr-2 text-right num">{fmtBRL(r.variaveis)}</td>
                <td className="py-1.5 pr-2 text-right num text-[var(--divida)]">{fmtBRL(r.dividas)}</td>
                <td className="py-1.5 pr-2 text-right num text-[var(--invest)]">{fmtBRL(r.investido)}</td>
                <td className={`py-1.5 pr-2 text-right num font-semibold ${r.saldo >= 0 ? "text-[var(--receita)]" : "text-[var(--despesa)]"}`}>{fmtBRL(r.saldo)}</td>
                <td className="py-1.5 pr-2 text-right num">{fmtPct(r.poupanca)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
