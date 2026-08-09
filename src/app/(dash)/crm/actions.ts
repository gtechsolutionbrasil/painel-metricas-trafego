"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const createLeadSchema = z.object({
  clientId: z.string().uuid(),
  occurredAt: z.string().min(16).max(32),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]).optional(),
  channel: z.enum([
    "whatsapp",
    "meta_conversation",
    "form",
    "phone_call",
    "manual",
  ]),
  source: z.enum([
    "google_ads",
    "meta_ads",
    "site",
    "organic",
    "direct",
    "referral",
    "manual",
    "other",
  ]),
  campaign: z.string().trim().max(180).optional(),
  value: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const updateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "quote", "won", "lost"]),
});

function redirectWithFeedback(
  formData: FormData,
  key: "created" | "updated" | "error",
  message: string,
): never {
  const raw = String(formData.get("returnTo") ?? "/crm");
  const safePath = raw === "/crm" || raw.startsWith("/crm?") ? raw : "/crm";
  const url = new URL(safePath, "https://painel.local");
  url.searchParams.set(key, message);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

async function requireAccessibleClient(clientId: string, formData: FormData) {
  if (!isSupabaseConfigured) {
    redirectWithFeedback(
      formData,
      "error",
      "A migration do CRM precisa ser aplicada no Supabase antes de salvar.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirectWithFeedback(formData, "error", "Você precisa estar logado.");
  }

  // A policy de clients aplica has_client_access(). O teste explícito impede
  // IDOR e mantém a autorização dentro de toda Server Action.
  const { data: client, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (error || !client) {
    redirectWithFeedback(
      formData,
      "error",
      "Você não tem acesso a este cliente.",
    );
  }

  return { supabase, user };
}

export async function createLead(formData: FormData) {
  const parsed = createLeadSchema.safeParse({
    clientId: formData.get("clientId"),
    occurredAt: formData.get("occurredAt"),
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    channel: formData.get("channel") || "manual",
    source: formData.get("source") || "manual",
    campaign: formData.get("campaign") || undefined,
    value: formData.get("value") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    redirectWithFeedback(
      formData,
      "error",
      "Confira os campos do lead e tente novamente.",
    );
  }
  if (!parsed.data.name && !parsed.data.phone && !parsed.data.email) {
    redirectWithFeedback(
      formData,
      "error",
      "Informe pelo menos nome, telefone ou e-mail.",
    );
  }

  const occurredAt = parseSaoPauloDateTime(parsed.data.occurredAt);
  if (!occurredAt) {
    redirectWithFeedback(formData, "error", "Data do contato inválida.");
  }

  const { supabase, user } = await requireAccessibleClient(
    parsed.data.clientId,
    formData,
  );
  const value = parsed.data.value
    ? parseCurrencyBR(parsed.data.value)
    : null;
  if (value != null && (!Number.isFinite(value) || value < 0)) {
    redirectWithFeedback(formData, "error", "Valor estimado inválido.");
  }

  const { error } = await supabase.from("leads").insert({
    client_id: parsed.data.clientId,
    occurred_at: occurredAt,
    name: parsed.data.name || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    channel: parsed.data.channel,
    source: parsed.data.source,
    campaign: parsed.data.campaign || null,
    value,
    notes: parsed.data.notes || null,
    created_by: user.id,
  });
  if (error) {
    console.error("[crm] createLead failed", error);
    redirectWithFeedback(
      formData,
      "error",
      "Não foi possível adicionar o lead. Confira os dados e tente novamente.",
    );
  }

  revalidatePath("/crm");
  revalidatePath("/");
  redirectWithFeedback(formData, "created", "Lead adicionado ao funil.");
}

export async function updateLeadStatus(formData: FormData) {
  const parsed = updateStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    redirectWithFeedback(formData, "error", "Lead ou status inválido.");
  }

  const probe = await createSupabaseServerClient();
  const { data: lead, error: leadError } = await probe
    .from("leads")
    .select("client_id")
    .eq("id", parsed.data.leadId)
    .maybeSingle();
  if (leadError || !lead) {
    redirectWithFeedback(formData, "error", "Lead não encontrado.");
  }

  const { supabase } = await requireAccessibleClient(lead.client_id, formData);
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.leadId)
    .eq("client_id", lead.client_id);
  if (error) {
    console.error("[crm] updateLeadStatus failed", error);
    redirectWithFeedback(
      formData,
      "error",
      "Não foi possível atualizar a etapa. Tente novamente.",
    );
  }

  revalidatePath("/crm");
  revalidatePath("/");
  redirectWithFeedback(formData, "updated", "Etapa atualizada.");
}

function parseCurrencyBR(raw: string) {
  const value = raw.replace(/[R$\s]/g, "");
  if (value.includes(",")) {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }
  return Number(value);
}

function parseSaoPauloDateTime(raw: string) {
  const parsed = new Date(`${raw}:00-03:00`);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
