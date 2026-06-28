"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={sair} title="Sair" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
      <LogOut size={16} strokeWidth={1.75} />
    </button>
  );
}
