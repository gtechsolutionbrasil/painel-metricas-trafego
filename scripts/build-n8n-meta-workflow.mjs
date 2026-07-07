import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const code = readFileSync(join(root, "n8n/meta-ads-sync-code.js"), "utf8");

const workflow = {
  name: "Meta Ads -> Supabase",
  nodes: [
    {
      parameters: {},
      id: "b8b98f2e-65b6-4e36-b8ff-56105b06c46a",
      name: "Executar manualmente",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [0, 0],
    },
    {
      parameters: {
        rule: {
          interval: [
            {
              field: "cronExpression",
              expression: "0 7 * * *",
            },
          ],
        },
      },
      id: "bc3b3ec1-712f-4d6d-8f4e-25c0becda4f7",
      name: "Agendar 07:00",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [0, 180],
    },
    {
      parameters: {
        assignments: {
          assignments: [
            {
              id: "51f3d8e9-d5e2-46fe-a8d5-9dd982af1bf7",
              name: "SUPABASE_URL",
              value: "COLE_AQUI_SUPABASE_URL",
              type: "string",
            },
            {
              id: "f6a2e117-23d2-43a2-b314-45c5282dbdad",
              name: "SUPABASE_SERVICE_ROLE_KEY",
              value: "COLE_AQUI_SUPABASE_SERVICE_ROLE_KEY",
              type: "string",
            },
            {
              id: "354144ab-2d8f-467c-9a69-d9c6c064dfb3",
              name: "META_ACCESS_TOKEN",
              value: "COLE_AQUI_META_ACCESS_TOKEN",
              type: "string",
            },
            {
              id: "74b52ab8-0f09-4a7e-9d25-02982f57d605",
              name: "META_GRAPH_API_VERSION",
              value: "v21.0",
              type: "string",
            },
            {
              id: "af1d6e96-bf05-41ce-8f46-c9f1052ecec5",
              name: "META_DATE_PRESET",
              value: "last_30d",
              type: "string",
            },
          ],
        },
        options: {},
      },
      id: "d98a6efa-3967-4a93-9aa6-8d88fc5d04618",
      name: "Configurar segredos",
      type: "n8n-nodes-base.set",
      typeVersion: 3.4,
      position: [280, 80],
      notes:
        "Cole aqui os valores reais antes de testar. Este plano do n8n nao tem Variables liberado.",
    },
    {
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: code,
      },
      id: "a49d9ec7-a045-4c46-975f-57d8c66dd821",
      name: "Sincronizar Meta Ads",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [560, 80],
      notes:
        "Le integration_accounts provider=meta_ads, consulta Meta Marketing API e faz upsert em ad_metrics, ad_campaigns e ad_conversion_actions.",
    },
  ],
  connections: {
    "Executar manualmente": {
      main: [
        [
          {
            node: "Configurar segredos",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Agendar 07:00": {
      main: [
        [
          {
            node: "Configurar segredos",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Configurar segredos": {
      main: [
        [
          {
            node: "Sincronizar Meta Ads",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
  },
  pinData: {},
  settings: {
    executionOrder: "v1",
  },
  staticData: null,
  tags: [],
  triggerCount: 0,
  updatedAt: new Date().toISOString(),
  versionId: "8b61768f-3a3a-42d4-92f8-495eb470ff65",
};

writeFileSync(
  join(root, "n8n/meta-ads-supabase.workflow.json"),
  `${JSON.stringify(workflow, null, 2)}\n`,
);

console.log("n8n/meta-ads-supabase.workflow.json gerado.");
