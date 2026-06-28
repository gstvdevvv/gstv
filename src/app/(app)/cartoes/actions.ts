"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { somaMeses } from "@/lib/utils";

export async function criarCartao(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("cartoes").insert({
    household_id: household.householdId,
    nome: String(formData.get("nome")),
    bandeira: String(formData.get("bandeira") || "") || null,
    limite: Number(formData.get("limite") || 0) || null,
    dia_fechamento: Number(formData.get("dia_fechamento") || 0) || null,
    dia_vencimento: Number(formData.get("dia_vencimento") || 0) || null,
  });

  revalidatePath("/cartoes");
}

export async function excluirCartao(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("cartoes").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/cartoes");
}

export async function criarGastoCartao(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();

  const cartaoId = String(formData.get("cartao_id"));
  const descricao = String(formData.get("descricao"));
  const categoriaId = String(formData.get("categoria_id") || "") || null;
  const valorTotal = Number(formData.get("valor_total") || 0);
  const parcelas = Math.max(1, Number(formData.get("parcelas") || 1));
  const dataCompra = String(formData.get("data_compra"));
  const faturaInicial = String(formData.get("fatura_mes_ref"));
  const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100;

  const linhas = Array.from({ length: parcelas }, (_, i) => ({
    household_id: household.householdId,
    cartao_id: cartaoId,
    descricao: parcelas > 1 ? `${descricao} (${i + 1}/${parcelas})` : descricao,
    categoria_id: categoriaId,
    valor_total: valorParcela,
    parcelas,
    parcela_atual: i + 1,
    data_compra: dataCompra,
    fatura_mes_ref: somaMeses(faturaInicial, i),
  }));

  await supabase.from("gastos_cartao").insert(linhas);

  revalidatePath("/cartoes");
}

export async function excluirGastoCartao(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("gastos_cartao").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/cartoes");
}
