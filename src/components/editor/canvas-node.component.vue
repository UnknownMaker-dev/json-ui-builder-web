<script setup lang="ts">
import { ref, computed } from "vue";
import { useEditorStore, type UIElement } from "../../stores/editor.store";
import PanelElement from "../elements/panel.component.vue";
import ButtonElement from "../elements/button.component.vue";
import LabelElement from "../elements/label.component.vue";
import ImageElement from "../elements/image.component.vue";
import ContainerElement from "../elements/container.component.vue";
import CanvasNode from "./canvas-node.component.vue";

const props = defineProps<{ element: UIElement; parent?: UIElement }>();
const editorStore = useEditorStore();

// Dimensões do canvas raiz (devem casar com .canvas-container).
const CANVAS_W = 800;
const CANVAS_H = 600;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max));

/** Limites em que este elemento pode se mover: o container pai, ou o canvas. */
const bounds = () =>
  props.parent
    ? { w: props.parent.properties.width, h: props.parent.properties.height }
    : { w: CANVAS_W, h: CANVAS_H };

// Espaçamento entre itens empilhados (px).
const STACK_GAP = 2;

/** Quanto do espaço que sobra fica ANTES do elemento, por alinhamento. */
const ALIGN_FACTOR: Record<string, number> = {
  start: 0,
  center: 0.5,
  end: 1,
};

/**
 * Se este elemento é filho de um stack_panel, sua posição é DERIVADA da pilha
 * (empilhado na direção da orientação), não do x/y livre. Retorna null caso
 * contrário.
 */
const stackLayout = computed(() => {
  const p = props.parent;
  if (!p || p.type !== "stackPanel") return null;
  const horizontal = p.properties.orientation === "horizontal";
  const idx = p.children.findIndex((c) => c.id === props.element.id);

  // Eixo principal: a soma do que veio antes na pilha.
  let main = 0;
  for (let i = 0; i < idx; i++) {
    const s = p.children[i].properties;
    main += (horizontal ? s.width : s.height) + STACK_GAP;
  }

  // Eixo transversal: livre, decidido pelo alinhamento do próprio elemento.
  const own = props.element.properties;
  const room = horizontal
    ? p.properties.height - own.height
    : p.properties.width - own.width;
  const factor = ALIGN_FACTOR[own.stackAlign ?? "start"];
  const cross = Math.round(Math.max(0, room) * factor);

  return { horizontal, main, cross };
});

/** Estilo de posição/tamanho do wrapper (usa a pilha quando aplicável). */
const wrapperStyle = computed(() => {
  const pr = props.element.properties;
  const sl = stackLayout.value;
  if (sl) {
    return {
      left: (sl.horizontal ? sl.main : sl.cross) + "px",
      top: (sl.horizontal ? sl.cross : sl.main) + "px",
      width: pr.width + "px",
      height: pr.height + "px",
    };
  }
  return {
    left: pr.x + "px",
    top: pr.y + "px",
    width: pr.width + "px",
    height: pr.height + "px",
  };
});

const elementComponents: Record<string, any> = {
  panel: PanelElement,
  button: ButtonElement,
  label: LabelElement,
  image: ImageElement,
  stackPanel: ContainerElement,
  collectionPanel: ContainerElement,
  scrollingPanel: ContainerElement,
};

// --- ESTADOS COMPARTILHADOS (Drag & Resize) ---
const startMouseX = ref(0);
const startMouseY = ref(0);
const initialX = ref(0);
const initialY = ref(0);

// --- LÓGICA DE DRAG (Mover) ---
const isDragging = ref(false);
// Reordenação dentro de um stack_panel.
const isStackDrag = ref(false);
const stackBaseMain = ref(0);

const startDrag = (event: PointerEvent) => {
  editorStore.selectElement(props.element.id);
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;

  // Filho de stack: entra em modo "reordenar" em vez de mover livre.
  if (stackLayout.value) {
    isStackDrag.value = true;
    stackBaseMain.value = stackLayout.value.main;
  }

  window.addEventListener("pointermove", onDrag);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;

  // Reordenação viva dentro do stack_panel.
  if (isStackDrag.value && props.parent) {
    reorderInStack(deltaX, deltaY);
    return;
  }

  const b = bounds();
  // Mantém o elemento dentro do container pai (0 até borda - tamanho).
  props.element.properties.x = clamp(
    initialX.value + deltaX,
    0,
    b.w - props.element.properties.width,
  );
  props.element.properties.y = clamp(
    initialY.value + deltaY,
    0,
    b.h - props.element.properties.height,
  );
};

/** Move o elemento para o índice correspondente à posição arrastada na pilha. */
const reorderInStack = (deltaX: number, deltaY: number) => {
  const p = props.parent!;
  const horizontal = p.properties.orientation === "horizontal";
  const delta = horizontal ? deltaX : deltaY;
  const virtual = stackBaseMain.value + delta; // posição projetada na pilha

  // Encontra o índice de inserção comparando com o meio de cada vizinho.
  const others = p.children.filter((c) => c.id !== props.element.id);
  let pos = 0;
  let newIndex = 0;
  for (const o of others) {
    const sz = horizontal ? o.properties.width : o.properties.height;
    if (virtual < pos + sz / 2) break;
    pos += sz + STACK_GAP;
    newIndex++;
  }

  const cur = p.children.findIndex((c) => c.id === props.element.id);
  if (cur !== -1 && cur !== newIndex) {
    p.children.splice(cur, 1);
    p.children.splice(newIndex, 0, props.element);
  }
};

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    isStackDrag.value = false;
    window.removeEventListener("pointermove", onDrag);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
    editorStore.saveSnapshot();
  }
};
// --- LÓGICA DE RESIZE (Redimensionar) ---
const isResizing = ref(false);
const currentHandle = ref("");
const initialW = ref(0);
const initialH = ref(0);

const startResize = (event: PointerEvent, handle: string) => {
  isResizing.value = true;
  currentHandle.value = handle;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;
  initialW.value = props.element.properties.width;
  initialH.value = props.element.properties.height;

  window.addEventListener("pointermove", onResize);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
};

const onResize = (event: PointerEvent) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;
  const handle = currentHandle.value;

  let newW = initialW.value;
  let newH = initialH.value;
  let newX = initialX.value;
  let newY = initialY.value;

  if (event.altKey) {
    // Alt: redimensiona simétrico, mantendo o CENTRO fixo (cresce dos 2 lados).
    if (handle.includes("e")) {
      newW += 2 * deltaX;
      newX -= deltaX;
    }
    if (handle.includes("w")) {
      newW -= 2 * deltaX;
      newX += deltaX;
    }
    if (handle.includes("s")) {
      newH += 2 * deltaY;
      newY -= deltaY;
    }
    if (handle.includes("n")) {
      newH -= 2 * deltaY;
      newY += deltaY;
    }
  } else {
    // Padrão: a borda puxada se move; a oposta fica fixa.
    if (handle.includes("e")) newW += deltaX; // Direita (East)
    if (handle.includes("s")) newH += deltaY; // Baixo (South)
    if (handle.includes("w")) {
      newW -= deltaX;
      newX += deltaX;
    }
    if (handle.includes("n")) {
      newH -= deltaY;
      newY += deltaY;
    }
  }

  // Manter proporção: SHIFT (desktop) ou trava de proporção (mobile).
  const keepRatio = event.shiftKey || editorStore.aspectLocked;
  const aspect = initialH.value > 0 ? initialW.value / initialH.value : 1;
  if (keepRatio && aspect > 0) {
    const horiz = handle.includes("e") || handle.includes("w");
    const vert = handle.includes("n") || handle.includes("s");
    if (vert && !horiz) {
      newW = newH * aspect; // arrasto vertical comanda
    } else {
      newH = newW / aspect; // horizontal ou canto: largura comanda
    }
    // Reancorar o lado oposto quando puxa pelo topo/esquerda.
    if (handle.includes("n")) newY = initialY.value + (initialH.value - newH);
    if (handle.includes("w")) newX = initialX.value + (initialW.value - newW);
  }

  // Limite mínimo de tamanho (10px) para não bugar a tela
  if (newW < 10) {
    if (currentHandle.value.includes("w")) newX -= 10 - newW;
    newW = 10;
  }
  if (newH < 10) {
    if (currentHandle.value.includes("n")) newY -= 10 - newH;
    newH = 10;
  }

  // Mantém o elemento dentro do container pai (não ultrapassa as bordas).
  const b = bounds();
  if (newX < 0) {
    newW += newX; // encolhe ao bater na borda esquerda
    newX = 0;
  }
  if (newY < 0) {
    newH += newY;
    newY = 0;
  }
  if (newX + newW > b.w) newW = b.w - newX;
  if (newY + newH > b.h) newH = b.h - newY;
  newW = Math.max(10, newW);
  newH = Math.max(10, newH);

  // Arredonda: a proporção gera frações e canvas/ImageData exigem inteiros.
  props.element.properties.width = Math.round(newW);
  props.element.properties.height = Math.round(newH);
  props.element.properties.x = Math.round(newX);
  props.element.properties.y = Math.round(newY);
};

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false;
    window.removeEventListener("pointermove", onResize);
    window.removeEventListener("pointerup", stopResize);
    window.removeEventListener("pointercancel", stopResize);
    editorStore.saveSnapshot();
  }
};
</script>

<template>
  <div
    class="canvas-element-wrapper"
    :class="{
      'is-selected': editorStore.selectedElementId === element.id,
      'in-stack': !!stackLayout,
      'is-reordering': isStackDrag,
    }"
    :style="wrapperStyle"
    @pointerdown.stop="startDrag"
  >
    <!-- Componente Real -->
    <component :is="elementComponents[element.type]" :element="element">
      <CanvasNode
        v-for="child in element.children"
        :key="child.id"
        :element="child"
        :parent="element"
      />
    </component>

    <!-- Resize Handles (Só aparecem se o elemento estiver selecionado) -->
    <template v-if="editorStore.selectedElementId === element.id">
      <!-- Cantos -->
      <div
        class="resize-handle nw"
        @pointerdown.stop.prevent="startResize($event, 'nw')"
      ></div>
      <div
        class="resize-handle ne"
        @pointerdown.stop.prevent="startResize($event, 'ne')"
      ></div>
      <div
        class="resize-handle sw"
        @pointerdown.stop.prevent="startResize($event, 'sw')"
      ></div>
      <div
        class="resize-handle se"
        @pointerdown.stop.prevent="startResize($event, 'se')"
      ></div>
      <!-- Bordas -->
      <div
        class="resize-handle n"
        @pointerdown.stop.prevent="startResize($event, 'n')"
      ></div>
      <div
        class="resize-handle s"
        @pointerdown.stop.prevent="startResize($event, 's')"
      ></div>
      <div
        class="resize-handle e"
        @pointerdown.stop.prevent="startResize($event, 'e')"
      ></div>
      <div
        class="resize-handle w"
        @pointerdown.stop.prevent="startResize($event, 'w')"
      ></div>
    </template>
  </div>
</template>

<style scoped>
.canvas-element-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
  /* Evita que o navegador role/zoome enquanto arrasta no toque. */
  touch-action: none;
}
.canvas-element-wrapper:active {
  cursor: grabbing;
}
.canvas-element-wrapper.is-selected {
  outline: 2px solid var(--accent);
  z-index: 10;
}
/* Itens empilhados deslizam suavemente ao reordenar. */
.canvas-element-wrapper.in-stack {
  transition:
    left 0.16s ease,
    top 0.16s ease;
}
/* O item sendo arrastado fica por cima e responde na hora (sem transição). */
.canvas-element-wrapper.is-reordering {
  z-index: 30;
  transition: none;
  cursor: grabbing;
  filter: brightness(1.08);
}

/* Estilos dos Resize Handles */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border: 1px solid var(--accent);
  border-radius: 2px;
  z-index: 20;
  touch-action: none;
}
/* Alvos de toque maiores em telas sem mouse. */
@media (pointer: coarse) {
  .resize-handle {
    width: 18px;
    height: 18px;
    border-width: 2px;
  }
  .nw, .ne, .sw, .se, .n, .s, .e, .w {
    /* recentraliza os handles maiores nas bordas */
  }
  .nw { top: -9px; left: -9px; }
  .ne { top: -9px; right: -9px; }
  .sw { bottom: -9px; left: -9px; }
  .se { bottom: -9px; right: -9px; }
  .n { top: -9px; left: calc(50% - 9px); }
  .s { bottom: -9px; left: calc(50% - 9px); }
  .e { top: calc(50% - 9px); right: -9px; }
  .w { top: calc(50% - 9px); left: -9px; }
}

/* Posições e Cursores dos Handles */
.nw {
  top: -4px;
  left: -4px;
  cursor: nwse-resize;
}
.ne {
  top: -4px;
  right: -4px;
  cursor: nesw-resize;
}
.sw {
  bottom: -4px;
  left: -4px;
  cursor: nesw-resize;
}
.se {
  bottom: -4px;
  right: -4px;
  cursor: nwse-resize;
}

.n {
  top: -4px;
  left: calc(50% - 4px);
  cursor: ns-resize;
}
.s {
  bottom: -4px;
  left: calc(50% - 4px);
  cursor: ns-resize;
}
.e {
  top: calc(50% - 4px);
  right: -4px;
  cursor: ew-resize;
}
.w {
  top: calc(50% - 4px);
  left: -4px;
  cursor: ew-resize;
}
</style>
