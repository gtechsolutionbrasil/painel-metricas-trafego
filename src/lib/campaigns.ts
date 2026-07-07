type SP = Record<string, string | string[] | undefined>;

// Lê ?campaign (parâmetro repetível) e devolve o conjunto de campanhas
// selecionadas, restrito às conhecidas. Vazio = sem filtro (todas aparecem).
export function selectedCampaigns(
  sp: SP,
  known: { campaign: string }[],
): Set<string> {
  const raw = Array.isArray(sp.campaign)
    ? sp.campaign
    : sp.campaign
      ? [sp.campaign]
      : [];
  const knownSet = new Set(known.map((c) => c.campaign));
  return new Set(raw.filter((c) => knownSet.has(c)));
}
