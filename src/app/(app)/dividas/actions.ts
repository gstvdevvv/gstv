"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { mesRefAtual } from "@/lib/utils";

export async function criarDivida(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("dividas").insert({
    household_id: household.householdId,
    credor: String(formData.get("credor")),
    valor_total: Number(formData.get("valor_total") || 0),
    negociacao_texto: String(formData.get("negociacao_texto") || "") || null,
    parcelas_qtd: Number(formData.get("parcelas_qtd") || 0) || null,
    valor_parcela: Number(formData.get("valor_parcela") || 0) || null,
    data_primeira_parcela: String(formData.get("data_primeira_parcela") || "") || null,
    status: "ativa",
  });

  revalidatePath("/dividas");
}

export async function excluirDivida(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("dividas").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/dividas");
}

export async function registrarPagamentoDivida(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  const dividaId = String(formData.get("divida_id"));
  const valor = Number(formData.get("valor") || 0);
  const data = String(formData.get("data") || new Date().toISOString().slice(0, 10));

  await supabase.from("pagamentos_divida").insert({
    household_id: household.householdId,
    divida_id: dividaId,
    valor,
    data,
    mes_ref: mesRefAtual(),
  });

  revalidatePath("/dividas");
}
