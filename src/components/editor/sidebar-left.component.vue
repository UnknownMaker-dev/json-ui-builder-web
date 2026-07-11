<script setup lang="ts">
import { Boxes, FolderTree } from "lucide-vue-next";
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
      <h2><Boxes :size="14" /> Adicionar</h2>
      <div class="toolbox">
        <button
          v-for="tool in tools"
          :key="tool.type"
          class="tool"
          :class="{ disabled: isDisabled(tool.type) }"
          @click="handleAddElement(tool.type)"
        >
          <span class="tool-icon"><component :is="tool.icon" :size="17" /></span>
          <span class="tool-label">{{ tool.label }}</span>
        </button>
      </div>
    </div>

    <div class="section explorer-section">
      <h2><FolderTree :size="14" /> Explorer</h2>
      <div v-if="editorStore.elements.length === 0" class="empty-explorer">
        Nenhum elemento no projeto.
      </div>
      <ul class="explorer-tree" v-else>
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
.sidebar-left {
  width: 244px;
  background-color: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}
.section {
  padding: 14px;
  border-bottom: 1px solid var(--border-soft);
}
.explorer-section {
  flex: 1;
  overflow-y: auto;
}
h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: var(--text-faint);
  letter-spacing: 0.7px;
  font-weight: 600;
}
h2 :deep(svg) {
  color: var(--accent);
}
.toolbox {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 12px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--text-soft);
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.05s;
}
.tool:hover:not(.disabled) {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--text);
}
.tool:hover:not(.disabled) .tool-icon {
  color: var(--accent);
}
.tool:active:not(.disabled) {
  transform: translateY(1px);
}
.tool.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tool-icon {
  color: var(--text-soft);
  transition: color 0.15s;
}
.tool-label {
  font-size: 11.5px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}
.empty-explorer {
  color: var(--text-faint);
  font-size: 12.5px;
  font-style: italic;
  padding: 4px 2px;
}
.explorer-tree {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
</style>
