# Integrações: Google Ads, Meta Ads, GA4 e GTM

Este painel não deve pedir para o usuário "logar na conta de anúncio" a cada
acesso. O modelo correto é:

1. o cliente/agência autoriza o acesso uma vez;
2. o n8n guarda a credencial/token em ambiente seguro;
3. workflows agendados buscam dados nas APIs;
4. o n8n grava métricas normalizadas no Supabase;
5. o painel só lê o Supabase com RLS.

Importante: cadastrar um cliente no painel **não** faz o n8n puxar métricas
sozinho. O cadastro serve para mapear IDs externos ao `client_id` interno. A
coleta só acontece depois que as credenciais de Google, Meta, GA4 e Supabase
estiverem configuradas nos workflows do n8n.

## Como conectar cada fonte

### Google Ads

Melhor cenário: usar a conta de administrador da agência (MCC/Manager Account).
O cliente concede acesso à conta de anúncios dele para o MCC. Depois, um único
OAuth da agência pode consultar os `customer_id` vinculados.

Quando você acessa com a conta Google do próprio cliente, o ideal ainda é pedir
para ele conceder acesso ao MCC da agência. Se não for possível, faça uma
autorização OAuth uma vez com o usuário do cliente e guarde o refresh token no
n8n/credencial segura. O painel não precisa conhecer essa senha.

Dados principais para salvar por cliente:

- `google_ads_customer_id`
- `account_external_id` nas linhas de `ad_metrics` usando esse mesmo customer ID
- campanhas, custo, impressões, cliques e conversões via Google Ads API
- conversões vindas do site, quando configuradas no GTM/Google Ads

### Meta Ads

Melhor cenário: usar o Business Manager da agência como parceiro do Business do
cliente. Com permissão na conta de anúncios, a coleta usa a Meta Marketing API.

Quando você só entra com a conta Meta do cliente, peça para o cliente adicionar
o Business da agência como parceiro. Se não der, faça uma autorização OAuth uma
vez com o usuário do cliente e gere um token de longa duração, guardado fora do
front-end.

Dados principais para salvar por cliente:

- `meta_ad_account_id`
- `account_external_id` nas linhas de `ad_metrics` usando esse mesmo `act_...`
- campanhas, gasto, impressões, cliques, leads/conversões e valor via Insights
- eventos de Pixel/Conversions API quando estiverem disponíveis

### GA4 e sites com GTM

O GTM não é a fonte final de relatório. Ele dispara tags e eventos. As métricas
do site vêm principalmente do GA4 Data API.

Pelo print, o container já segue um padrão bom:

- eventos GA4: `generate_lead`, `phone_click`, `route_click`, `whatsapp_click`
- conversões Google Ads para formulário, ligação, rota e WhatsApp
- Meta Pixel base + eventos de Lead/Contact
- Conversion Linker em todas as páginas

Para o painel, cada cliente/site precisa mapear:

- `ga4_property_id`
- `account_external_id` nas linhas de `web_metrics` usando esse property ID
- `gtm_container_id` (para auditoria, não para métrica diária)
- domínio do site
- eventos considerados conversão: lead, whatsapp, phone, route, purchase etc.

## Fluxo recomendado no n8n

Crie 3 workflows agendados. Cada workflow deve começar lendo a tabela
`integration_accounts` para descobrir quais fontes estão pendentes/conectadas
para cada cliente.

1. **Google Ads -> Supabase**
   - credencial: OAuth/Developer Token configurado no n8n
   - entrada: integrações `provider = 'google_ads'`
   - consulta: Google Ads API por dia/campanha
   - saída: upsert em `ad_metrics` com `platform = 'google'` e
     `account_external_id`

2. **Meta Ads -> Supabase**
   - credencial: token de longa duração/System User ou OAuth no n8n
   - entrada: integrações `provider = 'meta_ads'`
   - consulta: Marketing API Insights por dia/campanha
   - saída: upsert em `ad_metrics` com `platform = 'meta'` e
     `account_external_id`

3. **GA4 -> Supabase**
   - credencial: OAuth/service account no n8n
   - entrada: integrações `provider = 'ga4'`
   - consulta: GA4 Data API por dia/origem/mídia e eventos
   - saída: upsert em `web_metrics` com `account_external_id`

O GTM entra como fonte de auditoria de tracking. Ele não entrega as métricas
diárias do painel; ele dispara eventos que depois aparecem em GA4, Google Ads e
Meta quando as tags estão corretas.

O painel atual já separa tráfego pago por plataforma e analytics web por origem.
A próxima evolução recomendada é adicionar uma camada de integrações e qualidade
de tracking.

## Mudança sugerida para o produto

Criar uma página **Integrações** por cliente com:

- status Google Ads, Meta Ads, GA4 e GTM;
- IDs conectados (`customer_id`, `ad_account_id`, `property_id`, container GTM);
- última sincronização e quantidade de linhas importadas;
- alerta de tracking quebrado, por exemplo evento GA4 sem conversão no Ads;
- checklist de eventos: WhatsApp, formulário, ligação, rota, compra.

Depois, criar uma página **Conversões do site** mostrando eventos por canal:

- WhatsApp clicks
- formulários enviados
- ligações
- cliques em rota/como chegar
- compras ou leads qualificados

Assim o painel deixa de mostrar só "mídia" e passa a mostrar a jornada completa:
investimento -> clique -> sessão -> evento -> lead/conversão.

## Estado implementado no painel

O painel já possui uma primeira versão operacional:

- barra superior com filtros de cliente, fonte de dados, origem paga
  (Google Ads/Meta Ads) e período;
- página **Clientes e integrações** para cadastrar cliente e IDs de Google Ads,
  Meta Ads, GA4 e GTM, deixando claro que credenciais ficam no n8n;
- tabela `integration_accounts`;
- campo `account_external_id` em `ad_metrics` e `web_metrics` para o n8n
  permitir filtro por fonte.
