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

export async function createClientWithAccounts(formData: FormData) {
  if (!isSupabaseConfigured) {
    throw new Error("Configure o Supabase para cadastrar clientes reais.");
  }

  const parsed = clientSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    status: formData.get("status") || "active",
    websiteUrl: formData.get("websiteUrl") || undefined,
    googleAdsCustomerId: formData.get("googleAdsCustomerId") || undefined,
    metaAdAccountId: formData.get("metaAdAccountId") || undefined,
    ga4PropertyId: formData.get("ga4PropertyId") || undefined,
    gtmContainerId: formData.get("gtmContainerId") || undefined,
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa estar logado.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    throw new Error("Apenas administradores podem cadastrar clientes.");
  }

  const slug = normalizeSlug(parsed.slug || parsed.name);
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: parsed.name,
      slug,
      status: parsed.status,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    throw new Error(clientError?.message || "Não foi possível criar o cliente.");
  }

  await supabase.from("client_access").upsert({
    profile_id: user.id,
    client_id: client.id,
  });

  const accounts = buildAccounts(parsed.name, parsed.websiteUrl, {
    googleAdsCustomerId: parsed.googleAdsCustomerId,
    metaAdAccountId: parsed.metaAdAccountId,
    ga4PropertyId: parsed.ga4PropertyId,
    gtmContainerId: parsed.gtmContainerId,
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
      throw new Error(accountsError.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  redirect(`/clientes?created=${slug}`);
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
