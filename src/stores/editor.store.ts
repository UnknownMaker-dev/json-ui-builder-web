import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface UIElement {
  id: string;
  type: "button" | "panel" | "label" | "canvas" | "stackPanel";
  name: string;
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    [key: string]: any;
  };
  children: UIElement[];
}

export const useEditorStore = defineStore("editor", () => {
  const elements = ref<UIElement[]>([]);
  const selectedElementId = ref<string | null>(null);

  const selectedElement = computed(() => {
    const findElement = (nodes: UIElement[]): UIElement | undefined => {
      for (const node of nodes) {
        if (node.id === selectedElementId.value) return node;
        if (node.children.length > 0) {
          const found = findElement(node.children);
          if (found) return found;
        }
      }
    };
    return findElement(elements.value);
  });

  // Nova função de adicionar com valores padrão
  function addElement(type: UIElement["type"], name: string) {
    const newElement: UIElement = {
      id: crypto.randomUUID(),
      type,
      name,
      properties: {
        x: 20, // Posição relativa ao pai
        y: 20,
        width: type === "panel" ? 200 : 100,
        height: type === "panel" ? 200 : 40,
        text: type === "label" || type === "button" ? name : undefined,
      },
      children: [],
    };

    // Se houver um elemento selecionado e ele for um painel, adiciona como filho
    if (selectedElement.value && selectedElement.value.type === "panel") {
      selectedElement.value.children.push(newElement);
    } else {
      // Caso contrário, adiciona na raiz do projeto
      elements.value.push(newElement);
    }

    selectElement(newElement.id);
  }

  function selectElement(id: string | null) {
    selectedElementId.value = id;
  }

  return {
    elements,
    selectedElementId,
    selectedElement,
    addElement,
    selectElement,
  };
});
