"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function criarCategoria(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("categorias").insert({
    household_id: household.householdId,
    tipo: String(formData.get("tipo")),
    nome: String(formData.get("nome")),
    limite_padrao: Number(formData.get("limite_padrao") || 0) || null,
  });

  revalidatePath("/configuracoes");
}

export async function excluirCategoria(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("categorias").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/configuracoes");
}

export async function atualizarMetas(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase
    .from("config")
    .upsert({
      household_id: household.householdId,
      meta_poupanca_pct: Number(formData.get("meta_poupanca_pct") || 20),
      alerta_limite_pct: Number(formData.get("alerta_limite_pct") || 90),
      meses_reserva_meta: Number(formData.get("meses_reserva_meta") || 6),
    });

  revalidatePath("/configuracoes");
}
