# Integrações: Google Ads, Meta Ads, GA4 e GTM

Este painel não deve pedir para o usuário "logar na conta de anúncio" a cada
acesso. O modelo correto é:

1. o cliente/agência autoriza o acesso uma vez;
2. o n8n guarda a credencial/token em ambiente seguro;
3. workflows agendados buscam dados nas APIs;
4. o n8n grava métricas normalizadas no Supabase;
5. o painel só lê o Supabase com RLS.

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
- `gtm_container_id` (para auditoria, não para métrica diária)
- domínio do site
- eventos considerados conversão: lead, whatsapp, phone, route, purchase etc.

## Fluxo recomendado no n8n

Crie 3 workflows agendados:

1. **Google Ads -> Supabase**
   - entrada: lista de clientes com `google_ads_customer_id`
   - consulta: Google Ads API por dia/campanha
   - saída: upsert em `ad_metrics` com `platform = 'google'`

2. **Meta Ads -> Supabase**
   - entrada: lista de clientes com `meta_ad_account_id`
   - consulta: Marketing API Insights por dia/campanha
   - saída: upsert em `ad_metrics` com `platform = 'meta'`

3. **GA4 -> Supabase**
   - entrada: lista de clientes com `ga4_property_id`
   - consulta: GA4 Data API por dia/origem/mídia e eventos
   - saída: upsert em `web_metrics`

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
