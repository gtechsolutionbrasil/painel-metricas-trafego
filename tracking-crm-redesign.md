# Plano — tracking confiável + mini CRM

## Objetivo

Trocar a leitura genérica de “conversões” por uma visão operacional que separa:

- **contatos primários:** WhatsApp, conversas Meta, formulário confirmado e ligação;
- **intenção local:** pedido de rota e visita à loja;
- **comportamento:** sessão, página vista e demais eventos do site.

Nenhuma fonte será somada como se representasse pessoas únicas. Google Ads,
Meta Ads e GA4 serão mostrados lado a lado, com origem e definição visíveis.

## Entregas locais

1. Migration `0014`: `web_events`, `tracking_checks`, `leads` e histórico de
   status, com índices, RLS e seed do GTM da Madeireira.
2. Taxonomia única de resultados para classificar ações do Google e eventos
   GA4 sem misturar contatos, rotas, visitas e microeventos.
3. Nova visão geral orientada a decisão: investimento, contatos por fonte,
   intenção local, tráfego e saúde do tracking.
4. Página Sites com eventos relevantes e alertas de qualidade; remoção da
   alegação incorreta de “pessoas únicas”.
5. Google Ads com WhatsApp/ligação visíveis e KPI baseado somente em contatos
   primários; detalhamento local separado.
6. Mini CRM em `/crm`, com cadastro manual, funil por status, origem/campanha,
   notas e atualização segura via Server Actions.
7. Integrações com saúde, última sincronização, checklist e significado de
   cada fonte antes do formulário de cadastro.
8. Workflow GA4 local preparado para eventos e status; workflow Google local
   alinhado a `all_conversions`; documentação operacional atualizada.

## Critérios de aceite

- O painel não chama rota/visita de contato e não exibe um total misturado.
- Cada número informa a fonte e se é ação, sessão ou lead do CRM.
- Ações do CRM validam entrada, autenticação e acesso ao cliente.
- Interfaces funcionam em desktop e mobile, com foco e rótulos acessíveis.
- `npm run lint`, `tsc --noEmit`, `npm run build` e auditorias passam.

## Gates de publicação (opção 3B)

Exigem aprovação separada antes da execução: aplicar migration no Supabase,
alterar/importar/ativar n8n, editar/publicar GTM, mudar metas no GA4/Google Ads,
alterar Pixel/CAPI Meta e fazer deploy Vercel. Até lá, tudo fica preparado e
validado localmente.
