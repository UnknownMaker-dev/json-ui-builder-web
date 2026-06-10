<script setup lang="ts">
import { ref, computed } from "vue";
import { useEditorStore } from "../../stores/editor.store";

// Importando os componentes específicos
import PanelElement from "../elements/panel.element.vue";
import ButtonElement from "../elements/button.element.vue";
import LabelElement from "../elements/label.element.vue";

const editorStore = useEditorStore();

// Mapeamento dinâmico dos componentes
const elementComponents: Record<string, any> = {
  panel: PanelElement,
  button: ButtonElement,
  label: LabelElement,
};

// --- Lógica de Drag & Drop (Mantida igual) ---
const isDragging = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const initialElementX = ref(0);
const initialElementY = ref(0);

const startDrag = (event: MouseEvent, id: string) => {
  editorStore.selectElement(id);
  const el = editorStore.selectedElement;
  if (!el) return;

  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialElementX.value = el.properties.x;
  initialElementY.value = el.properties.y;

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || !editorStore.selectedElement) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;
  editorStore.selectedElement.properties.x = initialElementX.value + deltaX;
  editorStore.selectedElement.properties.y = initialElementY.value + deltaY;
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
};
</script>

<template>
  <main class="canvas-area" @click.self="editorStore.selectElement(null)">
    <div class="canvas-container" @click.self="editorStore.selectElement(null)">
      <p v-if="editorStore.elements.length === 0" class="empty-text">
        O canvas está vazio. Adicione um elemento.
      </p>

      <!-- Renderização Dinâmica dos Elementos -->
      <div
        v-for="el in editorStore.elements"
        :key="el.id"
        class="canvas-element-wrapper"
        :class="{ 'is-selected': editorStore.selectedElementId === el.id }"
        :style="{
          left: el.properties.x + 'px',
          top: el.properties.y + 'px',
          width: el.properties.width + 'px',
          height: el.properties.height + 'px',
        }"
        @mousedown.stop="startDrag($event, el.id)"
      >
        <!-- O Vue decide qual componente renderizar baseado no el.type -->
        <component :is="elementComponents[el.type]" :element="el" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  background-color: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 2rem;
}
.canvas-container {
  width: 800px;
  height: 600px;
  background-color: #333333;
  border: 2px dashed #3e3e42;
  position: relative;
  overflow: hidden;
}
.empty-text {
  color: #888;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* O wrapper agora controla a posição e o tamanho, o componente interno preenche 100% */
.canvas-element-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
}

.canvas-element-wrapper:active {
  cursor: grabbing;
}

.canvas-element-wrapper.is-selected {
  outline: 2px solid #007acc; /* Usando outline em vez de border para não alterar o tamanho real */
  box-shadow: 0 0 5px #007acc;
  z-index: 10;
}
</style>
