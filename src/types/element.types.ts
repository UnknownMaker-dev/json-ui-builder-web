/**
 * Modelo de dados dos elementos do editor.
 *
 * A árvore de `UIElement` é a fonte de verdade (guardada na store Pinia) e é
 * convertida para JSON UI do Minecraft pelo exporter. Cada tipo aqui mapeia
 * para um `type` do JSON UI (ver ELEMENT_DEFINITIONS.jsonUiType).
 */
import type { Component } from "vue";
import {
  Square,
  Layers,
  LayoutGrid,
  ScrollText,
  Image as ImageIcon,
  MousePointerClick,
  Type,
} from "lucide-vue-next";

/** Alinhamento no eixo transversal de um stack_panel. */
export type StackAlign = "start" | "center" | "end";

/** Um binding de dados do JSON UI (ligação a valores dinâmicos do Minecraft). */
export interface UIBinding {
  binding_type?: "global" | "view" | "collection" | "collection_details" | "none";
  binding_name?: string;
  binding_name_override?: string;
  binding_collection_name?: string;
  source_control_name?: string;
  source_property_name?: string;
  target_property_name?: string;
  binding_condition?: string;
}

/** Todas as propriedades editáveis de um elemento. */
export interface UIProperties {
  // Layout (px absolutos no editor)
  x: number;
  y: number;
  width: number;
  height: number;

  // Texto (label / botão)
  text?: string;
  fontType?: string;
  fontSize?: number;
  textAlignment?: "left" | "center" | "right";
  shadow?: boolean;
  color?: [number, number, number];

  // Imagem / painel com textura
  texture?: string;
  nineslice?: number | [number, number, number, number];

  // Botão: texturas por estado
  defaultTexture?: string;
  hoverTexture?: string;
  pressedTexture?: string;
  /**
   * Ícone desenhado dentro do botão. Diferente das texturas de estado: o ícone
   * vem do script (`form.button(texto, icone)`) via binding da coleção, então
   * também é escrito no main.js gerado.
   */
  iconTexture?: string;

  // Stack panel
  orientation?: "vertical" | "horizontal";
  /**
   * Alinhamento DESTE elemento no eixo transversal do stack_panel pai.
   * Num stack vertical o eixo transversal é o horizontal (esquerda/centro/
   * direita); num horizontal é o vertical (topo/meio/base). O eixo principal
   * continua sendo a ordem na pilha, que o Minecraft resolve sozinho.
   */
  stackAlign?: StackAlign;
  /**
   * Distribuição dos filhos no eixo DA pilha (só faz sentido no próprio
   * stack_panel). O JSON UI não tem um "justify-content": o efeito é obtido
   * encolhendo a pilha até o conteúdo (`100%c`) e ancorando ela dentro de um
   * panel do tamanho desenhado — é o que o exporter monta.
   */
  stackJustify?: StackAlign;
  /**
   * Espaço entre os filhos da pilha, em px do editor.
   *
   * JSON UI não tem `margin` nem `gap`: o stack_panel encosta um filho no
   * outro. O espaço é obtido intercalando painéis vazios do tamanho do vão —
   * é o que o exporter gera.
   */
  stackGap?: number;
  /** Recuo entre a borda da pilha e os filhos, em px do editor. */
  stackPadding?: number;
  /**
   * Espaço extra ANTES deste elemento na pilha, em px do editor. Some com o
   * `stackGap` do pai no mesmo painel espaçador.
   */
  stackMargin?: number;

  // Collection panel
  collectionName?: string;
  collectionIndex?: number;

  // Bindings (JSON UI)
  bindings?: UIBinding[];

  [key: string]: any;
}

export type UIElementType =
  | "panel"
  | "stackPanel"
  | "collectionPanel"
  | "scrollingPanel"
  | "image"
  | "button"
  | "label";

export interface UIElement {
  id: string;
  type: UIElementType;
  name: string;
  properties: UIProperties;
  children: UIElement[];
}

/** Metadados de cada tipo de elemento: usados no toolbox, defaults e export. */
export interface ElementDefinition {
  type: UIElementType;
  label: string;
  /** Ícone Lucide (componente Vue). */
  icon: Component;
  /** `type` correspondente no JSON UI do Minecraft. */
  jsonUiType: string;
  /** Pode conter filhos (é um container)? */
  isContainer: boolean;
  /** Propriedades padrão ao criar. */
  defaults: () => Partial<UIProperties>;
}

const TEX = (name: string) =>
  `/presets/textures/other_ore-ui_style/${name}.png`;

export const ELEMENT_DEFINITIONS: Record<UIElementType, ElementDefinition> = {
  panel: {
    type: "panel",
    label: "Panel",
    icon: Square,
    jsonUiType: "panel",
    isContainer: true,
    defaults: () => ({ width: 200, height: 200 }),
  },
  stackPanel: {
    type: "stackPanel",
    label: "Stack Panel",
    icon: Layers,
    jsonUiType: "stack_panel",
    isContainer: true,
    defaults: () => ({ width: 200, height: 200, orientation: "vertical" }),
  },
  collectionPanel: {
    type: "collectionPanel",
    label: "Collection Panel",
    icon: LayoutGrid,
    jsonUiType: "collection_panel",
    isContainer: true,
    defaults: () => ({ width: 200, height: 200, collectionName: "form_buttons" }),
  },
  scrollingPanel: {
    type: "scrollingPanel",
    label: "Scrolling Panel",
    icon: ScrollText,
    jsonUiType: "scrolling_panel",
    isContainer: true,
    defaults: () => ({ width: 200, height: 200 }),
  },
  image: {
    type: "image",
    label: "Image",
    icon: ImageIcon,
    jsonUiType: "image",
    // O `image` do JSON UI aceita `controls`, então serve de container também.
    isContainer: true,
    defaults: () => ({ width: 64, height: 64, texture: TEX("default"), nineslice: 4 }),
  },
  button: {
    type: "button",
    label: "Button",
    icon: MousePointerClick,
    jsonUiType: "button",
    isContainer: false,
    defaults: () => ({
      width: 100,
      height: 40,
      text: "Botão",
      defaultTexture: TEX("green_default"),
      hoverTexture: TEX("green_hover"),
      pressedTexture: TEX("green_pressed"),
      nineslice: 4,
      fontType: "default",
      fontSize: 1,
      textAlignment: "center",
      shadow: false,
    }),
  },
  label: {
    type: "label",
    label: "Label",
    icon: Type,
    jsonUiType: "label",
    isContainer: false,
    defaults: () => ({
      width: 120,
      height: 28,
      text: "Texto",
      fontType: "default",
      fontSize: 1,
      textAlignment: "left",
      shadow: false,
      color: [1, 1, 1],
    }),
  },
};

/** Tipos que podem receber filhos. */
export function isContainer(type: UIElementType): boolean {
  return ELEMENT_DEFINITIONS[type].isContainer;
}
