"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toLoginEmail } from "@/lib/auth";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: toLoginEmail(usuario),
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("Usuário ou senha incorretos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={entrar} className="card w-full max-w-sm p-8 flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="font-display text-2xl">Financeiro</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Controle financeiro do casal</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--muted)]">Usuário</label>
          <input
            className="input"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="gustavo"
            autoFocus
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--muted)]">Senha</label>
          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && <p className="text-sm text-[var(--danger)]">{erro}</p>}

        <button type="submit" disabled={carregando} className="btn-primary mt-2">
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
