import { CheckCircle2, CircleAlert, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getClients, getIntegrationAccounts } from "@/lib/metrics/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Client, IntegrationAccount, IntegrationProvider } from "@/lib/types";
import { createClientWithAccounts } from "./actions";

type SP = Promise<Record<string, string | string[] | undefined>>;

const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  ga4: "GA4",
  gtm: "GTM",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const [clients, accounts] = await Promise.all([
    getClients(),
    getIntegrationAccounts(),
  ]);
  const created = Array.isArray(sp.created) ? sp.created[0] : sp.created;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes e integrações"
        subtitle="Cliente é a empresa atendida. Integrações são as fontes de dados ligadas a ela."
      />

      {created && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-ink">
          <CheckCircle2 size={17} />
          Cliente cadastrado: {created}
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="flex items-center gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm font-semibold text-[#92400e]">
          <CircleAlert size={17} />
          Modo demonstração ativo. Configure o Supabase para salvar novos
          clientes.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ClientForm />
        <div className="space-y-6">
          <CollectionFlow />
          <ClientList clients={clients} accounts={accounts} />
        </div>
      </div>
    </div>
  );
}

function ClientForm() {
  return (
    <Card>
      <CardHeader
        title="Novo cliente"
        subtitle="Cadastre a empresa e os IDs que apontam para as fontes que serão coletadas."
      />
      <CardBody>
        <form action={createClientWithAccounts} className="space-y-5">
          <FormSection
            title="Dados do cliente"
            description="Informações usadas para filtrar o painel e organizar permissões."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="name">
                Nome do cliente
              </label>
              <input
                id="name"
                name="name"
                required
                className="input"
                placeholder="Ex.: Clínica Aurora"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="slug">
                Apelido/slug
              </label>
              <input
                id="slug"
                name="slug"
                className="input"
                placeholder="clinica-aurora"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="status">
                Status
              </label>
              <select id="status" name="status" className="input" defaultValue="active">
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="websiteUrl">
                Site
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                className="input"
                placeholder="https://cliente.com.br"
              />
            </div>
          </div>

          <FormSection
            title="Mapeamento das integrações"
            description="IDs identificam quais contas o n8n deve buscar. Tokens, OAuth e chaves de API ficam configurados no n8n."
          />

          <div className="rounded-[10px] border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
            <p className="font-semibold text-ink">ID não é credencial.</p>
            <p className="mt-1">
              O GTM ajuda no tracking do site, mas as métricas do painel vêm das
              APIs de Google Ads, Meta Ads e GA4.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AccountField
              id="googleAdsCustomerId"
              label="Google Ads Customer ID"
              placeholder="123-456-7890"
            />
            <AccountField
              id="metaAdAccountId"
              label="Meta Ad Account ID"
              placeholder="act_123456789"
            />
            <AccountField
              id="ga4PropertyId"
              label="GA4 Property ID"
              placeholder="123456789"
            />
            <AccountField
              id="gtmContainerId"
              label="GTM Container ID (auditoria)"
              placeholder="GTM-XXXXXXX"
            />
          </div>

          <button
            type="submit"
            disabled={!isSupabaseConfigured}
            className="btn btn-primary w-full"
          >
            <Plus size={16} />
            Salvar cliente e integrações
          </button>
        </form>
      </CardBody>
    </Card>
  );
}

function FormSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function AccountField({
  id,
  label,
  placeholder,
}: {
  id: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} className="input" placeholder={placeholder} />
    </div>
  );
}

function CollectionFlow() {
  return (
    <Card>
      <CardHeader
        title="Como a coleta funciona"
        subtitle="O painel não puxa API direto do navegador."
      />
      <CardBody className="space-y-3">
        {[
          "O painel guarda cliente, IDs externos e status da integração.",
          "O n8n guarda credenciais OAuth, tokens e chaves em ambiente seguro.",
          "Workflows agendados consultam Google Ads, Meta Ads e GA4.",
          "O n8n grava no Supabase; o painel lê e mostra as métricas.",
        ].map((item, index) => (
          <div key={item} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink">
              {index + 1}
            </span>
            <p className="text-sm text-muted">{item}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function ClientList({
  clients,
  accounts,
}: {
  clients: Client[];
  accounts: IntegrationAccount[];
}) {
  return (
    <Card>
      <CardHeader
        title="Integrações cadastradas"
        subtitle={`${clients.length} clientes · ${accounts.length} integrações`}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-3 py-3">Fonte</th>
              <th className="px-3 py-3">Origem</th>
              <th className="px-3 py-3">ID externo</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.flatMap((client) => {
              const clientAccounts = accounts.filter(
                (account) => account.clientId === client.id,
              );
              if (!clientAccounts.length) {
                return (
                  <tr key={client.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-semibold text-ink">
                      {client.name}
                    </td>
                    <td className="px-3 py-3 text-muted" colSpan={3}>
                      Nenhuma integração cadastrada
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={client.status === "active" ? "brand" : "warning"}>
                        {client.status === "active" ? "Ativo" : "Pausado"}
                      </Badge>
                    </td>
                  </tr>
                );
              }
              return clientAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  className="border-b border-line last:border-0 hover:bg-surface-2"
                >
                  <td className="px-5 py-3">
                    {index === 0 && (
                      <div>
                        <p className="font-semibold text-ink">{client.name}</p>
                        <p className="text-xs text-faint">{client.slug}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium text-ink">
                    {account.accountName}
                    {account.websiteUrl && (
                      <p className="text-xs font-normal text-faint">
                        {account.websiteUrl}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {PROVIDER_LABEL[account.provider]}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">
                    {account.externalId}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(account.status)}>
                      {statusLabel(account.status)}
                    </Badge>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function statusVariant(status: IntegrationAccount["status"]) {
  if (status === "connected") return "brand";
  if (status === "error") return "danger";
  if (status === "paused") return "warning";
  return "neutral";
}

function statusLabel(status: IntegrationAccount["status"]) {
  const labels: Record<IntegrationAccount["status"], string> = {
    pending: "Pendente",
    connected: "Conectado",
    error: "Erro",
    paused: "Pausado",
  };
  return labels[status];
}
