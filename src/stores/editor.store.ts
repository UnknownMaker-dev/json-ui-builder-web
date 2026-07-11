import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  ELEMENT_DEFINITIONS,
  isContainer,
  type UIElement,
  type UIElementType,
} from "../types/element.types";

// Reexporta para compatibilidade com imports antigos (`import { UIElement } from stores`).
export type { UIElement } from "../types/element.types";

export const useEditorStore = defineStore("editor", () => {
  const elements = ref<UIElement[]>([]);
  const selectedElementId = ref<string | null>(null);

  /** Namespace do arquivo JSON UI gerado (editável nas configurações). */
  const projectNamespace = ref<string>("custom_form");

  /**
   * Trava de proporção: quando ativa, o resize mantém a razão largura/altura
   * (equivalente a segurar SHIFT). Existe para mobile, que não tem SHIFT.
   */
  const aspectLocked = ref(false);
  function toggleAspectLock() {
    aspectLocked.value = !aspectLocked.value;
  }

  // --- SISTEMA DE HISTÓRICO (UNDO/REDO) ---
  const history = ref<string[]>([]);
  const historyIndex = ref(-1);
  let isUndoRedo = false;

  function saveSnapshot() {
    if (isUndoRedo) return;
    const snapshot = JSON.stringify(elements.value);
    if (
      historyIndex.value >= 0 &&
      history.value[historyIndex.value] === snapshot
    )
      return;
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    history.value.push(snapshot);
    historyIndex.value++;
  }

  function undo() {
    if (historyIndex.value > 0) {
      isUndoRedo = true;
      historyIndex.value--;
      elements.value = JSON.parse(history.value[historyIndex.value]);
      isUndoRedo = false;
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      isUndoRedo = true;
      historyIndex.value++;
      elements.value = JSON.parse(history.value[historyIndex.value]);
      isUndoRedo = false;
    }
  }

  saveSnapshot();

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

  /** Decide o pai onde um novo elemento deve entrar (container selecionado -> raiz). */
  function resolveTargetParent(): UIElement | null {
    if (!selectedElement.value) return null;
    if (isContainer(selectedElement.value.type)) return selectedElement.value;
    const parent = findParent(elements.value, selectedElement.value.id);
    return parent && isContainer(parent.type) ? parent : null;
  }

  function addElement(type: UIElementType, name?: string) {
    const def = ELEMENT_DEFINITIONS[type];
    const newElement: UIElement = {
      id: crypto.randomUUID(),
      type,
      name: name ?? `Novo ${def.label}`,
      properties: {
        x: 20,
        y: 20,
        width: 100,
        height: 40,
        ...def.defaults(),
      },
      children: [],
    };

    const targetParent = resolveTargetParent();
    if (targetParent) {
      targetParent.children.push(newElement);
    } else {
      elements.value.push(newElement);
    }

    selectElement(newElement.id);
    saveSnapshot();
  }

  function deleteElement(id: string) {
    const removeNode = (nodes: UIElement[]): boolean => {
      const index = nodes.findIndex((n) => n.id === id);
      if (index !== -1) {
        nodes.splice(index, 1);
        return true;
      }
      for (const node of nodes) {
        if (removeNode(node.children)) return true;
      }
      return false;
    };
    removeNode(elements.value);
    if (selectedElementId.value === id) selectedElementId.value = null;
    saveSnapshot();
  }

  function selectElement(id: string | null) {
    selectedElementId.value = id;
  }

  /** Substitui toda a árvore (usado na importação). */
  function setElements(next: UIElement[]) {
    elements.value = next;
    selectedElementId.value = null;
    saveSnapshot();
  }

  /** Limpa o projeto. */
  function reset() {
    elements.value = [];
    selectedElementId.value = null;
    saveSnapshot();
  }

  // --- COPIAR E COLAR ---
  const clipboard = ref<UIElement | null>(null);

  function copyElement() {
    if (selectedElement.value) {
      clipboard.value = JSON.parse(JSON.stringify(selectedElement.value));
    }
  }

  function regenerateIds(element: UIElement): UIElement {
    const newElement = { ...element, id: crypto.randomUUID() };
    newElement.children = newElement.children.map((child) =>
      regenerateIds(child),
    );
    return newElement;
  }

  function pasteElement() {
    if (!clipboard.value) return;
    const clonedElement = regenerateIds(
      JSON.parse(JSON.stringify(clipboard.value)),
    );
    clonedElement.properties.x += 10;
    clonedElement.properties.y += 10;
    clonedElement.name = `${clonedElement.name} (Cópia)`;

    const targetParent = resolveTargetParent();
    if (targetParent) {
      targetParent.children.push(clonedElement);
    } else {
      elements.value.push(clonedElement);
    }
    selectElement(clonedElement.id);
    saveSnapshot();
  }

  return {
    elements,
    selectedElementId,
    selectedElement,
    projectNamespace,
    aspectLocked,
    toggleAspectLock,
    addElement,
    deleteElement,
    selectElement,
    setElements,
    reset,
    saveSnapshot,
    undo,
    redo,
    copyElement,
    pasteElement,
  };
});
