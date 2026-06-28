import { createClient } from "@/lib/supabase/server";

export async function getCurrentHousehold() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("usuarios_household")
    .select("household_id, papel, households(nome)")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    householdId: data.household_id as string,
    papel: data.papel as string,
    nome: (data.households as unknown as { nome: string } | null)?.nome ?? "",
    userId: auth.user.id,
    userEmail: auth.user.email ?? "",
  };
}
