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

  // --- SISTEMA DE HISTÓRICO (UNDO/REDO) ---
  const history = ref<string[]>([]);
  const historyIndex = ref(-1);
  let isUndoRedo = false; // Flag para evitar salvar snapshot enquanto desfaz

  function saveSnapshot() {
    if (isUndoRedo) return;

    const snapshot = JSON.stringify(elements.value);

    // Evita salvar snapshots duplicados seguidos
    if (
      historyIndex.value >= 0 &&
      history.value[historyIndex.value] === snapshot
    )
      return;

    // Se o usuário desfez algumas ações e fez uma nova, apaga o "futuro" (redos)
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

  // Salva o estado inicial vazio
  saveSnapshot();

  // --- FIM DO SISTEMA DE HISTÓRICO ---

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
        // Valores padrão de textura para testes (ajuste os caminhos conforme sua pasta public)
        texture:
          type === "panel"
            ? "/presets/textures/other_ore-ui_style/default.png"
            : type === "button"
              ? "/presets/textures/other_ore-ui_style/default.png"
              : undefined,
        nineslice: type === "panel" || type === "button" ? 4 : undefined,
      },
      children: [],
    };

    let targetParent = null;
    if (selectedElement.value) {
      if (selectedElement.value.type === "panel") {
        targetParent = selectedElement.value;
      } else {
        targetParent = findParent(elements.value, selectedElement.value.id);
      }
    }

    if (targetParent && targetParent.type === "panel") {
      targetParent.children.push(newElement);
    } else {
      elements.value.push(newElement);
    }

    selectElement(newElement.id);
    saveSnapshot(); // Salva após adicionar
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

    saveSnapshot(); // Salva após deletar
  }

  function selectElement(id: string | null) {
    selectedElementId.value = id;
  }

  // --- SISTEMA DE COPIAR E COLAR ---
  const clipboard = ref<UIElement | null>(null);

  function copyElement() {
    if (selectedElement.value) {
      // Faz uma cópia profunda do elemento selecionado para a área de transferência
      clipboard.value = JSON.parse(JSON.stringify(selectedElement.value));
    }
  }

  // Função recursiva para gerar novos IDs para o elemento e todos os seus filhos
  function regenerateIds(element: UIElement): UIElement {
    const newElement = { ...element, id: crypto.randomUUID() };
    newElement.children = newElement.children.map((child) =>
      regenerateIds(child),
    );
    return newElement;
  }

  function pasteElement() {
    if (!clipboard.value) return;

    // Clona o elemento da área de transferência e gera novos IDs
    const clonedElement = regenerateIds(
      JSON.parse(JSON.stringify(clipboard.value)),
    );

    // Desloca a posição levemente (+10px) para não colar exatamente em cima do original
    clonedElement.properties.x += 10;
    clonedElement.properties.y += 10;

    // Adiciona um sufixo ao nome para identificar que é uma cópia
    clonedElement.name = `${clonedElement.name} (Cópia)`;

    // Lógica para decidir onde colar (mesma lógica do addElement)
    let targetParent = null;
    if (selectedElement.value) {
      if (selectedElement.value.type === "panel") {
        targetParent = selectedElement.value;
      } else {
        targetParent = findParent(elements.value, selectedElement.value.id);
      }
    }

    if (targetParent && targetParent.type === "panel") {
      targetParent.children.push(clonedElement);
    } else {
      elements.value.push(clonedElement);
    }

    // Seleciona o novo elemento colado e salva no histórico
    selectElement(clonedElement.id);
    saveSnapshot();
  }

  return {
    elements,
    selectedElementId,
    selectedElement,
    addElement,
    deleteElement,
    selectElement,
    saveSnapshot,
    undo,
    redo,
    copyElement,
    pasteElement,
  };
});
