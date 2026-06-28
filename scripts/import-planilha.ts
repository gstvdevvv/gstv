/**
 * Import one-off dos dados de 2026 da planilha "Controle Financeiro 2026.xlsx" para o Supabase.
 * Uso: npx tsx scripts/import-planilha.ts "C:\Users\gusta\Downloads\Controle Financeiro 2026.xlsx"
 *
 * Requer no .env.local: SUPABASE_SERVICE_ROLE_KEY (Settings > API > service_role no painel Supabase)
 * e os usuarios gustavo@financeiro.app / vitoria@financeiro.app já criados em Authentication > Users.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import * as ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const ANO = 2026;
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CATEGORIAS_PADRAO: { tipo: string; nome: string }[] = [
  { tipo: "receita", nome: "Salário Gustavo" },
  { tipo: "receita", nome: "Salário Vitória" },
  { tipo: "receita", nome: "Freelance / Bico" },
  { tipo: "receita", nome: "Renda Extra / Bônus" },
  { tipo: "receita", nome: "Dividendos / Investimentos" },
  { tipo: "receita", nome: "Aluguel Recebido" },
  { tipo: "receita", nome: "Benefícios / Reembolsos" },
  { tipo: "receita", nome: "Outras Receitas" },
  { tipo: "fixa", nome: "Aluguel / Financiamento" },
  { tipo: "fixa", nome: "Condomínio" },
  { tipo: "fixa", nome: "Financiamento Carro" },
  { tipo: "fixa", nome: "Energia Elétrica" },
  { tipo: "fixa", nome: "Internet / TV / Telefone" },
  { tipo: "fixa", nome: "MEI" },
  { tipo: "fixa", nome: "Seguro" },
  { tipo: "fixa", nome: "Escola / Faculdade" },
  { tipo: "fixa", nome: "Academia" },
  { tipo: "fixa", nome: "Empregada / Diarista" },
  { tipo: "fixa", nome: "Outras Fixas" },
  { tipo: "variavel", nome: "Alimentação / Supermercado" },
  { tipo: "variavel", nome: "Cartão de Crédito" },
  { tipo: "variavel", nome: "Transporte / Combustível" },
  { tipo: "variavel", nome: "Pet" },
  { tipo: "variavel", nome: "Farmácia / Saúde" },
  { tipo: "variavel", nome: "Roupas / Calçados" },
  { tipo: "variavel", nome: "Lazer / Entretenimento" },
  { tipo: "variavel", nome: "Educação / Cursos" },
  { tipo: "variavel", nome: "Cuidados Pessoais" },
  { tipo: "variavel", nome: "Presentes / Outros" },
  { tipo: "investimento", nome: "Reserva de Emergência" },
  { tipo: "investimento", nome: "Tesouro Direto / CDB" },
  { tipo: "investimento", nome: "Compra Terreno" },
  { tipo: "investimento", nome: "FIIs" },
  { tipo: "investimento", nome: "Previdência Privada" },
  { tipo: "investimento", nome: "Criptoativos" },
  { tipo: "investimento", nome: "Outros Investimentos" },
];

const SECOES = [
  { chave: "RECEITAS", tipo: "receita" as const },
  { chave: "DESPESAS FIXAS", tipo: "fixa" as const },
  { chave: "DESPESAS VARI", tipo: "variavel" as const }, // cobre VARIÁVEIS/VARIAVEIS
  { chave: "INVESTIMENTOS", tipo: "investimento" as const },
];

function normaliza(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

function valorCelula(cell: ExcelJS.Cell): number {
  const v = cell.value;
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "result" in v) return Number((v as { result: number }).result) || 0;
  return Number(v) || 0;
}

function textoCelula(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "richText" in v) {
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  return String(v);
}

async function main() {
  const caminho = process.argv[2] || "C:\\Users\\gusta\\Downloads\\Controle Financeiro 2026.xlsx";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("Defina SUPABASE_SERVICE_ROLE_KEY no .env.local antes de rodar o import.");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey);

  console.log("Lendo planilha:", caminho);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(caminho);

  // 1) household — usa o existente (definido manualmente pelo usuario) ou cria um novo se nenhum existir
  let householdId = process.env.HOUSEHOLD_ID;
  if (!householdId) {
    const { data: existentes } = await supabase.from("households").select("id, nome").order("created_at", { ascending: true });
    if (existentes && existentes.length > 0) {
      householdId = existentes[0].id;
      if (existentes.length > 1) {
        console.warn(`Atencao: ${existentes.length} households encontrados, usando o mais antigo (${householdId}).`);
      }
    } else {
      const { data: novo, error } = await supabase.from("households").insert({ nome: "Família" }).select("id").single();
      if (error) throw error;
      householdId = novo.id;
    }
  }
  console.log("Household:", householdId);

  // 2) vincular usuarios gustavo/vitoria se existirem
  const { data: usersResp } = await supabase.auth.admin.listUsers();
  const usuarios = usersResp?.users ?? [];
  for (const email of ["gustavo@financeiro.app", "vitoria@financeiro.app"]) {
    const user = usuarios.find((u) => u.email === email);
    if (user) {
      await supabase.from("usuarios_household").upsert({ user_id: user.id, household_id: householdId, papel: "admin" });
      console.log("Vinculado:", email);
    } else {
      console.warn("Usuario nao encontrado (crie em Authentication > Users):", email);
    }
  }

  // 3) config padrao
  await supabase.from("config").upsert({ household_id: householdId });

  // 4) categorias padrao
  const categoriaIdPorNome = new Map<string, string>();
  const { data: categoriasExistentes } = await supabase.from("categorias").select("id, nome").eq("household_id", householdId);
  for (const c of categoriasExistentes ?? []) categoriaIdPorNome.set(normaliza(c.nome), c.id);

  for (const cat of CATEGORIAS_PADRAO) {
    const chave = normaliza(cat.nome);
    if (categoriaIdPorNome.has(chave)) continue;
    const { data, error } = await supabase
      .from("categorias")
      .insert({ household_id: householdId, tipo: cat.tipo, nome: cat.nome })
      .select("id")
      .single();
    if (error) throw error;
    categoriaIdPorNome.set(chave, data.id);
  }

  async function getOuCriarCategoria(nome: string, tipo: string): Promise<string> {
    const chave = normaliza(nome);
    const existente = categoriaIdPorNome.get(chave);
    if (existente) return existente;
    const { data, error } = await supabase
      .from("categorias")
      .insert({ household_id: householdId, tipo, nome })
      .select("id")
      .single();
    if (error) throw error;
    categoriaIdPorNome.set(chave, data.id);
    return data.id;
  }

  // 5) limpar dados anteriores deste import (idempotente)
  await supabase.from("lancamentos").delete().eq("household_id", householdId);
  await supabase.from("investimentos").delete().eq("household_id", householdId);
  await supabase.from("pagamentos_divida").delete().eq("household_id", householdId);
  await supabase.from("dividas").delete().eq("household_id", householdId);

  let totalLancamentos = 0;
  let totalInvestimentos = 0;

  // 6) meses
  for (let mesIdx = 0; mesIdx < 12; mesIdx++) {
    const nomeMes = MESES[mesIdx];
    const mesRef = `${ANO}-${String(mesIdx + 1).padStart(2, "0")}`;
    const ws = wb.getWorksheet(nomeMes);
    if (!ws) {
      console.warn("Aba nao encontrada:", nomeMes);
      continue;
    }

    let secaoAtual: { tipo: string } | null = null;
    let linhaHeader = -1;
    type LinhaBruta = { tipo: string; nome: string; valorB: number; valorC: number };
    const linhasBrutas: LinhaBruta[] = [];

    ws.eachRow((row, rowNumber) => {
      const partes: string[] = [];
      row.eachCell((cell) => partes.push(textoCelula(cell)));
      const textoLinha = normaliza(partes.join(" "));

      const secaoEncontrada = SECOES.find((s) => textoLinha.includes(s.chave));
      if (secaoEncontrada) {
        secaoAtual = secaoEncontrada;
        linhaHeader = rowNumber + 1; // header de colunas fica na proxima linha
        return;
      }

      if (!secaoAtual || rowNumber <= linhaHeader) return;

      const colA = textoCelula(row.getCell(2)).trim();
      if (!colA) return;
      if (normaliza(colA).startsWith("TOTAL")) {
        secaoAtual = null;
        return;
      }

      const valorB = valorCelula(row.getCell(3));
      const valorC = valorCelula(row.getCell(4));
      if (valorB === 0 && valorC === 0) return;

      linhasBrutas.push({ tipo: secaoAtual.tipo, nome: colA, valorB, valorC });
    });

    const lancamentosMes: Record<string, unknown>[] = [];
    const investimentosMes: Record<string, unknown>[] = [];

    for (const linha of linhasBrutas) {
      if (linha.tipo === "investimento") {
        investimentosMes.push({
          household_id: householdId,
          ativo_destino: linha.nome,
          mes_ref: mesRef,
          valor_planejado: linha.valorB || null,
          valor_aportado: linha.valorC || null,
        });
        continue;
      }
      const categoriaId = await getOuCriarCategoria(linha.nome, linha.tipo);
      lancamentosMes.push({
        household_id: householdId,
        categoria_id: categoriaId,
        tipo: linha.tipo === "receita" ? "receita" : "despesa",
        descricao: linha.nome,
        valor_previsto: linha.valorB || null,
        valor_realizado: linha.valorC || null,
        data: `${mesRef}-01`,
        mes_ref: mesRef,
      });
    }

    if (lancamentosMes.length > 0) {
      const { error } = await supabase.from("lancamentos").insert(lancamentosMes);
      if (error) throw error;
      totalLancamentos += lancamentosMes.length;
    }
    if (investimentosMes.length > 0) {
      const { error } = await supabase.from("investimentos").insert(investimentosMes);
      if (error) throw error;
      totalInvestimentos += investimentosMes.length;
    }

    console.log(`Mes ${nomeMes}: ${lancamentosMes.length} lancamentos, ${investimentosMes.length} investimentos.`);
  }

  // 7) DIVIDAS (consolidado)
  const wsDividas = wb.getWorksheet("DIVIDAS");
  if (wsDividas) {
    let processadas = 0;
    for (let r = 2; r <= wsDividas.rowCount; r++) {
      const row = wsDividas.getRow(r);
      const credor = textoCelula(row.getCell(1)).trim();
      if (!credor || normaliza(credor).startsWith("TOTAL")) continue;

      const valorTotal = valorCelula(row.getCell(2));
      const pago = valorCelula(row.getCell(3));
      const negociacao = textoCelula(row.getCell(5)).trim() || null;
      if (valorTotal === 0) continue;

      const { data: divida, error } = await supabase
        .from("dividas")
        .insert({
          household_id: householdId,
          credor,
          valor_total: valorTotal,
          negociacao_texto: negociacao,
          status: pago >= valorTotal ? "paga" : "ativa",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (pago > 0) {
        await supabase.from("pagamentos_divida").insert({
          household_id: householdId,
          divida_id: divida.id,
          valor: pago,
          data: `${ANO}-01-01`,
          mes_ref: "historico-2026",
        });
      }
      processadas++;
    }
    console.log("Dividas importadas:", processadas);
  }

  console.log("Total de lancamentos importados:", totalLancamentos);
  console.log("Total de investimentos importados:", totalInvestimentos);
  console.log("Import concluido.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
