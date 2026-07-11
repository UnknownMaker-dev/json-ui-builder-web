<script setup lang="ts">
import { ref } from "vue";
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

const startDrag = (event: PointerEvent) => {
  editorStore.selectElement(props.element.id);
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;

  window.addEventListener("pointermove", onDrag);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;
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

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
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

  // Lógica matemática para cada direção puxada
  if (handle.includes("e")) newW += deltaX; // Direita (East)
  if (handle.includes("s")) newH += deltaY; // Baixo (South)
  if (handle.includes("w")) {
    // Esquerda (West)
    newW -= deltaX;
    newX += deltaX;
  }
  if (handle.includes("n")) {
    // Cima (North)
    newH -= deltaY;
    newY += deltaY;
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
    :class="{ 'is-selected': editorStore.selectedElementId === element.id }"
    :style="{
      left: element.properties.x + 'px',
      top: element.properties.y + 'px',
      width: element.properties.width + 'px',
      height: element.properties.height + 'px',
    }"
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
