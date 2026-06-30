"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function criarLancamento(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  const categoriaId = String(formData.get("categoria_id") || "");
  const cofrinhoId = String(formData.get("cofrinho_id") || "");
  const tipo = String(formData.get("tipo"));
  const valorPrevisto = Number(formData.get("valor_previsto") || 0) || null;
  const valorRealizado = Number(formData.get("valor_realizado") || 0) || null;

  const { data: lancamento } = await supabase
    .from("lancamentos")
    .insert({
      household_id: household.householdId,
      categoria_id: categoriaId || null,
      tipo,
      descricao: String(formData.get("descricao")),
      valor_previsto: valorPrevisto,
      valor_realizado: valorRealizado,
      data: String(formData.get("data")),
      mes_ref: String(formData.get("mes_ref")),
      forma_pagamento: String(formData.get("forma_pagamento") || "") || null,
      recorrente: formData.get("recorrente") === "on",
    })
    .select("id, descricao")
    .single();

  if (cofrinhoId && tipo === "despesa" && lancamento) {
    await supabase.from("cofrinho_movimentos").insert({
      household_id: household.householdId,
      cofrinho_id: cofrinhoId,
      tipo: "saida",
      valor: valorRealizado ?? valorPrevisto ?? 0,
      descricao: `Gasto: ${lancamento.descricao}`,
      data: String(formData.get("data")),
      lancamento_id: lancamento.id,
    });
    revalidatePath("/cofrinhos");
  }

  revalidatePath("/lancamentos");
}

export async function atualizarRealizado(id: string, valorRealizado: number) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase
    .from("lancamentos")
    .update({ valor_realizado: valorRealizado })
    .eq("id", id)
    .eq("household_id", household.householdId);

  revalidatePath("/lancamentos");
}

export async function excluirLancamento(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("lancamentos").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/lancamentos");
}
