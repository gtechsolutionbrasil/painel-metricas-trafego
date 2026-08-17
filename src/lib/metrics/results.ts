import type {
  AdConversionActionMetric,
  IntegrationAccount,
  TrackingCheck,
  WebEventMetric,
} from "../types";

export type ResultBucket = "primary" | "local_intent" | "micro";
export type ResultKind =
  | "whatsapp"
  | "meta_conversation"
  | "form"
  | "phone"
  | "directions"
  | "store_visit"
  | "website_visit"
  | "other";

export type ClassifiedResult = {
  bucket: ResultBucket;
  kind: ResultKind;
  label: string;
};

export const RESULT_LABELS: Record<ResultKind, string> = {
  whatsapp: "WhatsApp",
  meta_conversation: "Conversas Meta",
  form: "Formulários confirmados",
  phone: "Ligações / cliques para ligar",
  directions: "Pedidos de rota",
  store_visit: "Visitas à loja",
  website_visit: "Visitas ao site pelo perfil",
  other: "Outras ações",
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function classifyAdAction(
  action: AdConversionActionMetric,
): ClassifiedResult {
  const name = normalized(action.actionName);
  const category = action.actionCategory.toUpperCase();

  if (category === "GET_DIRECTIONS" || /direction|rota|como chegar/.test(name)) {
    return {
      bucket: "local_intent",
      kind: "directions",
      label: RESULT_LABELS.directions,
    };
  }
  if (/store visit|visita.*loja/.test(name)) {
    return {
      bucket: "local_intent",
      kind: "store_visit",
      label: RESULT_LABELS.store_visit,
    };
  }
  if (/website visit|abriu o site/.test(name) || category === "PAGE_VIEW") {
    return {
      bucket: "micro",
      kind: "website_visit",
      label: RESULT_LABELS.website_visit,
    };
  }
  if (/whats|wa\b/.test(name)) {
    return {
      bucket: "primary",
      kind: "whatsapp",
      label: RESULT_LABELS.whatsapp,
    };
  }
  if (
    category === "SUBMIT_LEAD_FORM" ||
    category === "LEAD" ||
    /form|generate.?lead|orcamento/.test(name)
  ) {
    return {
      bucket: "primary",
      kind: "form",
      label: RESULT_LABELS.form,
    };
  }
  if (
    category === "PHONE_CALL_LEAD" ||
    /call|chamad|ligacao|ligou|telefone/.test(name)
  ) {
    return {
      bucket: "primary",
      kind: "phone",
      label: RESULT_LABELS.phone,
    };
  }
  if (
    action.origin === "WEBSITE" &&
    (category === "CONTACT" || /contato/.test(name))
  ) {
    return {
      bucket: "primary",
      kind: "whatsapp",
      label: RESULT_LABELS.whatsapp,
    };
  }
  return { bucket: "micro", kind: "other", label: RESULT_LABELS.other };
}

export function classifyWebEvent(eventName: string): ClassifiedResult {
  const name = normalized(eventName);
  if (/whatsapp_click|whats|wa_click/.test(name)) {
    return {
      bucket: "primary",
      kind: "whatsapp",
      label: RESULT_LABELS.whatsapp,
    };
  }
  if (/generate_lead|form_submit|formulario|form_success/.test(name)) {
    return {
      bucket: "primary",
      kind: "form",
      label: RESULT_LABELS.form,
    };
  }
  if (/phone_click|call_click|telefone|ligacao/.test(name)) {
    return {
      bucket: "primary",
      kind: "phone",
      label: RESULT_LABELS.phone,
    };
  }
  if (/route_click|direction|como_chegar|rota/.test(name)) {
    return {
      bucket: "local_intent",
      kind: "directions",
      label: RESULT_LABELS.directions,
    };
  }
  return { bucket: "micro", kind: "other", label: RESULT_LABELS.other };
}

export type ResultSummary = {
  primary: number;
  localIntent: number;
  micro: number;
  byKind: Record<ResultKind, number>;
  byDay: Array<{ date: string; primary: number; localIntent: number }>;
  byCampaign: Map<string, { primary: number; localIntent: number }>;
};

function emptyKinds(): Record<ResultKind, number> {
  return {
    whatsapp: 0,
    meta_conversation: 0,
    form: 0,
    phone: 0,
    directions: 0,
    store_visit: 0,
    website_visit: 0,
    other: 0,
  };
}

export function summarizeAdActions(
  rows: AdConversionActionMetric[],
): ResultSummary {
  const summary: ResultSummary = {
    primary: 0,
    localIntent: 0,
    micro: 0,
    byKind: emptyKinds(),
    byDay: [],
    byCampaign: new Map(),
  };
  const days = new Map<string, { date: string; primary: number; localIntent: number }>();

  for (const row of rows) {
    const classified = classifyAdAction(row);
    const value = row.conversions;
    summary.byKind[classified.kind] += value;
    if (classified.bucket === "primary") summary.primary += value;
    if (classified.bucket === "local_intent") summary.localIntent += value;
    if (classified.bucket === "micro") summary.micro += value;

    const day = days.get(row.date) ?? {
      date: row.date,
      primary: 0,
      localIntent: 0,
    };
    if (classified.bucket === "primary") day.primary += value;
    if (classified.bucket === "local_intent") day.localIntent += value;
    days.set(row.date, day);

    const campaign = summary.byCampaign.get(row.campaign) ?? {
      primary: 0,
      localIntent: 0,
    };
    if (classified.bucket === "primary") campaign.primary += value;
    if (classified.bucket === "local_intent") campaign.localIntent += value;
    summary.byCampaign.set(row.campaign, campaign);
  }

  summary.byDay = [...days.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  return summary;
}

export type WebEventSummary = {
  primary: number;
  localIntent: number;
  micro: number;
  byKind: Record<ResultKind, number>;
  rows: Array<{
    eventName: string;
    label: string;
    bucket: ResultBucket;
    count: number;
    keyEvents: number;
  }>;
  byDay: Array<{ date: string; primary: number }>;
};

export function summarizeWebEvents(rows: WebEventMetric[]): WebEventSummary {
  const grouped = new Map<
    string,
    WebEventSummary["rows"][number]
  >();
  const out: WebEventSummary = {
    primary: 0,
    localIntent: 0,
    micro: 0,
    byKind: emptyKinds(),
    rows: [],
    byDay: [],
  };
  const days = new Map<string, { date: string; primary: number }>();

  for (const row of rows) {
    const classified = classifyWebEvent(row.eventName);
    const value = row.eventCount;
    out.byKind[classified.kind] += value;
    if (classified.bucket === "primary") {
      out.primary += value;
      const day = days.get(row.date) ?? { date: row.date, primary: 0 };
      day.primary += value;
      days.set(row.date, day);
    }
    if (classified.bucket === "local_intent") out.localIntent += value;
    if (classified.bucket === "micro") out.micro += value;

    const item = grouped.get(row.eventName) ?? {
      eventName: row.eventName,
      label: classified.label,
      bucket: classified.bucket,
      count: 0,
      keyEvents: 0,
    };
    item.count += value;
    item.keyEvents += row.keyEvents;
    grouped.set(row.eventName, item);
  }

  out.rows = [...grouped.values()].sort((a, b) => b.count - a.count);
  out.byDay = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export type HealthStatus = "healthy" | "warning" | "error" | "pending";

export type IntegrationHealth = {
  account: IntegrationAccount;
  status: HealthStatus;
  label: string;
  detail: string;
};

export function integrationHealth(
  account: IntegrationAccount,
  checks: TrackingCheck[] = [],
  now = new Date(),
): IntegrationHealth {
  const ownChecks = checks.filter(
    (check) =>
      check.clientId === account.clientId && check.provider === account.provider,
  );
  if (account.status === "error" || ownChecks.some((c) => c.status === "error")) {
    return {
      account,
      status: "error",
      label: "Erro",
      detail:
        ownChecks.find((c) => c.status === "error")?.message ??
        "A integração informou erro e precisa de revisão.",
    };
  }
  if (account.status === "paused") {
    return {
      account,
      status: "warning",
      label: "Pausado",
      detail: "A coleta está pausada.",
    };
  }
  if (account.status === "pending") {
    return {
      account,
      status: "pending",
      label: "Pendente",
      detail: "Ainda não houve uma sincronização confirmada.",
    };
  }
  if (ownChecks.some((c) => c.status === "warning")) {
    return {
      account,
      status: "warning",
      label: "Atenção",
      detail:
        ownChecks.find((c) => c.status === "warning")?.message ??
        "Há um check de tracking que precisa de revisão.",
    };
  }

  if (!account.lastSyncAt) {
    return {
      account,
      status: account.provider === "gtm" ? "pending" : "warning",
      label: account.provider === "gtm" ? "Aguardando auditoria" : "Sem data de sync",
      detail:
        account.provider === "gtm"
          ? "O container está mapeado, mas ainda não foi validado pelo checklist."
          : "A conta está conectada, porém não informa a última coleta.",
    };
  }

  const ageHours =
    (now.getTime() - new Date(account.lastSyncAt).getTime()) / 3_600_000;
  if (ageHours > 36) {
    return {
      account,
      status: "warning",
      label: "Dados atrasados",
      detail: `Última sincronização há ${Math.floor(ageHours)} horas.`,
    };
  }
  return {
    account,
    status: "healthy",
    label: "Saudável",
    detail: "Conectado e com coleta recente.",
  };
}
