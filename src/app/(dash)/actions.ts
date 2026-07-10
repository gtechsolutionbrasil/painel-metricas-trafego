"use server";

// Dispara a coleta de dados nos workflows n8n (Meta + Google) via webhooks de
// produção. Chamado pelo botão "Atualizar" da Topbar. Os workflows fazem upsert
// no Supabase; como as páginas são force-dynamic, um router.refresh() no client
// já traz os números novos.

const WEBHOOKS = [
  { name: "Meta Ads", url: process.env.N8N_REFRESH_META_URL },
  { name: "Google Ads", url: process.env.N8N_REFRESH_GOOGLE_URL },
];

// Google Ads leva ~22s; damos margem folgada.
const TIMEOUT_MS = 55_000;

export async function refreshData(): Promise<{ ok: boolean; error?: string }> {
  const targets = WEBHOOKS.filter((w) => w.url);
  if (targets.length === 0) {
    return { ok: false, error: "Nenhum webhook configurado (defina N8N_REFRESH_*_URL)." };
  }

  // Header secreto validado pelo n8n (os paths dos webhooks constam no repo
  // público — sem isso qualquer um poderia disparar a coleta).
  const secret = process.env.N8N_REFRESH_SECRET;
  const results = await Promise.allSettled(
    targets.map((w) =>
      fetch(w.url as string, {
        method: "POST",
        cache: "no-store",
        headers: secret ? { "X-Refresh-Key": secret } : undefined,
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
  if (failed.length > 0) {
    return { ok: true, error: `Atualizado parcialmente (falhou: ${failed.join(", ")}).` };
  }
  return { ok: true };
}
