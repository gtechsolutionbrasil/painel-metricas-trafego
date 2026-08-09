import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";

const directory = join(process.cwd(), "n8n");
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".workflow.json"))
  .sort();

let failed = false;
for (const file of files) {
  const workflow = JSON.parse(await readFile(join(directory, file), "utf8"));
  const names = new Set();
  const ids = new Set();
  const errors = [];

  for (const node of workflow.nodes ?? []) {
    if (!node.name || names.has(node.name)) errors.push(`nome inválido/duplicado: ${node.name}`);
    if (!node.id || ids.has(node.id)) errors.push(`id inválido/duplicado: ${node.id}`);
    names.add(node.name);
    ids.add(node.id);
    if (node.type === "n8n-nodes-base.code" && node.parameters?.jsCode) {
      try {
        new vm.Script(`(async () => {${node.parameters.jsCode}\n})()`);
      } catch (error) {
        errors.push(`Code node ${node.name}: ${error.message}`);
      }
    }
  }

  for (const [source, outputs] of Object.entries(workflow.connections ?? {})) {
    if (!names.has(source)) errors.push(`origem ausente: ${source}`);
    for (const group of outputs.main ?? []) {
      for (const connection of group ?? []) {
        if (!names.has(connection.node)) errors.push(`destino ausente: ${connection.node}`);
      }
    }
  }

  if (errors.length) {
    failed = true;
    console.error(`${file}: ${errors.join("; ")}`);
  } else {
    console.log(`${file}: ${workflow.nodes.length} nós, estrutura válida`);
  }
}

if (failed) process.exitCode = 1;
