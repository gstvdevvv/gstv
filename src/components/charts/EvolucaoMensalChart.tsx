"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export type PontoMensal = {
  mes: string;
  receita: number;
  despesa: number;
  saldo: number;
};

export function EvolucaoMensalChart({ dados }: { dados: PontoMensal[] }) {
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
        <Line type="monotone" dataKey="receita" name="Receita" stroke="var(--receita)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="despesa" name="Despesa" stroke="var(--despesa)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="saldo" name="Saldo" stroke="var(--invest)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
