import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { NavLinks } from "@/components/NavLinks";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const household = await getCurrentHousehold();

  if (!household) {
    redirect("/login?erro=sem-household");
  }

  const inicial = household.userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-60 flex-col border-r border-[var(--border)] bg-[var(--bg-soft)] py-6 px-4 gap-8">
        <div className="px-2">
          <p className="font-display text-lg leading-none">Financeiro</p>
          <p className="label-eyebrow mt-1">{household.nome}</p>
        </div>
        <NavLinks />
        <div className="mt-auto flex items-center gap-2 px-2 pt-4 border-t border-[var(--border)]">
          <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--foreground)]">
            {inicial}
          </div>
          <p className="text-xs text-[var(--muted)] truncate flex-1">{household.userEmail}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 md:hidden">
          <p className="font-display">Financeiro</p>
          <LogoutButton />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden max-w-6xl">{children}</main>

        <nav className="md:hidden border-t border-[var(--border)] bg-[var(--bg-soft)] px-2 py-2">
          <NavLinks />
        </nav>
      </div>
    </div>
  );
}
