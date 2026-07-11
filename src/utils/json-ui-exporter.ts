/**
 * Exporter: converte a árvore de UIElement (fonte de verdade da store) no
 * formato JSON UI do Minecraft Bedrock.
 *
 * Estratégia de coordenadas (portada do original): todo elemento é ancorado em
 * `top_left` e recebe `offset`/`size` em px do editor multiplicados por
 * UI_SCALAR. Assim a posição absoluta do canvas vira coordenada do Minecraft
 * sem matemática de âncora.
 */
import { exportConfig as CFG } from "../config/export.config";
import type { UIElement, UIProperties } from "../types/element.types";
import { ELEMENT_DEFINITIONS } from "../types/element.types";
import {
  buttonWithHoverTextTemplate,
  basicPanelScrollingContent,
} from "./json-ui-templates";

export interface ExportOptions {
  namespace: string;
  /** Inclui o bloco config.magicNumbers (necessário para reimportar). */
  includeConfig?: boolean;
  /** Inclui o comentário de crédito no final. */
  includeComment?: boolean;
}

let idCounter = 0;
function shortId(): string {
  // Determinístico dentro de um export (evita depender de Math.random).
  idCounter = (idCounter + 1) % 1_000_000;
  return idCounter.toString(36).padStart(5, "0");
}

const S = CFG.UI_SCALAR;

function offsetOf(p: UIProperties): [number, number] {
  return [p.x * S, p.y * S];
}
function sizeOf(p: UIProperties): [number, number] {
  return [p.width * S, p.height * S];
}

const cleanBindings = (p: UIProperties) =>
  Array.isArray(p.bindings) && p.bindings.length ? p.bindings : undefined;

/** Converte um único elemento (sem filhos) no objeto JSON UI base. */
function elementToJsonUi(el: UIElement, namespace: string): {
  json: any;
  /** Sufixo de link (@namespace.custom_button) ou "" para nós comuns. */
  link: string;
  /** Se false, os filhos NÃO devem ser descidos como controls diretos. */
  continuePath: boolean;
} {
  const p = el.properties;
  const base: any = {
    layer: 0,
    anchor_from: "top_left",
    anchor_to: "top_left",
  };
  const bindings = cleanBindings(p);
  if (bindings) base.bindings = bindings;

  switch (el.type) {
    case "panel":
      return {
        json: { ...base, type: "panel", offset: offsetOf(p), size: sizeOf(p) },
        link: "",
        continuePath: true,
      };

    case "stackPanel":
      return {
        json: {
          ...base,
          type: "stack_panel",
          orientation: p.orientation ?? "vertical",
          offset: offsetOf(p),
          size: sizeOf(p),
        },
        link: "",
        continuePath: true,
      };

    case "collectionPanel":
      return {
        json: {
          ...base,
          type: "collection_panel",
          collection_name: p.collectionName ?? CFG.defaultCollectionName,
          offset: offsetOf(p),
          size: sizeOf(p),
        },
        link: "",
        continuePath: true,
      };

    case "image":
      return {
        json: {
          ...base,
          type: "image",
          texture: p.texture ? toMcTexture(p.texture) : "textures/ui/White",
          offset: offsetOf(p),
          size: sizeOf(p),
          ...(p.nineslice != null ? { nineslice_size: p.nineslice } : {}),
        },
        link: "",
        continuePath: true,
      };

    case "label": {
      const fontType = p.fontType ?? "MinecraftRegular";
      const fontSize = p.fontSize ?? 1;
      return {
        json: {
          ...base,
          type: "label",
          text: p.text ?? "",
          offset: [
            (p.x + CFG.fontOffsetX) * S,
            (p.y + CFG.fontOffsetY) * S +
              CFG.getFontScaledOffsetY(fontSize, fontType),
          ],
          font_type: fontType,
          font_scale_factor: fontSize * CFG.fontScalar * S,
          text_alignment: p.textAlignment ?? "left",
          shadow: p.shadow ?? false,
          ...(p.color ? { color: p.color } : {}),
        },
        link: "",
        continuePath: false,
      };
    }

    case "button": {
      const fontType = p.fontType ?? "MinecraftRegular";
      const json: any = {
        $default_button_background_texture: toMcTexture(p.defaultTexture),
        $hover_button_background_texture: toMcTexture(p.hoverTexture),
        $pressed_button_background_texture: toMcTexture(p.pressedTexture),

        $button_offset: offsetOf(p),
        $button_size: sizeOf(p),

        layer: 0,
        anchor_from: "top_left",
        anchor_to: "top_left",
        collection_index: p.collectionIndex ?? 0,

        $icon_offset: [CFG.buttonImageOffsetX, CFG.buttonImageOffsetY],
        $icon_size: sizeOf(p),

        $font_size: p.fontSize ?? 1,
        $text_offset: [0, 0],
        $font_type: fontType,
        $shadow: p.shadow ?? false,
        $text_alignment: p.textAlignment ?? "center",

        $show_hover_text: false,
      };
      if (bindings) json.bindings = bindings;
      return { json, link: `@${namespace}.custom_button`, continuePath: false };
    }

    default:
      return {
        json: { ...base, type: "panel", offset: offsetOf(p), size: sizeOf(p) },
        link: "",
        continuePath: true,
      };
  }
}

/** Normaliza um caminho de textura do editor para o formato do Minecraft. */
function toMcTexture(path?: string): string {
  if (!path) return "textures/ui/White";
  // remove barra inicial e extensão .png; garante prefixo textures/
  let t = path.replace(/^\/+/, "").replace(/\.png$/i, "");
  if (!t.startsWith("textures/")) t = `textures/${t}`;
  return t;
}

/** Percorre a árvore recursivamente e monta o mapa de nós JSON UI. */
function buildTree(
  nodes: UIElement[],
  namespace: string,
  depth: number,
): Record<string, any> {
  const out: Record<string, any> = {};

  for (const el of nodes) {
    const { json, link, continuePath } = elementToJsonUi(el, namespace);
    const def = ELEMENT_DEFINITIONS[el.type];

    // Scrolling panel: gera uma sub-árvore ligada (padrão common.scrolling_panel).
    if (el.type === "scrollingPanel") {
      const key =
        depth === 0
          ? `${namespace}-${shortId()}`
          : `${shortId()}-scrolling_panel`;
      out[key] = buildScrollingPanel(el, namespace, depth);
      continue;
    }

    if (continuePath && def.isContainer && el.children.length) {
      json.controls = Object.entries(
        buildTree(el.children, namespace, depth + 1),
      ).map(([k, v]) => ({ [k]: v }));
    }

    const key =
      depth === 0 ? `${namespace}${link}` : `${shortId()}-${el.type}${link}`;
    out[key] = json;
  }

  return out;
}

/** Constrói a estrutura de scrolling panel (stack_panel + common.scrolling_panel). */
function buildScrollingPanel(el: UIElement, namespace: string, depth: number): any {
  const p = el.properties;
  const size = sizeOf(p);
  const contentLink = `${namespace}.${shortId()}-sc_content`;

  const content = basicPanelScrollingContent();
  if (el.children.length) {
    content.controls = Object.entries(
      buildTree(el.children, namespace, depth + 1),
    ).map(([k, v]) => ({ [k]: v }));
  }

  return {
    type: "stack_panel",
    size,
    orientation: "vertical",
    layer: 0,
    anchor_from: "top_left",
    anchor_to: "top_left",
    offset: offsetOf(p),
    controls: [
      {
        [`${shortId()}-sc_linker@common.scrolling_panel`]: {
          anchor_from: "top_left",
          anchor_to: "top_left",
          $show_background: false,
          size: ["100%", "100%"],
          $scrolling_content: contentLink,
          $scroll_size: [10 * S, size[1]],
          $scrolling_pane_size: size,
          $scrolling_pane_offset: offsetOf(p),
        },
      },
    ],
    // A sub-árvore é registrada no nível raiz do arquivo pelo exporter.
    __scrollingContent: { link: contentLink.split(".")[1], node: content },
  };
}

/** Gera o objeto JSON UI completo (namespace + templates + elementos). */
export function exportToJsonUiObject(
  elements: UIElement[],
  options: ExportOptions,
): Record<string, any> {
  idCounter = 0;
  const { namespace } = options;

  const tree: Record<string, any> = {
    namespace,
    custom_button: buttonWithHoverTextTemplate(namespace),
  };

  const built = buildTree(elements, namespace, 0);

  // Extrai conteúdos de scrolling panels para o nível raiz.
  for (const [key, node] of Object.entries(built)) {
    hoistScrollingContent(node, tree);
    tree[key] = node;
  }

  if (options.includeConfig !== false) {
    tree.config = { magicNumbers: serializableConfig() };
  }

  return tree;
}

/** Move os conteúdos de scrolling panels (__scrollingContent) para o topo. */
function hoistScrollingContent(node: any, tree: Record<string, any>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => hoistScrollingContent(n, tree));
    return;
  }
  if (node.__scrollingContent) {
    const { link, content } = {
      link: node.__scrollingContent.link,
      content: node.__scrollingContent.node,
    };
    if (link) tree[link] = content;
    delete node.__scrollingContent;
  }
  for (const v of Object.values(node)) hoistScrollingContent(v, tree);
}

function serializableConfig() {
  return {
    UI_SCALAR: CFG.UI_SCALAR,
    fontScalar: CFG.fontScalar,
    fontOffsetX: CFG.fontOffsetX,
    fontOffsetY: CFG.fontOffsetY,
    buttonImageOffsetX: CFG.buttonImageOffsetX,
    buttonImageOffsetY: CFG.buttonImageOffsetY,
  };
}

const CREDIT_COMMENT =
  "\n/* Gerado por json-ui-builder-web. Baseado no JSON-UI-Maker original.\n" +
  "   Não edite manualmente ou o arquivo pode não reimportar. */";

/** Serializa o JSON UI como string (com comentário opcional de crédito). */
export function exportToJsonUiString(
  elements: UIElement[],
  options: ExportOptions,
): string {
  const obj = exportToJsonUiObject(elements, options);
  const str = JSON.stringify(obj, null, 2);
  return options.includeComment === false ? str : str + CREDIT_COMMENT;
}
