import type { Meta } from "@/lib/queries";

export function calcularProgressoMeta(meta: Meta, capacidadeMensalPoupanca: number) {
  const faltante = Math.max(0, Number(meta.valor_alvo) - Number(meta.valor_atual));
  const pctAtingido = Number(meta.valor_alvo) > 0 ? Math.min(100, (Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100) : 0;

  let mesesRestantes: number | null = null;
  if (meta.prazo) {
    const hoje = new Date();
    const prazo = new Date(meta.prazo);
    mesesRestantes = Math.max(
      0,
      (prazo.getFullYear() - hoje.getFullYear()) * 12 + (prazo.getMonth() - hoje.getMonth())
    );
  }

  const aporteMensalNecessario = mesesRestantes && mesesRestantes > 0 ? faltante / mesesRestantes : faltante;

  let status: "concluida" | "no_prazo" | "atrasada" | "sem_prazo";
  if (faltante <= 0) status = "concluida";
  else if (mesesRestantes === null) status = "sem_prazo";
  else if (capacidadeMensalPoupanca <= 0 || aporteMensalNecessario > capacidadeMensalPoupanca) status = "atrasada";
  else status = "no_prazo";

  return { faltante, pctAtingido, mesesRestantes, aporteMensalNecessario, status };
}
