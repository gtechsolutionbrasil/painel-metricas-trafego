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

Para criar/organizar a MCC:

1. Entre no Google Ads com a conta da agência.
2. Crie uma **conta de administrador** (Manager Account/MCC) ou use a conta
   **GTech Solution Brasil** se ela já for uma conta de administrador.
3. Em cada conta de cliente, solicite/adiciona acesso da MCC pelo ID de
   administrador.
4. Guarde no cadastro do painel o `customer_id` da conta final do cliente, não
   apenas o ID da MCC.
5. No n8n, configure uma credencial OAuth da sua conta/agência e o Developer
   Token do Google Ads API.

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

Para o seu caso, como sua conta já aparece com acesso a vários portfólios/BMs:

1. Use o Business/portfólio da agência como central operacional.
2. Confirme que sua conta ou o Business da agência tem acesso às contas de
   anúncio dos clientes.
3. Crie uma credencial no n8n com token de longa duração ou System User ligado
   ao Business.
4. Cadastre no painel o `act_...` de cada conta de anúncios final.
5. O n8n usa a credencial central e consulta cada `act_...` mapeado no painel.

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

Use GA4 quando o cliente tem site e você quer medir o pós-clique:

- sessões e usuários;
- origem/mídia (`google / cpc`, `facebook / paid`, orgânico etc.);
- páginas vistas;
- eventos do site;
- leads de formulário, WhatsApp, ligação, rota e compra quando configurados.

O GA4 não substitui Google Ads nem Meta Ads para mídia paga, porque ele não é a
fonte principal de custo, impressões, campanhas e entrega das plataformas. Ele
complementa os Ads mostrando o comportamento no site.

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
- eventos esperados e sua classe: WhatsApp/formulário/ligação são contatos;
  rota é intenção local e não entra no mesmo total.

O GTM entra na página de **Integrações** como status/auditoria de tracking:
container instalado, eventos publicados e tags disparando. A aba **GA4 / Sites**
mostra as métricas que o GA4 recebeu depois desses disparos.

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
   - saída: upsert em `web_metrics`, `web_events` e `tracking_checks` com
     `account_external_id`

O GTM entra como fonte de auditoria de tracking. Ele não entrega as métricas
diárias do painel; ele dispara eventos que depois aparecem em GA4, Google Ads e
Meta quando as tags estão corretas.

O painel separa tráfego pago por plataforma e GA4/sites por origem. A camada de
qualidade de tracking está preparada no código local; migration e workflows
ainda dependem dos gates de publicação.

## Camada operacional preparada

A página **Integrações** por cliente passa a mostrar:

- status Google Ads, Meta Ads, GA4 e GTM;
- IDs conectados (`customer_id`, `ad_account_id`, `property_id`, container GTM);
- última sincronização e quantidade de linhas importadas;
- alerta de tracking quebrado, por exemplo evento GA4 sem conversão no Ads;
- checklist de eventos: WhatsApp, formulário, ligação, rota, compra.

A página **Sites** mostra eventos por canal:

- WhatsApp clicks
- formulários enviados
- ligações
- cliques em rota/como chegar
- compras ou leads qualificados

O mini-CRM acrescenta a etapa que a mídia não confirma sozinha:
investimento -> clique -> sessão -> evento -> lead -> orçamento -> venda.

## Estado implementado no painel

O painel já possui uma primeira versão operacional:

- barra superior com filtros de cliente, fonte de dados, origem paga
  (Google Ads/Meta Ads) e período;
- página **Sites** para sessões, origem/mídia, eventos e métricas web vindas do
  GA4, sem somar usuários agregados como se fossem únicos;
- página **Clientes e integrações** para cadastrar cliente e IDs de Google Ads,
  Meta Ads, GA4 e GTM, deixando claro que credenciais ficam no n8n;
- tabela `integration_accounts`;
- campo `account_external_id` em `ad_metrics` e `web_metrics` para o n8n
  permitir filtro por fonte;
- visão geral sem um total misturando Meta, Google e GA4;
- mini-CRM com funil e histórico de status;
- checks de eventos e última sincronização no quadro de Integrações.

Consulte o [plano de publicação](plano-publicacao-tracking-madeireira.md) e o
[padrão de UTMs](utm-padrao.md).
