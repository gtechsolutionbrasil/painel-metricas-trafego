# Padrão de UTMs — Madeireira Adrianna

Objetivo: fazer GA4, Google Ads, Meta Ads e o mini-CRM falarem a mesma língua.
Use nomes estáveis, minúsculos e sem acentos nos valores manuais.

## Campos obrigatórios

| Campo | Google Ads | Meta Ads | Outros links |
|---|---|---|---|
| `utm_source` | `google` | `{{site_source_name}}` | canal real, ex. `instagram` |
| `utm_medium` | `cpc` | `paid_social` | ex. `organic`, `referral`, `email` |
| `utm_campaign` | `{campaignid}` | `{{campaign.id}}` | slug estável da campanha |
| `utm_content` | `{creative}` | `{{ad.id}}` | anúncio/criativo |
| `utm_term` | `{keyword}` | `{{adset.id}}` | palavra-chave ou conjunto |

## Google Ads

Sufixo de URL final preparado:

```text
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

Não substituir a URL final da landing page. Configurar como sufixo e validar o
clique com o Tag Assistant.

## Meta Ads

Parâmetros de URL preparados:

```text
utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.id}}&utm_content={{ad.id}}&utm_term={{adset.id}}
```

IDs são preferíveis a nomes dinâmicos porque renomear campanhas não quebra a
série. O painel pode enriquecer os IDs com nomes para leitura humana.

## Regras de qualidade

- nunca usar `utm_medium=cpc` no Meta;
- não alternar `facebook`, `fb` e `meta` manualmente;
- preservar `gclid`, `gbraid`, `wbraid` e `fbclid` nos redirects;
- registrar UTMs junto do lead quando formulário/WhatsApp fornecer os dados;
- revisar semanalmente a taxa de `(not set)`/origem desconhecida.

Este padrão ainda não foi publicado nas contas de anúncio.
