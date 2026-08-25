import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  ELEMENT_DEFINITIONS,
  isContainer,
  type StackAlign,
  type UIElement,
  type UIElementType,
} from "../types/element.types";
import { toNamespace, type UIScreen } from "../types/screen.types";

// Reexporta para compatibilidade com imports antigos (`import { UIElement } from stores`).
export type { UIElement } from "../types/element.types";

/** Versão da API de script do Bedrock usada no manifest do behavior pack. */
export type ScriptApi = "1.x" | "2.x";

function newScreen(name: string): UIScreen {
  return {
    id: crypto.randomUUID(),
    name,
    namespace: toNamespace(name),
    elements: [],
    selectedElementId: null,
  };
}

export const useEditorStore = defineStore("editor", () => {
  // --- TELAS (ABAS) ---
  const screens = ref<UIScreen[]>([newScreen("Custom UI")]);
  const activeScreenId = ref<string>(screens.value[0].id);

  const activeScreen = computed<UIScreen>(
    () => screens.value.find((s) => s.id === activeScreenId.value) ?? screens.value[0],
  );

  /**
   * A árvore da tela ativa. Exposta com este nome para que todos os componentes
   * do editor continuem funcionando sem saber que existem várias telas.
   */
  const elements = computed<UIElement[]>({
    get: () => activeScreen.value.elements,
    set: (next) => {
      activeScreen.value.elements = next;
    },
  });

  const selectedElementId = computed<string | null>({
    get: () => activeScreen.value.selectedElementId,
    set: (next) => {
      activeScreen.value.selectedElementId = next;
    },
  });

  // --- PROJETO / PACOTE ---
  /** Nome do pacote mostrado na lista de recursos do Minecraft. */
  const packName = ref<string>("Meu Pack de UI");
  /** Item que abre o menu no script gerado. */
  const triggerItem = ref<string>("minecraft:stick");
  /** Versão da API de script declarada no manifest do behavior pack. */
  const scriptApi = ref<ScriptApi>("2.x");

  /** Compatibilidade: o namespace do JSON UI é o da tela ativa. */
  const projectNamespace = computed<string>({
    get: () => activeScreen.value.namespace,
    set: (next) => {
      activeScreen.value.namespace = next;
    },
  });

  function addScreen(name?: string) {
    const base = name ?? `Tela ${screens.value.length + 1}`;
    const screen = newScreen(uniqueScreenName(base));
    screens.value.push(screen);
    activeScreenId.value = screen.id;
    ensureHistory(screen.id);
  }

  /** Garante que duas telas nunca tenham o mesmo nome (o nome é a chave da rota). */
  function uniqueScreenName(desired: string, ignoreId?: string): string {
    const taken = new Set(
      screens.value.filter((s) => s.id !== ignoreId).map((s) => s.name.toLowerCase()),
    );
    if (!taken.has(desired.toLowerCase())) return desired;
    let n = 2;
    while (taken.has(`${desired} ${n}`.toLowerCase())) n++;
    return `${desired} ${n}`;
  }

  function renameScreen(id: string, name: string) {
    const screen = screens.value.find((s) => s.id === id);
    if (!screen) return;
    screen.name = uniqueScreenName(name.trim() || "Tela", id);
    screen.namespace = toNamespace(screen.name);
  }

  function removeScreen(id: string) {
    if (screens.value.length <= 1) return;
    const index = screens.value.findIndex((s) => s.id === id);
    if (index === -1) return;
    screens.value.splice(index, 1);
    delete histories[id];
    if (activeScreenId.value === id) {
      activeScreenId.value = screens.value[Math.max(0, index - 1)].id;
    }
  }

  function duplicateScreen(id: string) {
    const source = screens.value.find((s) => s.id === id);
    if (!source) return;
    const copy: UIScreen = {
      id: crypto.randomUUID(),
      name: uniqueScreenName(`${source.name} Cópia`),
      namespace: "",
      elements: JSON.parse(JSON.stringify(source.elements)),
      selectedElementId: null,
    };
    copy.namespace = toNamespace(copy.name);
    const reid = (nodes: UIElement[]) => {
      for (const n of nodes) {
        n.id = crypto.randomUUID();
        reid(n.children);
      }
    };
    reid(copy.elements);
    screens.value.push(copy);
    activeScreenId.value = copy.id;
    ensureHistory(copy.id);
  }

  /** Estado inteiro do projeto, para salvar em arquivo. */
  function snapshotProject() {
    return {
      packName: packName.value,
      triggerItem: triggerItem.value,
      scriptApi: scriptApi.value,
      screens: JSON.parse(JSON.stringify(screens.value)) as UIScreen[],
    };
  }

  /** Substitui o projeto inteiro pelo conteúdo de um arquivo salvo. */
  function loadProject(project: {
    packName: string;
    triggerItem: string;
    scriptApi: string;
    screens: UIScreen[];
  }) {
    packName.value = project.packName;
    triggerItem.value = project.triggerItem;
    scriptApi.value = project.scriptApi === "1.x" ? "1.x" : "2.x";
    screens.value = project.screens;
    activeScreenId.value = project.screens[0].id;
    for (const key of Object.keys(histories)) delete histories[key];
    for (const screen of project.screens) ensureHistory(screen.id);
  }

  function selectScreen(id: string) {
    if (screens.value.some((s) => s.id === id)) activeScreenId.value = id;
  }

  /**
   * Nomes de tela onde um é trecho do outro quebram o roteamento: a subtração
   * de string casaria as duas ao mesmo tempo e o jogo mostraria as duas telas
   * sobrepostas. Detectado aqui para avisar antes de exportar.
   */
  const screenNameConflicts = computed(() => {
    const out: { a: string; b: string }[] = [];
    const list = screens.value;
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const a = list[i].name.trim();
        const b = list[j].name.trim();
        if (a && b && a !== b && b.includes(a)) out.push({ a, b });
      }
    }
    return out;
  });

  // --- HISTÓRICO (UNDO/REDO) POR TELA ---
  interface History {
    stack: string[];
    index: number;
  }
  const histories: Record<string, History> = {};
  let isUndoRedo = false;

  function ensureHistory(id: string): History {
    if (!histories[id]) {
      const screen = screens.value.find((s) => s.id === id);
      histories[id] = { stack: [JSON.stringify(screen?.elements ?? [])], index: 0 };
    }
    return histories[id];
  }
  ensureHistory(activeScreenId.value);

  function saveSnapshot() {
    if (isUndoRedo) return;
    const h = ensureHistory(activeScreenId.value);
    const snapshot = JSON.stringify(elements.value);
    if (h.index >= 0 && h.stack[h.index] === snapshot) return;
    if (h.index < h.stack.length - 1) h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(snapshot);
    h.index++;
  }

  function undo() {
    const h = ensureHistory(activeScreenId.value);
    if (h.index > 0) {
      isUndoRedo = true;
      h.index--;
      elements.value = JSON.parse(h.stack[h.index]);
      isUndoRedo = false;
    }
  }

  function redo() {
    const h = ensureHistory(activeScreenId.value);
    if (h.index < h.stack.length - 1) {
      isUndoRedo = true;
      h.index++;
      elements.value = JSON.parse(h.stack[h.index]);
      isUndoRedo = false;
    }
  }

  /**
   * Trava de proporção: quando ativa, o resize mantém a razão largura/altura
   * (equivalente a segurar SHIFT). Existe para mobile, que não tem SHIFT.
   */
  const aspectLocked = ref(false);
  function toggleAspectLock() {
    aspectLocked.value = !aspectLocked.value;
  }

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
    return newElement;
  }

  /**
   * Insere um elemento já montado no fim da raiz da tela (usado pela importação
   * de imagem de fundo, que precisa nascer atrás de tudo).
   */
  function addRootElement(element: UIElement, atBack = false) {
    if (atBack) elements.value.unshift(element);
    else elements.value.push(element);
    selectElement(element.id);
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

  // Dimensões do canvas raiz (devem casar com .canvas-container / canvas-node).
  const CANVAS_W = 800;
  const CANVAS_H = 600;
  const clampVal = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), Math.max(min, max));

  /**
   * Move o elemento selecionado por (dx, dy). Se ele for filho de um
   * stack_panel, as setas REORDENAM na pilha (o eixo segue a orientação) em vez
   * de mover livre. Caso contrário, move respeitando os limites do container.
   */
  function nudgeSelected(dx: number, dy: number) {
    const el = selectedElement.value;
    if (!el) return;
    const parent = findParent(elements.value, el.id);

    if (parent && parent.type === "stackPanel") {
      const horizontal = parent.properties.orientation === "horizontal";

      // Eixo da pilha: as setas reordenam.
      const step = horizontal ? dx : dy;
      if (step !== 0) {
        const idx = parent.children.findIndex((c) => c.id === el.id);
        const ni = idx + (step > 0 ? 1 : -1);
        if (ni >= 0 && ni < parent.children.length) {
          parent.children.splice(idx, 1);
          parent.children.splice(ni, 0, el);
          saveSnapshot();
        }
        return;
      }

      // Eixo transversal: as setas mudam o alinhamento.
      const cross = horizontal ? dy : dx;
      if (cross !== 0) {
        const order: StackAlign[] = ["start", "center", "end"];
        const at = order.indexOf(el.properties.stackAlign ?? "start");
        const next = order[Math.min(order.length - 1, Math.max(0, at + Math.sign(cross)))];
        if (next !== el.properties.stackAlign) {
          el.properties.stackAlign = next;
          saveSnapshot();
        }
      }
      return;
    }

    const bw = parent ? parent.properties.width : CANVAS_W;
    const bh = parent ? parent.properties.height : CANVAS_H;
    el.properties.x = clampVal(el.properties.x + dx, 0, bw - el.properties.width);
    el.properties.y = clampVal(el.properties.y + dy, 0, bh - el.properties.height);
    saveSnapshot();
  }

  /** Pai do elemento selecionado (null se for raiz). */
  const selectedParent = computed(() =>
    selectedElement.value
      ? findParent(elements.value, selectedElement.value.id)
      : null,
  );

  /**
   * Centraliza o elemento selecionado no seu container (o pai, ou o canvas se
   * for raiz). `axis`: "h" (horizontal), "v" (vertical) ou "both".
   * Não se aplica a filhos de stack_panel (que são posicionados pela pilha).
   */
  function centerSelected(axis: "h" | "v" | "both") {
    const el = selectedElement.value;
    if (!el) return;
    const parent = selectedParent.value;
    if (parent && parent.type === "stackPanel") return;

    const bw = parent ? parent.properties.width : CANVAS_W;
    const bh = parent ? parent.properties.height : CANVAS_H;
    if (axis === "h" || axis === "both")
      el.properties.x = Math.round((bw - el.properties.width) / 2);
    if (axis === "v" || axis === "both")
      el.properties.y = Math.round((bh - el.properties.height) / 2);
    saveSnapshot();
  }

  /** Substitui toda a árvore da tela ativa (usado na importação). */
  function setElements(next: UIElement[]) {
    elements.value = next;
    selectedElementId.value = null;
    saveSnapshot();
  }

  /** Limpa a tela ativa. */
  function reset() {
    elements.value = [];
    selectedElementId.value = null;
    saveSnapshot();
  }

  // --- COPIAR E COLAR (compartilhado entre telas) ---
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
    // telas
    screens,
    activeScreenId,
    activeScreen,
    addScreen,
    renameScreen,
    removeScreen,
    duplicateScreen,
    selectScreen,
    screenNameConflicts,
    snapshotProject,
    loadProject,
    // pacote
    packName,
    triggerItem,
    scriptApi,
    // árvore da tela ativa
    elements,
    selectedElementId,
    selectedElement,
    projectNamespace,
    aspectLocked,
    toggleAspectLock,
    addElement,
    addRootElement,
    deleteElement,
    selectElement,
    nudgeSelected,
    selectedParent,
    centerSelected,
    setElements,
    reset,
    saveSnapshot,
    undo,
    redo,
    copyElement,
    pasteElement,
  };
});
