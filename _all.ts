import { readFileSync, writeFileSync } from "fs";
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v) };
const rf = globalThis.fetch;
globalThis.fetch = (async (u: any, ...r: any[]) => {
  const s = String(u);
  if (s.startsWith("/")) { try { return new Response(readFileSync(process.cwd() + "/public" + s)); } catch { return new Response(null, { status: 404 }); } }
  return rf(u, ...r);
}) as any;
const { parseProject } = await import("./src/utils/project-file");
const { buildPack } = await import("./src/utils/pack-builder");
const { serverFormTemplate } = await import("./src/utils/json-ui-templates");
const home = process.env.HOME!;

// FFA a partir do projeto
const p = parseProject(readFileSync(home + "/Downloads/ffa-projeto.json", "utf8")).project!;
const b = await buildPack({ screens: p.screens as any, packName: p.packName, triggerItem: p.triggerItem, scriptApi: p.scriptApi as any });
writeFileSync(home + "/Downloads/" + b.filename, Buffer.from(await b.blob.arrayBuffer()));
console.log("ffa.mcaddon:", b.warnings.length ? b.warnings : "sem avisos");

// newsystem: só troca o server_form (a tela já foi corrigida antes)
const base = process.env.FIX!;
writeFileSync(base + "/newsystem_RP/ui/server_form.json", serverFormTemplate([{ flag: "Sistema", namespace: "sistema" }]));
for (const pack of ["newsystem_RP", "newsystem_BP"]) {
  const mp = `${base}/${pack}/manifest.json`;
  const m = JSON.parse(readFileSync(mp, "utf8"));
  m.header.version = [1, 0, 2];
  for (const mod of m.modules) mod.version = [1, 0, 2];
  for (const dep of m.dependencies ?? []) if (dep.uuid) dep.version = [1, 0, 2];
  writeFileSync(mp, JSON.stringify(m, null, 4));
}
console.log("newsystem: server_form sem fallback, versão 1.0.2");
