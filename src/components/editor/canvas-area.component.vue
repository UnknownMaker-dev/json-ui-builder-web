<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useEditorStore } from "../../stores/editor.store";
import CanvasNode from "./canvas-node.component.vue";

const editorStore = useEditorStore();

// Listener para deletar com o teclado
const handleKeyDown = (event: KeyboardEvent) => {
  // Verifica se a tecla é Delete ou Backspace e se há um elemento selecionado
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    editorStore.selectedElementId
  ) {
    // Evita deletar se o usuário estiver digitando em um input (como no painel de propriedades)
    if (document.activeElement?.tagName === "INPUT") return;

    editorStore.deleteElement(editorStore.selectedElementId);
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<!-- O template e o style continuam iguais -->
<template>
  <main class="canvas-area" @click.self="editorStore.selectElement(null)">
    <div class="canvas-container" @click.self="editorStore.selectElement(null)">
      <p v-if="editorStore.elements.length === 0" class="empty-text">
        O canvas está vazio. Adicione um Painel para começar.
      </p>
      <CanvasNode
        v-for="el in editorStore.elements"
        :key="el.id"
        :element="el"
      />
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
</style>
