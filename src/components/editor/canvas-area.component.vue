<script setup lang="ts">
import { ref } from "vue";
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();

// Variáveis de estado para o Drag & Drop
const isDragging = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const initialElementX = ref(0);
const initialElementY = ref(0);

// Inicia o arrasto
const startDrag = (event: MouseEvent, id: string) => {
  // Seleciona o elemento clicado
  editorStore.selectElement(id);

  const el = editorStore.selectedElement;
  if (!el) return;

  // Registra as posições iniciais
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialElementX.value = el.properties.x;
  initialElementY.value = el.properties.y;

  // Adiciona os listeners no window para continuar arrastando mesmo se o mouse sair de cima do elemento
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

// Executa enquanto o mouse se move
const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || !editorStore.selectedElement) return;

  // Calcula a diferença (delta) de onde o mouse começou até onde está agora
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;

  // Atualiza a posição do elemento na Store
  editorStore.selectedElement.properties.x = initialElementX.value + deltaX;
  editorStore.selectedElement.properties.y = initialElementY.value + deltaY;
};

// Para o arrasto
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

      <!-- Renderização dos Elementos -->
      <div
        v-for="el in editorStore.elements"
        :key="el.id"
        class="canvas-element"
        :class="{ 'is-selected': editorStore.selectedElementId === el.id }"
        :style="{
          left: el.properties.x + 'px',
          top: el.properties.y + 'px',
          width: el.properties.width + 'px',
          height: el.properties.height + 'px',
        }"
        @mousedown.stop="startDrag($event, el.id)"
      >
        {{ el.properties.text || el.type }}
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
  pointer-events: none; /* Evita que o texto interfira no clique do canvas */
}

.canvas-element {
  position: absolute;
  background-color: #555;
  border: 1px solid #777;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab; /* Muda o cursor para indicar que é arrastável */
  user-select: none;
}

.canvas-element:active {
  cursor: grabbing; /* Cursor muda ao segurar */
}

.canvas-element.is-selected {
  border: 2px solid #007acc;
  box-shadow: 0 0 5px #007acc;
  z-index: 10;
}
</style>
