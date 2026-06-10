<script setup lang="ts">
import { useEditorStore, type UIElement } from "../../stores/editor.store";

defineProps<{
  element: UIElement;
  depth: number;
}>();

const editorStore = useEditorStore();
</script>

<template>
  <!-- Renderiza o item atual -->
  <li
    class="explorer-item"
    :class="{ 'is-selected': editorStore.selectedElementId === element.id }"
    :style="{ paddingLeft: depth * 15 + 10 + 'px' }"
    @click.stop="editorStore.selectElement(element.id)"
  >
    <span class="icon">{{
      element.type === "panel" ? "📦" : element.type === "button" ? "🔘" : "📝"
    }}</span>
    <span class="name">{{ element.name }}</span>
  </li>

  <!-- Renderiza os filhos recursivamente chamando a si mesmo -->
  <ExplorerItem
    v-for="child in element.children"
    :key="child.id"
    :element="child"
    :depth="depth + 1"
  />
</template>

<style scoped>
.explorer-item {
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
.explorer-item:hover {
  background-color: #2a2d2e;
}
.explorer-item.is-selected {
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
