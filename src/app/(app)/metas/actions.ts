"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function criarMeta(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("metas").insert({
    household_id: household.householdId,
    nome: String(formData.get("nome")),
    categoria: String(formData.get("categoria")),
    valor_alvo: Number(formData.get("valor_alvo") || 0),
    valor_atual: Number(formData.get("valor_atual") || 0),
    prazo: formData.get("prazo") ? String(formData.get("prazo")) : null,
  });

  revalidatePath("/metas");
}

export async function atualizarProgressoMeta(id: string, formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase
    .from("metas")
    .update({ valor_atual: Number(formData.get("valor_atual") || 0) })
    .eq("id", id)
    .eq("household_id", household.householdId);

  revalidatePath("/metas");
}

export async function excluirMeta(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("metas").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/metas");
}
