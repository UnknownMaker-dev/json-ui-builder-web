<script setup lang="ts">
import { ref } from "vue";
import { useEditorStore, type UIElement } from "../../stores/editor.store";
import PanelElement from "../elements/panel.component.vue";
import ButtonElement from "../elements/button.component.vue";
import LabelElement from "../elements/label.component.vue";
import ImageElement from "../elements/image.component.vue";
import ContainerElement from "../elements/container.component.vue";
import CanvasNode from "./canvas-node.component.vue";

const props = defineProps<{ element: UIElement }>();
const editorStore = useEditorStore();

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

const startDrag = (event: MouseEvent) => {
  editorStore.selectElement(props.element.id);
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;
  props.element.properties.x = initialX.value + deltaX;
  props.element.properties.y = initialY.value + deltaY;
};

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
    editorStore.saveSnapshot(); // <-- ADICIONADO AQUI
  }
};
// --- LÓGICA DE RESIZE (Redimensionar) ---
const isResizing = ref(false);
const currentHandle = ref("");
const initialW = ref(0);
const initialH = ref(0);

const startResize = (event: MouseEvent, handle: string) => {
  isResizing.value = true;
  currentHandle.value = handle;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;
  initialW.value = props.element.properties.width;
  initialH.value = props.element.properties.height;

  window.addEventListener("mousemove", onResize);
  window.addEventListener("mouseup", stopResize);
};

const onResize = (event: MouseEvent) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;

  let newW = initialW.value;
  let newH = initialH.value;
  let newX = initialX.value;
  let newY = initialY.value;

  // Lógica matemática para cada direção puxada
  if (currentHandle.value.includes("e")) newW += deltaX; // Direita (East)
  if (currentHandle.value.includes("s")) newH += deltaY; // Baixo (South)
  if (currentHandle.value.includes("w")) {
    // Esquerda (West)
    newW -= deltaX;
    newX += deltaX;
  }
  if (currentHandle.value.includes("n")) {
    // Cima (North)
    newH -= deltaY;
    newY += deltaY;
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

  props.element.properties.width = newW;
  props.element.properties.height = newH;
  props.element.properties.x = newX;
  props.element.properties.y = newY;
};

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false;
    window.removeEventListener("mousemove", onResize);
    window.removeEventListener("mouseup", stopResize);
    editorStore.saveSnapshot(); // <-- ADICIONADO AQUI
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
    @mousedown.stop="startDrag"
  >
    <!-- Componente Real -->
    <component :is="elementComponents[element.type]" :element="element">
      <CanvasNode
        v-for="child in element.children"
        :key="child.id"
        :element="child"
      />
    </component>

    <!-- Resize Handles (Só aparecem se o elemento estiver selecionado) -->
    <template v-if="editorStore.selectedElementId === element.id">
      <!-- Cantos -->
      <div
        class="resize-handle nw"
        @mousedown.stop.prevent="startResize($event, 'nw')"
      ></div>
      <div
        class="resize-handle ne"
        @mousedown.stop.prevent="startResize($event, 'ne')"
      ></div>
      <div
        class="resize-handle sw"
        @mousedown.stop.prevent="startResize($event, 'sw')"
      ></div>
      <div
        class="resize-handle se"
        @mousedown.stop.prevent="startResize($event, 'se')"
      ></div>
      <!-- Bordas -->
      <div
        class="resize-handle n"
        @mousedown.stop.prevent="startResize($event, 'n')"
      ></div>
      <div
        class="resize-handle s"
        @mousedown.stop.prevent="startResize($event, 's')"
      ></div>
      <div
        class="resize-handle e"
        @mousedown.stop.prevent="startResize($event, 'e')"
      ></div>
      <div
        class="resize-handle w"
        @mousedown.stop.prevent="startResize($event, 'w')"
      ></div>
    </template>
  </div>
</template>

<style scoped>
.canvas-element-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
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
  z-index: 20;
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
