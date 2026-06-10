import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface UIElement {
  id: string;
  type: "button" | "panel" | "label" | "canvas" | "stackPanel";
  name: string;
  properites: Record<string, any>;
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

  // AÇÕES (Actions)
  function addElement(element: UIElement, parentId: string | null = null) {
    if (!parentId) {
      elements.value.push(element);
    } else {
        // dps faço saporra
    }
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
