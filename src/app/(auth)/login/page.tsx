"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNextPath(search.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      router.push(next);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="card p-7">
          <h1 className="text-xl font-bold text-ink">Acessar o painel</h1>
          <p className="mt-1 text-sm text-muted">
            Entre com suas credenciais para ver as métricas dos seus clientes.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-4 rounded-lg border border-brand-border bg-brand-soft px-3 py-2.5 text-[13px] text-brand-ink">
              Modo demonstração ativo — clique em entrar para acessar com dados
              de exemplo.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="email"
                  type="email"
                  required={isSupabaseConfigured}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@agencia.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="password"
                  type="password"
                  required={isSupabaseConfigured}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-[13px] text-danger-ink">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          GTECH SOLUTION · Painel de Métricas de Tráfego
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
