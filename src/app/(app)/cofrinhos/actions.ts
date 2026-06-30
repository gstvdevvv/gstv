"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function criarCofrinho(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("cofrinhos").insert({
    household_id: household.householdId,
    nome: String(formData.get("nome")),
    meta_valor: Number(formData.get("meta_valor") || 0) || null,
  });

  revalidatePath("/cofrinhos");
}

export async function excluirCofrinho(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("cofrinhos").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/cofrinhos");
}

export async function registrarMovimentoCofrinho(cofrinhoId: string, formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("cofrinho_movimentos").insert({
    household_id: household.householdId,
    cofrinho_id: cofrinhoId,
    tipo: String(formData.get("tipo")),
    valor: Number(formData.get("valor") || 0),
    descricao: String(formData.get("descricao") || "") || null,
    data: String(formData.get("data")),
  });

  revalidatePath("/cofrinhos");
  revalidatePath("/");
}
