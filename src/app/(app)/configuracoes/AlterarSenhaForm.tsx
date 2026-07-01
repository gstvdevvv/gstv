"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AlterarSenhaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "erro">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nova = fd.get("nova_senha") as string;
    const confirma = fd.get("confirma_senha") as string;

    if (nova !== confirma) {
      setStatus("erro");
      setMsg("As senhas não coincidem.");
      return;
    }
    if (nova.length < 6) {
      setStatus("erro");
      setMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: nova });

    if (error) {
      setStatus("erro");
      setMsg(error.message);
    } else {
      setStatus("ok");
      setMsg("Senha alterada com sucesso!");
      formRef.current?.reset();
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 max-w-md">
      <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
        <label className="text-xs text-[var(--muted)]">Nova senha</label>
        <input name="nova_senha" type="password" className="input" required minLength={6} />
      </div>
      <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
        <label className="text-xs text-[var(--muted)]">Confirmar senha</label>
        <input name="confirma_senha" type="password" className="input" required minLength={6} />
      </div>
      {status !== "idle" && (
        <p className={`col-span-2 text-sm ${status === "ok" ? "text-[var(--receita)]" : "text-[var(--danger)]"}`}>
          {msg}
        </p>
      )}
      <button type="submit" className="btn-primary w-fit">Alterar senha</button>
    </form>
  );
}
