import {
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Link2,
  ListChecks,
  Plus,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getClients, getIntegrationAccounts } from "@/lib/metrics/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Client, IntegrationAccount, IntegrationProvider } from "@/lib/types";
import { createClientWithAccounts, setAccountRecharge } from "./actions";
import { DeleteClientButton } from "./DeleteClientButton";

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
  const deleted = Array.isArray(sp.deleted) ? sp.deleted[0] : sp.deleted;
  const recharge = Array.isArray(sp.recharge) ? sp.recharge[0] : sp.recharge;
  const errorMsg = Array.isArray(sp.error) ? sp.error[0] : sp.error;

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

      {deleted && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-ink">
          <CheckCircle2 size={17} />
          Cliente excluído: {deleted}
        </div>
      )}

      {recharge && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-ink">
          <CheckCircle2 size={17} />
          {recharge === "cleared"
            ? "Recarga removida — o card de saldo sai do painel."
            : "Recarga registrada — o saldo aparece na página do canal."}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#991b1b]">
          <CircleAlert size={17} />
          {errorMsg}
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
          <NewClientGuide />
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
              Primeiro vincule as contas nas plataformas. Depois cole aqui os
              IDs para o n8n saber qual conta buscar para este cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AccountField
              id="googleAdsCustomerId"
              label="Google Ads Customer ID"
              placeholder="123-456-7890"
              help="ID da conta final do cliente, não o MCC. Pode colar com hífens."
            />
            <AccountField
              id="metaAdAccountId"
              label="Meta Ad Account ID"
              placeholder="act_123456789"
              help="Conta de anúncios do cliente. Se vier só o número, use act_ antes."
            />
            <AccountField
              id="ga4PropertyId"
              label="GA4 Property ID"
              placeholder="123456789"
              help="ID numérico da propriedade GA4 que mede o site."
            />
            <AccountField
              id="gtmContainerId"
              label="GTM Container ID (auditoria)"
              placeholder="GTM-XXXXXXX"
              help="Ajuda a auditar tags; não substitui o GA4."
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
  help,
}: {
  id: string;
  label: string;
  placeholder: string;
  help?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} className="input" placeholder={placeholder} />
      {help && <p className="mt-1.5 text-xs leading-5 text-faint">{help}</p>}
    </div>
  );
}

function NewClientGuide() {
  const guide = [
    {
      title: "Google Ads",
      icon: Link2,
      steps: [
        "Pedir ou enviar convite pelo MCC da agência.",
        "Cliente aceita em Acesso e segurança > Gerentes.",
        "Colar aqui o Customer ID da conta final.",
      ],
      footer: "Depois de aceito, o workflow Google coleta no próximo agendamento.",
    },
    {
      title: "Meta Ads",
      icon: KeyRound,
      steps: [
        "Business do cliente compartilha a conta de anúncios com a agência.",
        "System User/token da agência precisa ter acesso à conta.",
        "Colar aqui o act_ da conta de anúncios.",
      ],
      footer: "Um token central pode ler várias contas que estiverem atribuídas a ele.",
    },
    {
      title: "Site, GA4 e GTM",
      icon: ShieldCheck,
      steps: [
        "Garantir acesso à propriedade GA4 do cliente.",
        "Conferir se o GTM publica WhatsApp, formulário, ligação e rota.",
        "Colar Property ID, domínio e Container ID.",
      ],
      footer: "GA4 mostra comportamento no site; GTM é auditoria de tags.",
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Checklist para cadastrar cliente novo"
        subtitle="Faça o vínculo real nas plataformas, depois preencha os IDs no formulário."
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {guide.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[10px] border border-line bg-surface-2 p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                    <Icon size={16} />
                  </span>
                  <p className="font-bold text-ink">{item.title}</p>
                </div>
                <ol className="mt-4 space-y-3">
                  {item.steps.map((step, index) => (
                    <li key={step} className="flex gap-2.5 text-sm text-muted">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-bold text-brand-ink ring-1 ring-line">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-faint">
                  {item.footer}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-[10px] border border-brand-border bg-brand-soft p-4 text-sm text-brand-ink md:grid-cols-[auto_1fr]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-brand">
            <ListChecks size={18} />
          </span>
          <div>
            <p className="font-bold">Regra de ouro</p>
            <p className="mt-1 text-brand-ink/80">
              Cliente novo só aparece com dados quando existem duas coisas: a
              conta está vinculada na plataforma e o ID correto está cadastrado
              aqui. Token e chaves ficam no n8n, nunca no painel.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CollectionFlow() {
  return (
    <Card>
      <CardHeader
        title="O que acontece depois de salvar"
        subtitle="O painel não puxa API direto do navegador."
      />
      <CardBody className="space-y-3">
        {[
          {
            icon: ListChecks,
            text: "O painel guarda cliente, IDs externos e status da integração.",
          },
          {
            icon: ShieldCheck,
            text: "O n8n guarda OAuth, tokens e chaves em ambiente seguro.",
          },
          {
            icon: Workflow,
            text: "Workflows agendados consultam Google Ads, Meta Ads e GA4.",
          },
          {
            icon: CheckCircle2,
            text: "O n8n grava no Supabase; o painel lê e mostra as métricas.",
          },
        ].map(({ icon: Icon, text }, index) => (
          <div key={text} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
              <Icon size={13} />
            </span>
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{index + 1}.</span>{" "}
              {text}
            </p>
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
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-faint">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-3 py-3">Fonte</th>
              <th className="px-3 py-3">Origem</th>
              <th className="px-3 py-3">ID externo</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Recarga (saldo)</th>
              <th className="px-5 py-3 text-right">Ações</th>
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
                    <td className="px-3 py-3 text-muted" colSpan={4}>
                      Nenhuma integração cadastrada
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={client.status === "active" ? "brand" : "warning"}>
                        {client.status === "active" ? "Ativo" : "Pausado"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <DeleteClientButton
                          clientId={client.id}
                          clientName={client.name}
                        />
                      </div>
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
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant(account.status)}>
                      {statusLabel(account.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <RechargeCell account={account} />
                  </td>
                  <td className="px-5 py-3">
                    {index === 0 && (
                      <div className="flex justify-end">
                        <DeleteClientButton
                          clientId={client.id}
                          clientName={client.name}
                        />
                      </div>
                    )}
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

// Recarga manual da conta pré-paga (só faz sentido em conta de anúncio).
// Valor vazio + salvar = limpa a recarga e tira o card de saldo do painel.
function RechargeCell({ account }: { account: IntegrationAccount }) {
  const isAds =
    account.provider === "google_ads" || account.provider === "meta_ads";
  if (!isAds) return <span className="text-xs text-faint">—</span>;

  return (
    <form action={setAccountRecharge} className="flex items-center gap-1.5">
      <input type="hidden" name="accountId" value={account.id} />
      <input
        name="recharge"
        defaultValue={
          account.balanceRecharge != null
            ? account.balanceRecharge.toFixed(2).replace(".", ",")
            : ""
        }
        placeholder="R$ 0,00"
        className="input h-8 w-24 px-2 text-xs"
        aria-label="Valor da recarga"
      />
      <input
        type="date"
        name="rechargeDate"
        defaultValue={account.balanceRechargeDate ?? ""}
        className="input h-8 w-[8.5rem] px-2 text-xs"
        aria-label="Data da recarga"
      />
      <button type="submit" className="btn btn-primary h-8 px-2.5 text-xs">
        Salvar
      </button>
    </form>
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
