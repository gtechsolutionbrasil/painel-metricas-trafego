"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { IntegrationProvider } from "@/lib/types";

const clientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional(),
  status: z.enum(["active", "paused"]),
  websiteUrl: z.string().trim().max(240).optional(),
  googleAdsCustomerId: z.string().trim().max(80).optional(),
  metaAdAccountId: z.string().trim().max(80).optional(),
  ga4PropertyId: z.string().trim().max(80).optional(),
  gtmContainerId: z.string().trim().max(80).optional(),
});

type AccountInput = {
  provider: IntegrationProvider;
  accountName: string;
  externalId: string;
  websiteUrl?: string;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome do cliente",
  slug: "Slug",
  status: "Status",
  websiteUrl: "Site",
  googleAdsCustomerId: "Google Ads Customer ID",
  metaAdAccountId: "Meta Ad Account ID",
  ga4PropertyId: "GA4 Property ID",
  gtmContainerId: "GTM Container ID",
};

// Volta pro formulário com a mensagem num banner (?error=...), em vez de
// estourar um erro 500 sem contexto pro usuário.
function redirectWithError(message: string): never {
  redirect(`/clientes?error=${encodeURIComponent(message)}`);
}

export async function createClientWithAccounts(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirectWithError("Configure o Supabase para cadastrar clientes reais.");
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    status: formData.get("status") || "active",
    websiteUrl: formData.get("websiteUrl") || undefined,
    googleAdsCustomerId: formData.get("googleAdsCustomerId") || undefined,
    metaAdAccountId: formData.get("metaAdAccountId") || undefined,
    ga4PropertyId: formData.get("ga4PropertyId") || undefined,
    gtmContainerId: formData.get("gtmContainerId") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = FIELD_LABELS[String(issue.path[0])] ?? String(issue.path[0]);
    redirectWithError(`${field}: ${issue.message}`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirectWithError("Você precisa estar logado.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    redirectWithError("Apenas administradores podem cadastrar clientes.");
  }

  const slug = normalizeSlug(parsed.data.slug || parsed.data.name);
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      slug,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    redirectWithError(
      clientError?.message || "Não foi possível criar o cliente.",
    );
  }

  await supabase.from("client_access").upsert({
    profile_id: user.id,
    client_id: client.id,
  });

  const accounts = buildAccounts(parsed.data.name, parsed.data.websiteUrl, {
    googleAdsCustomerId: parsed.data.googleAdsCustomerId,
    metaAdAccountId: parsed.data.metaAdAccountId,
    ga4PropertyId: parsed.data.ga4PropertyId,
    gtmContainerId: parsed.data.gtmContainerId,
  });

  if (accounts.length) {
    const { error: accountsError } = await supabase
      .from("integration_accounts")
      .insert(
        accounts.map((account) => ({
          client_id: client.id,
          provider: account.provider,
          account_name: account.accountName,
          external_id: account.externalId,
          website_url: account.websiteUrl || null,
          status: "pending",
        })),
      );

    if (accountsError) {
      // Cliente já foi criado; avisa que as integrações não entraram.
      redirectWithError(
        `Cliente "${parsed.data.name}" criado, mas houve erro ao salvar as integrações: ${accountsError.message}`,
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  redirect(`/clientes?created=${slug}`);
}

// Exclui o cliente e, por cascade no banco, todas as integrações, métricas e
// acessos ligados a ele. Só admin (RLS clients_admin_delete garante no banco).
export async function deleteClient(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirectWithError("Configure o Supabase para gerenciar clientes.");
  }

  const clientId = String(formData.get("clientId") ?? "");
  const clientName = String(formData.get("clientName") ?? "cliente");
  if (!clientId) redirectWithError("Cliente inválido.");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirectWithError("Você precisa estar logado.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    redirectWithError("Apenas administradores podem excluir clientes.");
  }

  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", clientId);

  if (error) redirectWithError(error.message);
  if (!count) {
    redirectWithError(
      "Nenhum cliente foi excluído (verifique suas permissões).",
    );
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  redirect(`/clientes?deleted=${encodeURIComponent(clientName)}`);
}

function normalizeSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "cliente"
  );
}

function buildAccounts(
  clientName: string,
  websiteUrl: string | undefined,
  ids: {
    googleAdsCustomerId?: string;
    metaAdAccountId?: string;
    ga4PropertyId?: string;
    gtmContainerId?: string;
  },
): AccountInput[] {
  const accounts: AccountInput[] = [];
  if (ids.googleAdsCustomerId) {
    accounts.push({
      provider: "google_ads",
      accountName: `${clientName} - Google Ads`,
      externalId: ids.googleAdsCustomerId,
    });
  }
  if (ids.metaAdAccountId) {
    accounts.push({
      provider: "meta_ads",
      accountName: `${clientName} - Meta Ads`,
      externalId: ids.metaAdAccountId,
    });
  }
  if (ids.ga4PropertyId) {
    accounts.push({
      provider: "ga4",
      accountName: `${clientName} - GA4`,
      externalId: ids.ga4PropertyId,
      websiteUrl,
    });
  }
  if (ids.gtmContainerId) {
    accounts.push({
      provider: "gtm",
      accountName: `${clientName} - GTM`,
      externalId: ids.gtmContainerId,
      websiteUrl,
    });
  }
  return accounts;
}
