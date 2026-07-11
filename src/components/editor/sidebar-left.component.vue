<script setup lang="ts">
import { useEditorStore } from "../../stores/editor.store";
import {
  ELEMENT_DEFINITIONS,
  isContainer,
  type UIElementType,
} from "../../types/element.types";
import ExplorerItem from "./explorer-item.component.vue";

const editorStore = useEditorStore();

const tools = Object.values(ELEMENT_DEFINITIONS);

const isDisabled = (type: UIElementType) =>
  editorStore.elements.length === 0 && !isContainer(type);

const handleAddElement = (type: UIElementType) => {
  // O primeiro elemento do projeto precisa ser um container (raiz da tela).
  if (isDisabled(type)) {
    alert("O primeiro elemento do projeto deve ser um container (Panel, Stack, etc.)!");
    return;
  }
  editorStore.addElement(type);
};
</script>

<template>
  <aside class="sidebar-left">
    <div class="section">
      <h2>Adicionar</h2>
      <ul class="toolbox">
        <li
          v-for="tool in tools"
          :key="tool.type"
          @click="handleAddElement(tool.type)"
          :class="{ disabled: isDisabled(tool.type) }"
        >
          {{ tool.icon }} {{ tool.label }}
        </li>
      </ul>
    </div>

    <div class="section explorer-section">
      <h2>Explorer</h2>
      <div v-if="editorStore.elements.length === 0" class="empty-explorer">
        Nenhum elemento no projeto.
      </div>
      <ul class="explorer-tree" v-else>
        <!-- Chama o componente recursivo para os elementos raiz -->
        <ExplorerItem
          v-for="el in editorStore.elements"
          :key="el.id"
          :element="el"
          :depth="0"
        />
      </ul>
    </div>
  </aside>
</template>

<style scoped>
/* Mantenha o mesmo CSS de antes, adicionando apenas a classe disabled */
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
.toolbox li:hover:not(.disabled) {
  background-color: #094771;
}
.toolbox li.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.empty-explorer {
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}
.explorer-tree {
  display: flex;
  flex-direction: column;
}
</style>
