"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Dispara a coleta de dados nos workflows n8n (Meta + Google + GA4) via webhooks de
// produção. Chamado pelo botão "Atualizar" da Topbar. Os workflows fazem upsert
// no Supabase; como as páginas são force-dynamic, um router.refresh() no client
// já traz os números novos.

const WEBHOOKS = [
  { name: "Meta Ads", url: process.env.N8N_REFRESH_META_URL },
  { name: "Google Ads", url: process.env.N8N_REFRESH_GOOGLE_URL },
  { name: "GA4", url: process.env.N8N_REFRESH_GA4_URL },
];

// Google Ads leva ~22s; damos margem folgada.
const TIMEOUT_MS = 55_000;

export async function refreshData(): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Você precisa estar logado." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return {
        ok: false,
        error: "Apenas administradores podem disparar uma nova coleta.",
      };
    }
  }

  const targets = WEBHOOKS.filter((w) => w.url);
  const missing = WEBHOOKS.filter((w) => !w.url).map((w) => w.name);
  if (targets.length === 0) {
    return { ok: false, error: "Nenhum webhook configurado (defina N8N_REFRESH_*_URL)." };
  }

  // Header secreto validado pelo n8n (os paths dos webhooks constam no repo
  // público — sem isso qualquer um poderia disparar a coleta).
  const secret = process.env.N8N_REFRESH_SECRET;
  if (!secret) {
    return {
      ok: false,
      error: "Defina N8N_REFRESH_SECRET antes de liberar a atualização manual.",
    };
  }
  const results = await Promise.allSettled(
    targets.map((w) =>
      fetch(w.url as string, {
        method: "POST",
        cache: "no-store",
        headers: { "X-Refresh-Key": secret },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }).then((r) => {
        if (!r.ok) throw new Error(`${w.name}: HTTP ${r.status}`);
        return w.name;
      }),
    ),
  );

  const failed = results
    .map((r, i) => (r.status === "rejected" ? targets[i].name : null))
    .filter(Boolean);

  if (failed.length === targets.length) {
    return { ok: false, error: "Falha ao atualizar. Tente novamente em instantes." };
  }
  if (failed.length > 0 || missing.length > 0) {
    const details = [
      failed.length ? `falhou: ${failed.join(", ")}` : null,
      missing.length ? `não configurado: ${missing.join(", ")}` : null,
    ].filter(Boolean);
    return { ok: true, error: `Atualizado parcialmente (${details.join("; ")}).` };
  }
  return { ok: true };
}
