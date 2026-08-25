/**
 * Coleta dos botões de formulário.
 *
 * O `collection_index` de cada botão é um CONTRATO posicional com o script
 * (JSON-UI.md, seção 10): o índice N na tela tem que ser o N-ésimo
 * `form.button(...)` chamado no addon. Para os dois nunca saírem de sincronia,
 * exporter e scripter usam esta mesma travessia em pré-ordem.
 */
import type { UIElement } from "../types/element.types";

export interface FormButtonData {
  /** Elemento de origem. */
  element: UIElement;
  /** Posição na coleção `form_buttons`. */
  index: number;
  /** Texto mostrado no botão (vem do script, via binding). */
  text: string;
  /** Ícone opcional desenhado dentro do botão (vem do script, via binding). */
  icon?: string;
}

/** Percorre a árvore em pré-ordem e numera os botões na ordem em que aparecem. */
export function collectFormButtons(elements: UIElement[]): FormButtonData[] {
  const out: FormButtonData[] = [];
  const walk = (nodes: UIElement[]) => {
    for (const el of nodes) {
      if (el.type === "button") {
        out.push({
          element: el,
          index: out.length,
          text: el.properties.text ?? el.name ?? "Botão",
          icon: el.properties.iconTexture || undefined,
        });
      }
      if (el.children.length) walk(el.children);
    }
  };
  walk(elements);
  return out;
}

/** Mapa id-do-elemento -> índice na coleção, para o exporter consultar. */
export function buildButtonIndexMap(elements: UIElement[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of collectFormButtons(elements)) map.set(b.element.id, b.index);
  return map;
}
