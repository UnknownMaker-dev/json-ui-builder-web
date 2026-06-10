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

  // Função auxiliar para encontrar o pai de um elemento
  function findParent(nodes: UIElement[], targetId: string): UIElement | null {
    for (const node of nodes) {
      if (node.children.some((c) => c.id === targetId)) return node;
      if (node.children.length > 0) {
        const found = findParent(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  function addElement(type: UIElement["type"], name: string) {
    const newElement: UIElement = {
      id: crypto.randomUUID(),
      type,
      name,
      properties: {
        x: 20,
        y: 20,
        width: type === "panel" ? 200 : 100,
        height: type === "panel" ? 200 : 40,
        text: type === "label" || type === "button" ? name : undefined,
      },
      children: [],
    };

    let targetParent = null;

    if (selectedElement.value) {
      if (selectedElement.value.type === "panel") {
        // Se um painel estiver selecionado, adiciona dentro dele
        targetParent = selectedElement.value;
      } else {
        // Se um botão/label estiver selecionado, acha o painel pai dele e adiciona lá
        targetParent = findParent(elements.value, selectedElement.value.id);
      }
    }

    if (targetParent && targetParent.type === "panel") {
      targetParent.children.push(newElement);
    } else {
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
