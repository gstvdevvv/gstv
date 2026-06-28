"use client";

import { useRouter, usePathname } from "next/navigation";
import { MESES } from "@/lib/utils";

export function MesSelector({ mesRef }: { mesRef: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ano, mes] = mesRef.split("-").map(Number);

  function mudarMes(novoMes: number, novoAno: number) {
    const mesRefNovo = `${novoAno}-${String(novoMes).padStart(2, "0")}`;
    router.push(`${pathname}?mes=${mesRefNovo}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary px-2" onClick={() => mudarMes(mes === 1 ? 12 : mes - 1, mes === 1 ? ano - 1 : ano)}>
        ‹
      </button>
      <select
        className="input"
        value={mes}
        onChange={(e) => mudarMes(Number(e.target.value), ano)}
      >
        {MESES.map((nome, idx) => (
          <option key={nome} value={idx + 1}>{nome}</option>
        ))}
      </select>
      <select
        className="input"
        value={ano}
        onChange={(e) => mudarMes(mes, Number(e.target.value))}
      >
        {[ano - 1, ano, ano + 1].map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button className="btn-secondary px-2" onClick={() => mudarMes(mes === 12 ? 1 : mes + 1, mes === 12 ? ano + 1 : ano)}>
        ›
      </button>
    </div>
  );
}
