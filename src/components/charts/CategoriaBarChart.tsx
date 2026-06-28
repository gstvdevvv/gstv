"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type PontoCategoria = {
  categoria: string;
  valor: number;
};

export function CategoriaBarChart({ dados }: { dados: PontoCategoria[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, dados.length * 36)}>
      <BarChart data={dados} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" stroke="var(--muted)" fontSize={12} />
        <YAxis type="category" dataKey="categoria" stroke="var(--muted)" fontSize={12} width={160} />
        <Tooltip
          contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 8 }}
          formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
        <Bar dataKey="valor" name="Gasto" fill="var(--accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
