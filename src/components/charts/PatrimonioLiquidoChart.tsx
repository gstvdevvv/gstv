"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export type PontoPatrimonioLiquido = {
  mes: string;
  ativos: number;
  passivos: number;
  liquido: number;
};

export function PatrimonioLiquidoChart({ dados }: { dados: PontoPatrimonioLiquido[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mes" stroke="var(--muted)" fontSize={12} />
        <YAxis stroke="var(--muted)" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 8 }}
          formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
        <Legend />
        <Line type="monotone" dataKey="ativos" name="Ativos (investido)" stroke="var(--invest)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="passivos" name="Passivos (dívidas)" stroke="var(--divida)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="liquido" name="Patrimônio líquido" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
