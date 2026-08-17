// ---------------------------------------------------------------------------
// Modo apresentação: esconde números sensíveis pra mostrar o painel ao
// cliente sem susto. Este é o registro central ÚNICO do que é sensível —
// as telas consultam daqui; nunca duplicar a lista em componente.
// Sensível: custos unitários (custo por contato/conversa, custo por clique)
// e saldo da conta. Investimento total CONTINUA visível (decisão da spec).
// É toggle de exibição, não controle de acesso.
// ---------------------------------------------------------------------------
export type SensitiveMetric = "cost_per_result" | "cpc" | "account_balance";

const SENSITIVE: ReadonlySet<SensitiveMetric> = new Set([
  "cost_per_result",
  "cpc",
  "account_balance",
]);

// Estado vem da URL (?apresentacao=1), como os demais filtros do painel.
export function presentationFromSearch(
  sp: Record<string, string | string[] | undefined>,
): boolean {
  const raw = Array.isArray(sp.apresentacao)
    ? sp.apresentacao[0]
    : sp.apresentacao;
  return raw === "1";
}

// A métrica deve sumir? (só quando o modo está ativo E ela é sensível)
export function hideMetric(
  metric: SensitiveMetric,
  presentationOn: boolean,
): boolean {
  return presentationOn && SENSITIVE.has(metric);
}
