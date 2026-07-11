<script setup lang="ts">
import { useEditorStore, type UIElement } from "../../stores/editor.store";
import { ELEMENT_DEFINITIONS } from "../../types/element.types";

const props = defineProps<{
  element: UIElement;
  depth: number;
}>();

const editorStore = useEditorStore();
const icon = ELEMENT_DEFINITIONS[props.element.type]?.icon;
</script>

<template>
  <li
    class="explorer-item"
    :class="{ 'is-selected': editorStore.selectedElementId === element.id }"
    :style="{ paddingLeft: depth * 14 + 8 + 'px' }"
    @click.stop="editorStore.selectElement(element.id)"
  >
    <span class="rail" v-if="depth > 0"></span>
    <span class="icon"><component :is="icon" :size="14" /></span>
    <span class="name">{{ element.name }}</span>
  </li>

  <ExplorerItem
    v-for="child in element.children"
    :key="child.id"
    :element="child"
    :depth="depth + 1"
  />
</template>

<style scoped>
.explorer-item {
  position: relative;
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-soft);
  border-radius: var(--radius-sm);
}
.explorer-item:hover {
  background-color: var(--surface-2);
  color: var(--text);
}
.explorer-item.is-selected {
  background-color: var(--accent-soft);
  color: var(--text);
  box-shadow: inset 2px 0 0 var(--accent);
}
.icon {
  color: var(--text-faint);
  display: inline-flex;
}
.explorer-item.is-selected .icon,
.explorer-item:hover .icon {
  color: var(--accent);
}
.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
