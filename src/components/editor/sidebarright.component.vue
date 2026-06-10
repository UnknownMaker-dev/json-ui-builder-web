<script setup lang="ts">
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();
</script>

<template>
  <aside class="sidebar-right">
    <h2>Propriedades</h2>

    <div v-if="editorStore.selectedElement">
      <p><strong>ID:</strong> {{ editorStore.selectedElement.id }}</p>
      <p><strong>Tipo:</strong> {{ editorStore.selectedElement.type }}</p>
      <!-- Aqui virão os inputs para editar tamanho, cor, texto, etc -->
    </div>
    <div v-else class="no-selection">
      <p>Nenhum elemento selecionado.</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-right {
  width: 300px;
  background-color: #252526;
  border-left: 1px solid #3e3e42;
  padding: 1rem;
  overflow-y: auto;
}
h2 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #cccccc;
}
.no-selection {
  color: #666666;
  font-size: 0.9rem;
}
</style>
