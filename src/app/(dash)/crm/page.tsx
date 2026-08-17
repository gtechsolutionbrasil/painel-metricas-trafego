import {
  BadgeDollarSign,
  CircleAlert,
  CircleCheckBig,
  Mail,
  MessageCircleMore,
  Phone,
  Trophy,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { fmtCurrencyCents, fmtInt } from "@/lib/format";
import { getClients, getLeads, resolveClient } from "@/lib/metrics/queries";
import { rangeFromSearch } from "@/lib/range";
import type {
  Client,
  Lead,
  LeadChannel,
  LeadSource,
  LeadStatus,
} from "@/lib/types";
import { createLead, updateLeadStatus } from "./actions";

type SP = Promise<Record<string, string | string[] | undefined>>;

const STATUS: Array<{
  value: LeadStatus;
  label: string;
  accent: string;
  dot: string;
}> = [
  { value: "new", label: "Novo", accent: "border-sky-200", dot: "bg-sky-500" },
  {
    value: "contacted",
    label: "Em contato",
    accent: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  {
    value: "qualified",
    label: "Qualificado",
    accent: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "quote",
    label: "Orçamento",
    accent: "border-orange-200",
    dot: "bg-orange-500",
  },
  { value: "won", label: "Ganho", accent: "border-brand-border", dot: "bg-brand" },
  { value: "lost", label: "Perdido", accent: "border-rose-200", dot: "bg-rose-500" },
];

const CHANNEL_LABEL: Record<LeadChannel, string> = {
  whatsapp: "WhatsApp",
  meta_conversation: "Conversa Meta",
  form: "Formulário",
  phone_call: "Ligação",
  manual: "Cadastro manual",
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  site: "Site",
  organic: "Orgânico",
  direct: "Direto",
  referral: "Indicação",
  manual: "Manual",
  other: "Outro",
};

export default async function CrmPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { range } = rangeFromSearch(sp);
  const clients = await getClients();
  const client = resolveClient(clients, sp.client);
  const leads = await getLeads(range, client?.id);
  const returnTo = buildReturnTo(sp);
  const created = first(sp.created);
  const updated = first(sp.updated);
  const error = first(sp.error);

  const active = leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const won = leads.filter((lead) => lead.status === "won");
  const pipelineValue = active.reduce((sum, lead) => sum + (lead.value ?? 0), 0);
  const wonValue = won.reduce((sum, lead) => sum + (lead.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM de contatos"
        subtitle={`Leads individuais do período · ${client ? client.name : "Todos os clientes"}`}
      />

      {(created || updated) && (
        <Feedback tone="success" message={created ?? updated ?? "Atualizado."} />
      )}
      {error && <Feedback tone="error" message={error} />}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Leads no período"
          value={fmtInt(leads.length)}
          icon={UsersRound}
          help="Registros individuais adicionados ao CRM. Não é a soma de conversões das plataformas."
        />
        <KpiCard
          label="Em andamento"
          value={fmtInt(active.length)}
          icon={MessageCircleMore}
          help="Leads que ainda não foram marcados como ganhos ou perdidos."
        />
        <KpiCard
          label="Valor em aberto"
          value={fmtCurrencyCents(pipelineValue)}
          icon={BadgeDollarSign}
          help="Soma dos valores estimados dos leads em andamento."
        />
        <KpiCard
          label="Valor ganho"
          value={fmtCurrencyCents(wonValue)}
          icon={Trophy}
          help="Soma dos valores dos leads marcados como ganhos no período."
        />
      </div>

      <Card>
        <CardHeader
          title="Adicionar contato"
          subtitle="Cadastre um lead real. As plataformas continuam como fonte de atribuição; o CRM representa pessoas/negócios."
        />
        <CardBody>
          <LeadForm clients={clients} selectedClient={client} returnTo={returnTo} />
        </CardBody>
      </Card>

      {leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum lead individual neste período"
          description="Adicione o primeiro contato acima. A importação automática poderá ser ligada depois que a migration e os workflows forem aprovados."
        />
      ) : (
        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Funil comercial</h2>
              <p className="mt-1 text-sm text-muted">
                Mova o contato escolhendo a nova etapa em cada card.
              </p>
            </div>
            <Badge variant="neutral">{leads.length} registros</Badge>
          </div>
          <div className="grid snap-x grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4 overflow-x-auto pb-3 xl:grid-flow-row xl:grid-cols-3 2xl:grid-cols-6">
            {STATUS.map((column) => (
              <LeadColumn
                key={column.value}
                column={column}
                leads={leads.filter((lead) => lead.status === column.value)}
                clients={clients}
                returnTo={returnTo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadForm({
  clients,
  selectedClient,
  returnTo,
}: {
  clients: Client[];
  selectedClient: Client | null;
  returnTo: string;
}) {
  return (
    <form action={createLead} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label className="field-label" htmlFor="crm-client">
          Cliente
        </label>
        <select
          id="crm-client"
          name="clientId"
          className="input"
          autoComplete="off"
          required
          defaultValue={selectedClient?.id ?? ""}
        >
          <option value="" disabled>
            Selecione
          </option>
          {clients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="crm-name">
          Nome
        </label>
        <input id="crm-name" name="name" className="input" autoComplete="name" placeholder="Ex.: João Silva…" />
      </div>
      <div>
        <label className="field-label" htmlFor="crm-phone">
          Telefone / WhatsApp
        </label>
        <input id="crm-phone" name="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex.: (51) 99999-9999…" />
      </div>
      <div>
        <label className="field-label" htmlFor="crm-email">
          E-mail
        </label>
        <input id="crm-email" name="email" className="input" type="email" autoComplete="email" spellCheck={false} placeholder="Ex.: contato@empresa.com…" />
      </div>
      <div>
        <label className="field-label" htmlFor="crm-channel">
          Tipo de contato
        </label>
        <select id="crm-channel" name="channel" className="input" autoComplete="off" defaultValue="whatsapp">
          {Object.entries(CHANNEL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="crm-source">
          Origem atribuída
        </label>
        <select id="crm-source" name="source" className="input" autoComplete="off" defaultValue="google_ads">
          {Object.entries(SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="crm-date">
          Data do contato
        </label>
        <input
          id="crm-date"
          name="occurredAt"
          type="datetime-local"
          className="input"
          autoComplete="off"
          required
          defaultValue={saoPauloDateTimeLocal()}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="crm-value">
          Valor estimado
        </label>
        <input id="crm-value" name="value" className="input" inputMode="decimal" autoComplete="off" placeholder="Ex.: R$ 1.500,00…" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="crm-campaign">
          Campanha
        </label>
        <input id="crm-campaign" name="campaign" className="input" autoComplete="off" placeholder="Ex.: Busca — materiais…" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="crm-notes">
          Observações
        </label>
        <textarea id="crm-notes" name="notes" className="input min-h-20 resize-y py-2" autoComplete="off" placeholder="Ex.: pediu orçamento de madeira e aguarda retorno…" />
      </div>
      <div className="md:col-span-2 xl:col-span-4 flex justify-end">
        <SubmitButton pendingLabel="Adicionando…" className="btn btn-primary min-h-11">
          <UserPlus size={16} />
          Adicionar ao funil
        </SubmitButton>
      </div>
    </form>
  );
}

function LeadColumn({
  column,
  leads,
  clients,
  returnTo,
}: {
  column: (typeof STATUS)[number];
  leads: Lead[];
  clients: Client[];
  returnTo: string;
}) {
  return (
    <section className={`min-h-[220px] snap-start rounded-[14px] border ${column.accent} bg-surface-2 p-3`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
          {column.label}
        </h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted ring-1 ring-line">
          {leads.length}
        </span>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            client={clients.find((item) => item.id === lead.clientId)}
            returnTo={returnTo}
          />
        ))}
        {leads.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-line-strong px-3 py-8 text-center text-xs text-faint">
            Nenhum contato nesta etapa
          </p>
        )}
      </div>
    </section>
  );
}

function LeadCard({
  lead,
  client,
  returnTo,
}: {
  lead: Lead;
  client?: Client;
  returnTo: string;
}) {
  const title = lead.name || lead.phone || lead.email || "Contato sem nome";
  return (
    <article className="rounded-[12px] border border-line bg-surface p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-ink">{title}</h4>
          {client && <p className="mt-0.5 truncate text-[11px] text-faint">{client.name}</p>}
        </div>
        {lead.value != null && (
          <span className="shrink-0 text-xs font-bold text-brand-ink">
            {fmtCurrencyCents(lead.value)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="neutral">{CHANNEL_LABEL[lead.channel]}</Badge>
        <Badge variant="neutral">{SOURCE_LABEL[lead.source]}</Badge>
      </div>

      {(lead.phone || lead.email) && (
        <div className="mt-3 space-y-1.5 text-xs text-muted">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-ink">
              <Phone size={12} aria-hidden="true" />
              {lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 truncate hover:text-ink">
              <Mail size={12} aria-hidden="true" />
              {lead.email}
            </a>
          )}
        </div>
      )}

      {lead.campaign && (
        <p className="mt-3 line-clamp-2 text-xs text-muted">
          <span className="font-semibold text-ink">Campanha:</span> {lead.campaign}
        </p>
      )}
      {lead.notes && <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{lead.notes}</p>}
      <p className="mt-3 text-[11px] text-faint">
        {new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        }).format(new Date(lead.occurredAt))}
      </p>

      <form action={updateLeadStatus} className="mt-3 border-t border-line pt-3">
        <input type="hidden" name="leadId" value={lead.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="sr-only" htmlFor={`status-${lead.id}`}>
          Etapa de {title}
        </label>
        <div className="flex gap-2">
          <select
            id={`status-${lead.id}`}
            name="status"
            defaultValue={lead.status}
            autoComplete="off"
            className="input h-9 min-w-0 flex-1 px-2 text-xs"
          >
            {STATUS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <SubmitButton pendingLabel="Salvando…" className="btn btn-secondary h-9 px-3 text-xs">
            Salvar
          </SubmitButton>
        </div>
      </form>
    </article>
  );
}

function Feedback({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const Icon = tone === "success" ? CircleCheckBig : CircleAlert;
  return (
    <div
      className={`flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm font-semibold ${
        tone === "success"
          ? "border-brand-border bg-brand-soft text-brand-ink"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon size={17} aria-hidden="true" />
      {message}
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildReturnTo(sp: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (["created", "updated", "error"].includes(key)) continue;
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
  }
  return params.size ? `/crm?${params.toString()}` : "/crm";
}

function saoPauloDateTimeLocal(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
