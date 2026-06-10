<script setup lang="ts">
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();
</script>

<template>
  <main class="canvas-area">
    <div class="canvas-container">
      <!-- Aqui os elementos serão renderizados visualmente -->
      <p v-if="editorStore.elements.length === 0" class="empty-text">
        O canvas está vazio. Adicione um elemento.
      </p>
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
  background-color: #000000; /* Fundo simulando a tela do jogo */
  border: 2px dashed #3e3e42;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  color: #666666;
}
</style>
