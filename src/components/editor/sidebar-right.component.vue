<script setup lang="ts">
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();

const handleDelete = () => {
  if (editorStore.selectedElementId) {
    editorStore.deleteElement(editorStore.selectedElementId);
  }
};
</script>

<template>
  <aside class="sidebar-right">
    <h2>Propriedades</h2>

    <div v-if="editorStore.selectedElement" class="properties-panel">
      <!-- Novo campo para Renomear -->
      <div class="property-group">
        <label>Nome (Explorer)</label>
        <input
          type="text"
          v-model="editorStore.selectedElement.name"
          @change="editorStore.saveSnapshot()"
        />
      </div>

      <div class="property-group">
        <label>ID</label>
        <input
          type="text"
          :value="editorStore.selectedElement.id"
          disabled
          class="disabled-input"
          @change="editorStore.saveSnapshot()"
        />
      </div>

      <div class="property-group">
        <label>Tipo</label>
        <input
          type="text"
          :value="editorStore.selectedElement.type"
          disabled
          class="disabled-input"
          @change="editorStore.saveSnapshot()"
        />
      </div>

      <div
        class="property-group"
        v-if="editorStore.selectedElement.properties.text !== undefined"
      >
        <label>Texto (Exibição)</label>
        <input
          type="text"
          v-model="editorStore.selectedElement.properties.text"
          @change="editorStore.saveSnapshot()"
        />
      </div>

      <div class="property-row">
        <div class="property-group">
          <label>X (px)</label>
          <input
            type="number"
            v-model.number="editorStore.selectedElement.properties.x"
            @change="editorStore.saveSnapshot()"
          />
        </div>
        <div class="property-group">
          <label>Y (px)</label>
          <input
            type="number"
            v-model.number="editorStore.selectedElement.properties.y"
            @change="editorStore.saveSnapshot()"
          />
        </div>
      </div>

      <div class="property-row">
        <div class="property-group">
          <label>Largura (px)</label>
          <input
            type="number"
            v-model.number="editorStore.selectedElement.properties.width"
            @change="editorStore.saveSnapshot()"
          />
        </div>
        <div class="property-group">
          <label>Altura (px)</label>
          <input
            type="number"
            v-model.number="editorStore.selectedElement.properties.height"
            @change="editorStore.saveSnapshot()"
          />
        </div>
      </div>

      <!-- Botão de Deletar -->
      <button class="btn-delete" @click="handleDelete">
        🗑️ Deletar Elemento
      </button>
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
  border-bottom: 1px solid #3e3e42;
  padding-bottom: 0.5rem;
}
.properties-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.property-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.property-row {
  display: flex;
  gap: 0.5rem;
}
label {
  font-size: 0.8rem;
  color: #aaaaaa;
}
input {
  background-color: #3c3c3c;
  border: 1px solid #555;
  color: #fff;
  padding: 0.4rem;
  border-radius: 3px;
  font-size: 0.9rem;
  width: 100%;
}
input:focus {
  outline: none;
  border-color: #007acc;
}
.disabled-input {
  background-color: #2d2d2d;
  color: #777;
  cursor: not-allowed;
}
.no-selection {
  color: #666666;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 2rem;
}

/* Estilo do botão de deletar */
.btn-delete {
  margin-top: 1rem;
  background-color: #a12626;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.btn-delete:hover {
  background-color: #c53030;
}
</style>
