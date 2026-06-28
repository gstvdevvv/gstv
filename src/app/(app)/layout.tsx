import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { NavLinks } from "@/components/NavLinks";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const household = await getCurrentHousehold();

  if (!household) {
    redirect("/login?erro=sem-household");
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-soft)] p-4 gap-6">
        <div className="px-2">
          <p className="text-lg font-bold tracking-tight">💰 Financeiro</p>
          <p className="text-xs text-[var(--muted)]">{household.nome}</p>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 md:hidden">
          <p className="font-bold">💰 Financeiro</p>
          <LogoutButton />
        </header>
        <header className="hidden md:flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
          <p className="text-sm text-[var(--muted)]">
            Logado como <span className="text-[var(--foreground)]">{household.userEmail}</span>
          </p>
          <LogoutButton />
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>

        <nav className="md:hidden border-t border-[var(--border)] bg-[var(--bg-soft)] px-2 py-2">
          <NavLinks />
        </nav>
      </div>
    </div>
  );
}
