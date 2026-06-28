"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function criarAporte(formData: FormData) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("investimentos").insert({
    household_id: household.householdId,
    ativo_destino: String(formData.get("ativo_destino")),
    mes_ref: String(formData.get("mes_ref")),
    valor_planejado: Number(formData.get("valor_planejado") || 0) || null,
    valor_aportado: Number(formData.get("valor_aportado") || 0) || null,
  });

  revalidatePath("/investimentos");
}

export async function excluirAporte(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Sem household");

  const supabase = await createClient();
  await supabase.from("investimentos").delete().eq("id", id).eq("household_id", household.householdId);

  revalidatePath("/investimentos");
}
