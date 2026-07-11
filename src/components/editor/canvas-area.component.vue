<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useEditorStore } from "../../stores/editor.store";
import CanvasNode from "./canvas-node.component.vue";

const editorStore = useEditorStore();

// Listener para deletar com o teclado
const handleKeyDown = (event: KeyboardEvent) => {
  if (document.activeElement?.tagName === "INPUT") return;

  // Deletar
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    editorStore.selectedElementId
  ) {
    editorStore.deleteElement(editorStore.selectedElementId);
  }

  // Desfazer (Ctrl + Z)
  if (event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) {
    editorStore.undo();
  }

  // Refazer (Ctrl + Y ou Ctrl + Shift + Z)
  if (
    (event.ctrlKey && event.key.toLowerCase() === "y") ||
    (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z")
  ) {
    editorStore.redo();
  }

  // Copiar (Ctrl + C)
  if (event.ctrlKey && event.key.toLowerCase() === "c") {
    editorStore.copyElement();
  }

  // Colar (Ctrl + V)
  if (event.ctrlKey && event.key.toLowerCase() === "v") {
    editorStore.pasteElement();
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
  background-color: var(--bg);
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.035) 1px, transparent 0);
  background-size: 22px 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 2.5rem;
}
.canvas-container {
  width: 800px;
  height: 600px;
  background-color: #2b2f3d;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}
.empty-text {
  color: var(--text-faint);
  font-size: 13px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
