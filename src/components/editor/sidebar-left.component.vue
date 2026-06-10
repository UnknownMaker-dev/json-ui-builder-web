<script setup lang="ts">
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();

const handleAddElement = (type: "button" | "panel" | "label", name: string) => {
  editorStore.addElement(type, name);
};
</script>

<template>
  <aside class="sidebar-left">
    <!-- Seção de Ferramentas (Toolbox) -->
    <div class="section">
      <h2>Adicionar</h2>
      <ul class="toolbox">
        <li @click="handleAddElement('panel', 'Novo Painel')">📦 Panel</li>
        <li @click="handleAddElement('button', 'Novo Botão')">🔘 Button</li>
        <li @click="handleAddElement('label', 'Novo Texto')">📝 Label</li>
      </ul>
    </div>

    <!-- Seção da Árvore de Elementos (Explorer) -->
    <div class="section explorer-section">
      <h2>Explorer</h2>

      <div v-if="editorStore.elements.length === 0" class="empty-explorer">
        Nenhum elemento no projeto.
      </div>

      <ul class="explorer-tree" v-else>
        <li
          v-for="el in editorStore.elements"
          :key="el.id"
          :class="{ 'is-selected': editorStore.selectedElementId === el.id }"
          @click="editorStore.selectElement(el.id)"
        >
          <span class="icon">
            {{
              el.type === "panel" ? "📦" : el.type === "button" ? "🔘" : "📝"
            }}
          </span>
          <span class="name">{{ el.name }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-left {
  width: 250px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
}

.section {
  padding: 1rem;
  border-bottom: 1px solid #3e3e42;
}

.explorer-section {
  flex: 1;
  overflow-y: auto;
}

h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  color: #cccccc;
  letter-spacing: 0.5px;
}

/* Estilos da Toolbox */
ul {
  list-style: none;
  padding: 0;
}
.toolbox li {
  padding: 0.5rem;
  background-color: #333333;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}
.toolbox li:hover {
  background-color: #094771;
}

/* Estilos do Explorer */
.empty-explorer {
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}
.explorer-tree li {
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #cccccc;
  border-radius: 3px;
  margin-bottom: 2px;
}
.explorer-tree li:hover {
  background-color: #2a2d2e;
}
.explorer-tree li.is-selected {
  background-color: #094771;
  color: #ffffff;
}
.icon {
  font-size: 1rem;
}
.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
