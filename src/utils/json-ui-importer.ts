/**
 * Importer: reconstrói a árvore de UIElement a partir de um arquivo JSON UI
 * gerado por este editor (ou compatível). Faz o caminho inverso do exporter:
 * remove comentários, lê config.magicNumbers para desfazer a escala, e
 * percorre os `controls` recriando os elementos.
 *
 * Observação: só reimporta com fidelidade arquivos gerados por este editor
 * (que embutem `config.magicNumbers`). JSON UI arbitrário do Minecraft é muito
 * mais livre e não tem garantia de round-trip.
 */
import { exportConfig as CFG } from "../config/export.config";
import type { UIElement, UIElementType, UIProperties } from "../types/element.types";

export interface ImportResult {
  ok: boolean;
  elements?: UIElement[];
  error?: string;
}

/** Remove comentários /* *\/ e // do texto antes do JSON.parse. */
export function parseJsonWithComments(text: string): any {
  const noBlock = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLine = noBlock.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(noLine);
}

const jsonUiTypeToEditor: Record<string, UIElementType> = {
  panel: "panel",
  stack_panel: "stackPanel",
  collection_panel: "collectionPanel",
  scrolling_panel: "scrollingPanel",
  image: "image",
  label: "label",
  button: "button",
};

function newId(): string {
  return crypto.randomUUID();
}

/** Lê o fator de escala do bloco config (fallback para o config atual). */
function scaleFrom(root: any): number {
  const s = root?.config?.magicNumbers?.UI_SCALAR;
  return typeof s === "number" && s > 0 ? s : CFG.UI_SCALAR;
}

function num(v: any, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

/** Converte um nó JSON UI (valor) em UIElement. */
function nodeToElement(name: string, node: any, scale: number): UIElement | null {
  const link = name.includes("@") ? name.split("@")[1] : "";
  const isCustomButton = link.endsWith(".custom_button");

  let type: UIElementType | undefined = isCustomButton
    ? "button"
    : jsonUiTypeToEditor[node?.type];

  if (!type) return null;

  const props: UIProperties = { x: 0, y: 0, width: 100, height: 40 };

  const offset = isCustomButton ? node.$button_offset : node.offset;
  const size = isCustomButton ? node.$button_size : node.size;
  if (Array.isArray(offset)) {
    props.x = Math.round(num(offset[0]) / scale);
    props.y = Math.round(num(offset[1]) / scale);
  }
  if (Array.isArray(size)) {
    props.width = Math.round(num(size[0]) / scale);
    props.height = Math.round(num(size[1]) / scale);
  }

  if (type === "button") {
    props.defaultTexture = fromMcTexture(node.$default_button_background_texture);
    props.hoverTexture = fromMcTexture(node.$hover_button_background_texture);
    props.pressedTexture = fromMcTexture(node.$pressed_button_background_texture);
    props.fontType = node.$font_type ?? "MinecraftRegular";
    props.fontSize = num(node.$font_size, 1);
    props.textAlignment = node.$text_alignment ?? "center";
    props.shadow = !!node.$shadow;
  } else if (type === "label") {
    props.text = node.text ?? "";
    props.fontType = node.font_type ?? "MinecraftRegular";
    props.textAlignment = node.text_alignment ?? "left";
    props.shadow = !!node.shadow;
    if (Array.isArray(node.color)) props.color = node.color;
  } else if (type === "image") {
    props.texture = fromMcTexture(node.texture);
    if (node.nineslice_size != null) props.nineslice = node.nineslice_size;
  } else if (type === "stackPanel") {
    props.orientation = node.orientation ?? "vertical";
  } else if (type === "collectionPanel") {
    props.collectionName = node.collection_name ?? "form_buttons";
  }

  if (Array.isArray(node.bindings) && node.bindings.length) {
    props.bindings = node.bindings;
  }

  const children: UIElement[] = [];
  if (Array.isArray(node.controls)) {
    for (const ctrl of node.controls) {
      const [childName, childNode] = Object.entries(ctrl)[0] ?? [];
      if (!childName) continue;
      // pula controles internos do template (image/text/form_button)
      if (["image", "text", "panel_name"].includes(childName)) continue;
      if (childName.startsWith("form_button@")) continue;
      const child = nodeToElement(childName, childNode, scale);
      if (child) children.push(child);
    }
  }

  return {
    id: newId(),
    type,
    name: cleanName(name),
    properties: props,
    children,
  };
}

function cleanName(raw: string): string {
  const base = raw.split("@")[0];
  return base.replace(/^[0-9a-z]+-/, "") || base;
}

function fromMcTexture(t?: string): string | undefined {
  if (!t || typeof t !== "string") return undefined;
  if (t.startsWith("textures/ui/")) return t; // textura vanilla
  return "/" + t + ".png";
}

/** Nós reservados/estruturais que não são elementos de tela. */
const RESERVED = new Set(["namespace", "custom_button", "config"]);

export function importFromJsonUi(text: string): ImportResult {
  let root: any;
  try {
    root = parseJsonWithComments(text);
  } catch (e) {
    return { ok: false, error: "JSON inválido: " + (e as Error).message };
  }
  if (!root || typeof root !== "object") {
    return { ok: false, error: "Arquivo vazio ou inválido." };
  }

  const scale = scaleFrom(root);
  const namespace: string = root.namespace ?? "";
  const elements: UIElement[] = [];

  for (const [key, value] of Object.entries(root)) {
    if (RESERVED.has(key)) continue;
    if (key.endsWith("-sc_content") || key.includes("sc_content")) continue;
    // elementos raiz costumam ter o nome do namespace como prefixo
    const el = nodeToElement(key, value, scale);
    if (el) elements.push(el);
  }

  if (!elements.length) {
    return { ok: false, error: "Nenhum elemento reconhecido no arquivo." };
  }
  void namespace;
  return { ok: true, elements };
}
