"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  TrendingDown,
  PiggyBank,
  Target,
  Lightbulb,
  Settings,
  Scale,
} from "lucide-react";

const LINKS = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", Icon: Receipt },
  { href: "/cartoes", label: "Cartões", Icon: CreditCard },
  { href: "/dividas", label: "Dívidas", Icon: TrendingDown },
  { href: "/investimentos", label: "Investimentos", Icon: PiggyBank },
  { href: "/patrimonio", label: "Patrimônio Líquido", Icon: Scale },
  { href: "/metas", label: "Metas", Icon: Target },
  { href: "/dicas", label: "Dicas", Icon: Lightbulb },
  { href: "/configuracoes", label: "Configurações", Icon: Settings },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map(({ href, label, Icon }) => {
        const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              ativo
                ? "bg-[var(--bg-soft)] text-[var(--primary)] font-medium"
                : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon size={17} strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
