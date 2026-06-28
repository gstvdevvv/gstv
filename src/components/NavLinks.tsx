"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/lancamentos", label: "Lançamentos", icon: "📝" },
  { href: "/cartoes", label: "Cartões", icon: "💳" },
  { href: "/dividas", label: "Dívidas", icon: "📉" },
  { href: "/investimentos", label: "Investimentos", icon: "📈" },
  { href: "/dicas", label: "Dicas", icon: "💡" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              ativo
                ? "bg-[var(--primary)] text-[#06231a] font-semibold"
                : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
