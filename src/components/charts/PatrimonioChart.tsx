"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type PontoPatrimonio = {
  mes: string;
  acumulado: number;
};

export function PatrimonioChart({ dados }: { dados: PontoPatrimonio[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mes" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 8 }}
          formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
        <Area type="monotone" dataKey="acumulado" name="Patrimônio acumulado" stroke="var(--invest)" fill="var(--invest)" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
