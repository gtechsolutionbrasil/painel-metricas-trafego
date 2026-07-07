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
        mode: "runOnceForAllItems",
        jsCode: code,
      },
      id: "a49d9ec7-a045-4c46-975f-57d8c66dd821",
      name: "Sincronizar Meta Ads",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [280, 80],
      notes:
        "Le integration_accounts provider=meta_ads, consulta Meta Marketing API e faz upsert em ad_metrics, ad_campaigns e ad_conversion_actions.",
    },
  ],
  connections: {
    "Executar manualmente": {
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
    "Agendar 07:00": {
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
