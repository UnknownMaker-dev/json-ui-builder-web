/**
 * Monta o pacote pronto para o Minecraft a partir das telas do editor.
 *
 * Gera DOIS packs dentro de um único zip:
 *   <pack>_RP/  resource pack  — o JSON UI, o roteador server_form e as texturas
 *   <pack>_BP/  behavior pack  — o script que abre as telas
 *
 * O checklist do JSON-UI.md que este arquivo cumpre:
 *   - manifest.json na raiz de cada pack, com dois UUID diferentes (seção 16)
 *   - ui/_ui_defs.json registrando os arquivos NOVOS; server_form.json fica de
 *     fora porque tem nome de tela do jogo (seção 2)
 *   - cada textura acompanhada do .json de nineslice com o base_size real do
 *     PNG (seção 7)
 */
import JSZip from "jszip";
import type { UIElement } from "../types/element.types";
import type { UIScreen } from "../types/screen.types";
import { toNamespace, sanitizeFlag } from "../types/screen.types";
import { exportToJsonUiString, type TextureResolver } from "./json-ui-exporter";
import { serverFormTemplate, type ScreenRoute } from "./json-ui-templates";
import { generateScript } from "./scripter";
import { fetchBytes, readPngSize } from "./png";
import { getCustomTextures } from "./presets";

export type ScriptApi = "1.x" | "2.x";

/**
 * Identidade persistente do pacote.
 *
 * Os UUID precisam ser ESTÁVEIS entre exportações (JSON-UI.md, seção 16): se
 * mudarem, o Minecraft entende cada download como um pacote diferente e a lista
 * do mundo enche de cópias — e o jogador pode acabar testando uma versão velha.
 * Guardamos por pacote no navegador e subimos só o patch da versão, para o jogo
 * reconhecer a atualização do MESMO pacote.
 */
const IDENTITY_KEY = "jsonui_pack_identity";

interface PackIdentity {
  rpHeader: string;
  rpModule: string;
  bpHeader: string;
  bpModule: string;
  version: [number, number, number];
}

function loadIdentities(): Record<string, PackIdentity> {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Pega a identidade do pacote, criando na primeira vez e subindo o patch. */
function nextIdentity(packNs: string): PackIdentity {
  const all = loadIdentities();
  const current = all[packNs];

  const identity: PackIdentity = current
    ? { ...current, version: [current.version[0], current.version[1], current.version[2] + 1] }
    : {
        rpHeader: crypto.randomUUID(),
        rpModule: crypto.randomUUID(),
        bpHeader: crypto.randomUUID(),
        bpModule: crypto.randomUUID(),
        version: [1, 0, 0],
      };

  all[packNs] = identity;
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(all));
  } catch {
    // Sem localStorage o pacote ainda sai; só perde a estabilidade do UUID.
  }
  return identity;
}

export interface BuildOptions {
  screens: UIScreen[];
  packName: string;
  triggerItem: string;
  scriptApi: ScriptApi;
}

export interface BuildResult {
  blob: Blob;
  /** Nome sugerido do arquivo. */
  filename: string;
  /** Lista de arquivos gerados, para mostrar na interface. */
  files: string[];
  /** Avisos não fatais (textura que não baixou, tela vazia...). */
  warnings: string[];
}

/** Versões da API declaradas no manifest do behavior pack. */
const SCRIPT_API_VERSIONS: Record<ScriptApi, { server: string; ui: string }> = {
  "1.x": { server: "1.11.0", ui: "1.3.0" },
  "2.x": { server: "2.0.0", ui: "2.0.0" },
};

interface TextureRecord {
  /** URL no editor (data: ou /presets/...). */
  url: string;
  /** Caminho dentro do pack, sem extensão. Ex: textures/ui/meu_pack/fundo */
  packPath: string;
  /** Dados de nineslice, quando a textura for usada esticada. */
  nineslice?: number | [number, number, number, number];
}

/**
 * Registra as texturas usadas e devolve o resolver que o exporter e o scripter
 * usam para trocar a URL do editor pelo caminho dentro do pack.
 */
class TextureRegistry {
  private byUrl = new Map<string, TextureRecord>();
  private usedNames = new Set<string>();
  private packNs: string;

  constructor(packNs: string) {
    this.packNs = packNs;
  }

  register(url: string | undefined, nineslice?: TextureRecord["nineslice"]): string {
    if (!url) return "textures/ui/White";

    const existing = this.byUrl.get(url);
    if (existing) {
      // Se qualquer uso pede nineslice, a textura ganha o .json ao lado.
      if (nineslice != null && existing.nineslice == null) {
        existing.nineslice = nineslice;
      }
      return existing.packPath;
    }

    const packPath = `textures/ui/${this.packNs}/${this.uniqueName(url)}`;
    const record: TextureRecord = { url, packPath, nineslice };
    this.byUrl.set(url, record);
    return packPath;
  }

  /** Nome de arquivo curto e único dentro do pack. */
  private uniqueName(url: string): string {
    let base: string;
    if (url.startsWith("data:")) {
      base = "imagem";
    } else {
      const clean = url.split("?")[0].replace(/\.png$/i, "");
      base = clean.substring(clean.lastIndexOf("/") + 1);
    }
    base =
      base
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "textura";

    let name = base;
    let n = 2;
    while (this.usedNames.has(name)) name = `${base}_${n++}`;
    this.usedNames.add(name);
    return name;
  }

  get resolver(): TextureResolver {
    return (url: string) => this.register(url);
  }

  get all(): TextureRecord[] {
    return [...this.byUrl.values()];
  }
}

/** Varre a árvore registrando toda textura referenciada, com seu nineslice. */
function registerTreeTextures(nodes: UIElement[], reg: TextureRegistry): void {
  for (const el of nodes) {
    const p = el.properties;
    const slice = p.nineslice as TextureRecord["nineslice"] | undefined;

    if (el.type === "image" && p.texture) reg.register(p.texture, slice);
    if (el.type === "button") {
      reg.register(p.defaultTexture, slice);
      reg.register(p.hoverTexture, slice);
      reg.register(p.pressedTexture, slice);
      if (p.iconTexture) reg.register(p.iconTexture);
    }
    if (p.texture && el.type !== "image") reg.register(p.texture, slice);

    if (el.children.length) registerTreeTextures(el.children, reg);
  }
}

type Slice = number | number[];

/** Normaliza o nineslice para [esquerda, cima, direita, baixo]. */
function toBorders(slice: Slice): [number, number, number, number] {
  if (Array.isArray(slice)) {
    const [l = 0, t = 0, r = l, b = t] = slice;
    return [l, t, r, b];
  }
  return [slice, slice, slice, slice];
}

/**
 * Descobre o nineslice de uma textura, na ordem de confiança:
 *   1. o .json que veio ao lado do PNG (preset embarcado ou upload do usuário) —
 *      é o dado oficial daquela arte;
 *   2. o valor escolhido no editor.
 *
 * Os presets trazem bordas assimétricas (ex. [2,2,2,5]) que o editor guarda
 * como um número só; usar o número no pack deixaria a moldura errada no jogo.
 */
async function resolveNineslice(
  url: string,
  fromElement: Slice | undefined,
): Promise<Slice | null> {
  const stored = getCustomTextures().find((t) => t.url === url);
  if (stored?.ninesliceData?.nineslice_size != null) {
    return stored.ninesliceData.nineslice_size;
  }

  if (!url.startsWith("data:")) {
    try {
      const res = await fetch(url.replace(/\.png$/i, ".json"));
      if (res.ok) {
        const data = await res.json();
        if (data?.nineslice_size != null) return data.nineslice_size;
      }
    } catch {
      // Sem .json ao lado: cai no valor do editor.
    }
  }

  return fromElement ?? null;
}

function resourceManifest(
  name: string,
  description: string,
  identity: PackIdentity,
): string {
  return JSON.stringify(
    {
      format_version: 2,
      header: {
        name,
        description,
        uuid: identity.rpHeader,
        version: identity.version,
        min_engine_version: [1, 21, 0],
      },
      modules: [
        {
          description,
          type: "resources",
          uuid: identity.rpModule,
          version: identity.version,
        },
      ],
    },
    null,
    4,
  );
}

/** Monta o zip com o resource pack e o behavior pack. */
export async function buildPack(options: BuildOptions): Promise<BuildResult> {
  const { screens, packName, triggerItem, scriptApi } = options;
  const warnings: string[] = [];
  const packNs = toNamespace(packName);
  const zip = new JSZip();

  const rpDir = `${packNs}_RP`;
  const bpDir = `${packNs}_BP`;

  const registry = new TextureRegistry(packNs);
  for (const screen of screens) registerTreeTextures(screen.elements, registry);

  // --- RESOURCE PACK: os arquivos de tela ---
  const routes: ScreenRoute[] = [];
  const uiDefs: string[] = [];

  for (const screen of screens) {
    const ns = screen.namespace || toNamespace(screen.name);
    if (!screen.elements.length) {
      warnings.push(`A tela "${screen.name}" está vazia — vai abrir em branco.`);
    }

    const path = `ui/${packNs}/${ns}.json`;
    zip.file(
      `${rpDir}/${path}`,
      exportToJsonUiString(screen.elements, {
        namespace: ns,
        resolveTexture: registry.resolver,
        includeComment: false,
        omitControlNineslice: true,
      }),
    );
    uiDefs.push(path);
    routes.push({ flag: sanitizeFlag(screen.name), namespace: ns });
  }

  // server_form.json NÃO entra no _ui_defs: tem nome de tela do jogo.
  zip.file(`${rpDir}/ui/server_form.json`, serverFormTemplate(routes));
  zip.file(
    `${rpDir}/ui/_ui_defs.json`,
    JSON.stringify({ ui_defs: uiDefs }, null, 4),
  );

  // --- RESOURCE PACK: as texturas ---
  for (const tex of registry.all) {
    let bytes: Uint8Array;
    try {
      bytes = await fetchBytes(tex.url);
    } catch {
      warnings.push(
        `Não consegui ler a textura "${tex.packPath}" — ela vai faltar no pack.`,
      );
      continue;
    }
    zip.file(`${rpDir}/${tex.packPath}.png`, bytes);

    // O .json de nineslice precisa do tamanho REAL do PNG no base_size.
    const slice = await resolveNineslice(tex.url, tex.nineslice);
    if (slice == null) continue;

    const size = readPngSize(bytes);
    if (!size) {
      warnings.push(
        `"${tex.packPath}" não parece um PNG válido; nineslice ignorado.`,
      );
      continue;
    }

    // Borda maior que a própria imagem não sobra miolo para esticar e o
    // Minecraft desenha lixo. Melhor sair sem nineslice do que quebrado.
    const [l, t, r, b] = toBorders(slice);
    if (l + r >= size[0] || t + b >= size[1]) {
      warnings.push(
        `Nineslice de "${tex.packPath}" (${l},${t},${r},${b}) não cabe em ` +
          `${size[0]}x${size[1]} — a textura vai sem nineslice.`,
      );
      continue;
    }

    zip.file(
      `${rpDir}/${tex.packPath}.json`,
      JSON.stringify({ nineslice_size: slice, base_size: size }, null, 4),
    );
  }

  // --- MANIFESTOS ---
  const identity = nextIdentity(packNs);
  zip.file(
    `${rpDir}/manifest.json`,
    resourceManifest(
      `${packName} RP`,
      "Interface criada no json-ui-builder-web",
      identity,
    ),
  );

  const api = SCRIPT_API_VERSIONS[scriptApi];
  zip.file(
    `${bpDir}/manifest.json`,
    JSON.stringify(
      {
        format_version: 2,
        header: {
          name: `${packName} BP`,
          description: "Script que abre as telas do json-ui-builder-web",
          uuid: identity.bpHeader,
          version: identity.version,
          min_engine_version: [1, 21, 0],
        },
        modules: [
          {
            description: "Scripts",
            type: "script",
            language: "javascript",
            uuid: identity.bpModule,
            version: identity.version,
            entry: "scripts/main.js",
          },
        ],
        dependencies: [
          { module_name: "@minecraft/server", version: api.server },
          { module_name: "@minecraft/server-ui", version: api.ui },
          // Puxa o resource pack junto: sem ele as telas não existem.
          { uuid: identity.rpHeader, version: identity.version },
        ],
      },
      null,
      4,
    ),
  );

  // --- BEHAVIOR PACK: o script ---
  zip.file(
    `${bpDir}/scripts/main.js`,
    generateScript(screens, "js", {
      triggerItem,
      resolveTexture: registry.resolver,
    }),
  );

  // --- INSTRUÇÕES (dentro dos packs, para não atrapalhar a importação) ---
  const readme = buildReadme(options, packNs, routes, api, identity.version);
  zip.file(`${rpDir}/LEIA-ME.txt`, readme);
  zip.file(`${bpDir}/LEIA-ME.txt`, readme);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const files: string[] = [];
  zip.forEach((path) => files.push(path));

  return { blob, filename: `${packNs}.mcaddon`, files: files.sort(), warnings };
}

function buildReadme(
  options: BuildOptions,
  packNs: string,
  routes: ScreenRoute[],
  api: { server: string; ui: string },
  version: [number, number, number],
): string {
  const list = routes.map((r) => `  - "${r.flag}"`).join("\n");
  return `${options.packName} — versão ${version.join(".")}
Gerado pelo json-ui-builder-web.

COMO INSTALAR
1. Dê dois cliques no arquivo .mcaddon — o Minecraft importa os dois packs.
   (Se preferir, renomeie para .zip e extraia as duas pastas à mão em
   com.mojang/development_resource_packs e development_behavior_packs.)
2. No mundo, ative os DOIS: o resource pack ${packNs}_RP e o behavior pack
   ${packNs}_BP.
3. Nas configurações do mundo, ligue "Beta APIs" (Experimentos). O script não
   roda sem isso.
4. Entre no mundo e use um ${options.triggerItem} com o botão direito.

TELAS DESTE PACK
${list}

COMO FUNCIONA
O script abre um formulário cujo TÍTULO é o nome da tela. O arquivo
ui/server_form.json compara o título com cada nome e mostra a tela certa.
Mudar o nome da tela no editor sem mudar no script (ou vice-versa) faz o jogo
cair no formulário padrão.

A ordem dos botões no script é a mesma ordem em que eles aparecem no editor.
Inserir um botão no meio desloca todos os índices seguintes.

SE NÃO APARECER NADA
- Confira se os dois packs estão ativos e as Beta APIs ligadas.
- Ligue o Content Log (Configurações > Criador) para ver erro de textura ou
  de JSON.
- Se o script não carregar, o motivo mais comum é a versão da API. Este pack
  declara @minecraft/server ${api.server} e @minecraft/server-ui ${api.ui};
  troque no ${packNs}_BP/manifest.json se a sua versão do jogo pedir outra.
`;
}
