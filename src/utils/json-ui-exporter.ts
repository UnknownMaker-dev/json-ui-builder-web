/**
 * Exporter: converte a árvore de UIElement (fonte de verdade da store) no
 * formato JSON UI do Minecraft Bedrock.
 *
 * Estratégia de coordenadas: cada tela vira UM panel do tamanho do canvas,
 * ancorado no centro da tela do jogo. Dentro dele, todo elemento é ancorado em
 * `top_left` e recebe `offset`/`size` em px do editor multiplicados por
 * UI_SCALAR — a posição absoluta do canvas vira coordenada do Minecraft sem
 * matemática de âncora.
 *
 * Envolver tudo num único panel raiz resolve dois problemas: o desenho fica
 * centralizado em qualquer resolução, e vários elementos na raiz deixam de
 * colidir (antes todos recebiam a mesma chave e só o último sobrevivia — a
 * armadilha "item duplicado" do JSON-UI.md, seção 3).
 */
import { exportConfig as CFG } from "../config/export.config";
import type { StackAlign, UIElement, UIProperties } from "../types/element.types";
import { ELEMENT_DEFINITIONS } from "../types/element.types";
import { buildButtonIndexMap } from "./form-buttons";
import {
  buttonWithHoverTextTemplate,
  hoverTextPanelTemplate,
  basicPanelScrollingContent,
} from "./json-ui-templates";

/** Converte a URL de textura do editor no caminho dentro do resource pack. */
export type TextureResolver = (editorUrl: string) => string;

export interface ExportOptions {
  namespace: string;
  /** Mapeia texturas do editor para caminhos do pack. */
  resolveTexture?: TextureResolver;
  /** Inclui o bloco config.magicNumbers (necessário para reimportar). */
  includeConfig?: boolean;
  /** Inclui o comentário de crédito no final. */
  includeComment?: boolean;
  /**
   * Omite `nineslice_size` nos controles. O pack builder liga isto porque
   * escreve o .json ao lado da textura com o dado original da arte — e o valor
   * do controle teria prioridade sobre esse .json, sobrescrevendo o certo pelo
   * aproximado que o editor guarda.
   */
  omitControlNineslice?: boolean;
}

let idCounter = 0;
function shortId(): string {
  // Determinístico dentro de um export (evita depender de Math.random).
  idCounter = (idCounter + 1) % 1_000_000;
  return idCounter.toString(36).padStart(5, "0");
}

const S = CFG.UI_SCALAR;

/** Arredonda para 3 casas: evita `7.199999999999999` no arquivo final. */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function offsetOf(p: UIProperties): [number, number] {
  return [r3(p.x * S), r3(p.y * S)];
}
function sizeOf(p: UIProperties): [number, number] {
  return [r3(p.width * S), r3(p.height * S)];
}

const cleanBindings = (p: UIProperties) =>
  Array.isArray(p.bindings) && p.bindings.length ? p.bindings : undefined;

/**
 * Caminho de textura padrão quando não há resolver do pack: usa só o nome do
 * arquivo sob `textures/ui/<namespace>/`. Antes o caminho de preview do editor
 * vazava inteiro e o prefixo `textures/` acabava duplicado.
 */
function defaultResolver(namespace: string): TextureResolver {
  return (url: string) => {
    if (!url) return "textures/ui/White";
    if (url.startsWith("data:")) return `textures/ui/${namespace}/imagem`;
    const clean = url.split("?")[0].replace(/\.png$/i, "");
    const base = clean.substring(clean.lastIndexOf("/") + 1);
    return `textures/ui/${namespace}/${base}`;
  };
}

interface BuildCtx {
  namespace: string;
  tex: TextureResolver;
  omitNineslice: boolean;
  buttonIndex: Map<string, number>;
  /** Sub-árvores de scrolling panel que precisam subir para a raiz do arquivo. */
  hoisted: Record<string, any>;
}

/** Converte um único elemento (sem filhos) no objeto JSON UI base. */
function elementToJsonUi(
  el: UIElement,
  ctx: BuildCtx,
): { json: any; link: string; continuePath: boolean } {
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
          texture: ctx.tex(p.texture ?? ""),
          offset: offsetOf(p),
          size: sizeOf(p),
          ...(p.nineslice != null && !ctx.omitNineslice
            ? { nineslice_size: p.nineslice }
            : {}),
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
            r3((p.x + CFG.fontOffsetX) * S),
            r3(
              (p.y + CFG.fontOffsetY) * S +
                CFG.getFontScaledOffsetY(fontSize, fontType),
            ),
          ],
          font_type: fontType,
          font_scale_factor: r3(fontSize * CFG.fontScalar * S),
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
        $default_button_background_texture: ctx.tex(p.defaultTexture ?? ""),
        $hover_button_background_texture: ctx.tex(
          p.hoverTexture ?? p.defaultTexture ?? "",
        ),
        $pressed_button_background_texture: ctx.tex(
          p.pressedTexture ?? p.defaultTexture ?? "",
        ),

        $button_offset: offsetOf(p),
        $button_size: sizeOf(p),

        layer: 0,
        anchor_from: "top_left",
        anchor_to: "top_left",
        // Índice posicional na coleção `form_buttons`: tem que casar com a
        // ordem dos `form.button(...)` do script.
        collection_index: ctx.buttonIndex.get(el.id) ?? 0,

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
      return {
        json,
        link: `@${ctx.namespace}.custom_button`,
        continuePath: false,
      };
    }

    default:
      return {
        json: { ...base, type: "panel", offset: offsetOf(p), size: sizeOf(p) },
        link: "",
        continuePath: true,
      };
  }
}

/**
 * Âncora que alinha um filho no eixo TRANSVERSAL do stack_panel.
 *
 * O stack_panel só decide o eixo principal (a ordem da pilha); o outro eixo
 * fica por conta da âncora do filho. Num stack vertical o eixo livre é o
 * horizontal, num horizontal é o vertical.
 */
function stackAnchor(align: StackAlign | undefined, horizontal: boolean): string {
  const a = align ?? "start";
  if (horizontal) {
    // Pilha na horizontal: sobra o eixo vertical.
    return a === "center" ? "left_middle" : a === "end" ? "bottom_left" : "top_left";
  }
  // Pilha na vertical: sobra o eixo horizontal.
  return a === "center" ? "top_middle" : a === "end" ? "top_right" : "top_left";
}

/** Percorre a árvore recursivamente e monta o mapa de nós JSON UI. */
function buildTree(
  nodes: UIElement[],
  ctx: BuildCtx,
  parentIsStack = false,
  stackIsHorizontal = false,
): Record<string, any> {
  const out: Record<string, any> = {};

  for (const el of nodes) {
    if (el.type === "scrollingPanel") {
      out[`${shortId()}-scrolling_panel`] = buildScrollingPanel(el, ctx);
      continue;
    }

    const { json, link, continuePath } = elementToJsonUi(el, ctx);
    const def = ELEMENT_DEFINITIONS[el.type];

    // Filho de stack_panel: o Minecraft posiciona sozinho no eixo da pilha —
    // zera o offset e deixa a ÂNCORA cuidar do eixo transversal.
    if (parentIsStack) {
      if ("offset" in json) json.offset = [0, 0];
      if ("$button_offset" in json) json.$button_offset = [0, 0];
      const anchor = stackAnchor(el.properties.stackAlign, stackIsHorizontal);
      json.anchor_from = anchor;
      json.anchor_to = anchor;
    }

    if (continuePath && def.isContainer && el.children.length) {
      json.controls = Object.entries(
        buildTree(
          el.children,
          ctx,
          el.type === "stackPanel",
          el.properties.orientation === "horizontal",
        ),
      ).map(([k, v]) => ({ [k]: v }));
    }

    out[`${shortId()}-${el.type}${link}`] = json;
  }

  return out;
}

/** Constrói a estrutura de scrolling panel (stack_panel + common.scrolling_panel). */
function buildScrollingPanel(el: UIElement, ctx: BuildCtx): any {
  const p = el.properties;
  const size = sizeOf(p);
  const contentName = `${shortId()}-sc_content`;

  const content = basicPanelScrollingContent();
  if (el.children.length) {
    content.controls = Object.entries(buildTree(el.children, ctx)).map(
      ([k, v]) => ({ [k]: v }),
    );
  }
  // O conteúdo do scrolling precisa existir como controle de topo do arquivo.
  ctx.hoisted[contentName] = content;

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
          $scrolling_content: `${ctx.namespace}.${contentName}`,
          $scroll_size: [r3(10 * S), size[1]],
          $scrolling_pane_size: size,
          $scrolling_pane_offset: [0, 0],
        },
      },
    ],
  };
}

/** Gera o objeto JSON UI completo (namespace + templates + a tela). */
export function exportToJsonUiObject(
  elements: UIElement[],
  options: ExportOptions,
): Record<string, any> {
  idCounter = 0;
  const { namespace } = options;

  const ctx: BuildCtx = {
    namespace,
    tex: options.resolveTexture ?? defaultResolver(namespace),
    omitNineslice: options.omitControlNineslice ?? false,
    buttonIndex: buildButtonIndexMap(elements),
    hoisted: {},
  };

  const controls = Object.entries(buildTree(elements, ctx)).map(([k, v]) => ({
    [k]: v,
  }));

  const tree: Record<string, any> = {
    namespace,
    custom_button: buttonWithHoverTextTemplate(namespace),
    hover_text_panel: hoverTextPanelTemplate(),
  };

  // Conteúdos de scrolling panel são controles de topo, não filhos.
  Object.assign(tree, ctx.hoisted);

  // A tela: um panel do tamanho do canvas, centralizado na tela do jogo.
  tree[namespace] = {
    type: "panel",
    size: [r3(CFG.CANVAS_W * S), r3(CFG.CANVAS_H * S)],
    anchor_from: "center",
    anchor_to: "center",
    offset: [0, 0],
    layer: CFG.SCREEN_LAYER,
    controls,
  };

  if (options.includeConfig !== false) {
    tree.config = { magicNumbers: serializableConfig() };
  }

  return tree;
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
