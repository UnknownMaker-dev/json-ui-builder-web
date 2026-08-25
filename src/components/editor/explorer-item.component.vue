<script setup lang="ts">
/**
 * Uma linha do Explorer, arrastável.
 *
 * Cada linha tem três zonas de soltura: o quarto de cima insere ANTES, o de
 * baixo insere DEPOIS, e o miolo joga para DENTRO (só em container). Para tirar
 * um elemento do escopo basta soltar na área livre embaixo da árvore, que a
 * barra lateral trata como raiz.
 */
import { ref, computed } from "vue";
import { useEditorStore, type UIElement } from "../../stores/editor.store";
import { ELEMENT_DEFINITIONS, isContainer } from "../../types/element.types";

// Necessário para a auto-referência recursiva (<ExplorerItem>) resolver:
// o nome inferido do arquivo não corresponde, então declaramos explicitamente.
defineOptions({ name: "ExplorerItem" });

const props = defineProps<{
  element: UIElement;
  depth: number;
}>();

const editorStore = useEditorStore();
const icon = ELEMENT_DEFINITIONS[props.element.type]?.icon;

type Zone = "before" | "inside" | "after";
const hoverZone = ref<Zone | null>(null);
const invalid = ref(false);
const dragging = ref(false);

const podeReceberDentro = computed(() => isContainer(props.element.type));

const onDragStart = (event: DragEvent) => {
  dragging.value = true;
  editorStore.draggingId = props.element.id;
  event.dataTransfer?.setData("text/plain", props.element.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  editorStore.selectElement(props.element.id);
};

const onDragEnd = () => {
  dragging.value = false;
  editorStore.draggingId = null;
  hoverZone.value = null;
  invalid.value = false;
};

/** Decide a zona pela altura do cursor dentro da linha. */
const zoneFor = (event: DragEvent, el: HTMLElement): Zone => {
  const r = el.getBoundingClientRect();
  const y = (event.clientY - r.top) / r.height;
  if (!podeReceberDentro.value) return y < 0.5 ? "before" : "after";
  if (y < 0.28) return "before";
  if (y > 0.72) return "after";
  return "inside";
};

const onDragOver = (event: DragEvent) => {
  const dragId = editorStore.draggingId;
  if (!dragId) return;
  const zone = zoneFor(event, event.currentTarget as HTMLElement);
  const check = editorStore.canMove(dragId, props.element.id, zone);
  hoverZone.value = zone;
  invalid.value = !check.ok;
  if (check.ok) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }
};

const onDragLeave = () => {
  hoverZone.value = null;
  invalid.value = false;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const dragId = event.dataTransfer?.getData("text/plain") || editorStore.draggingId;
  const zone = hoverZone.value ?? "inside";
  hoverZone.value = null;
  invalid.value = false;
  editorStore.draggingId = null;
  if (dragId) editorStore.moveElement(dragId, props.element.id, zone);
};
</script>

<template>
  <li
    class="explorer-item"
    :class="{
      'is-selected': editorStore.selectedElementId === element.id,
      'is-dragging': dragging,
      'drop-before': hoverZone === 'before' && !invalid,
      'drop-after': hoverZone === 'after' && !invalid,
      'drop-inside': hoverZone === 'inside' && !invalid,
      'drop-invalid': !!hoverZone && invalid,
    }"
    :style="{ paddingLeft: depth * 14 + 8 + 'px' }"
    draggable="true"
    @click.stop="editorStore.selectElement(element.id)"
    @dragstart.stop="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <span class="rail" v-if="depth > 0"></span>
    <span class="icon"><component :is="icon" :size="14" /></span>
    <span class="name">{{ element.name }}</span>
    <span v-if="podeReceberDentro && element.children.length" class="count">
      {{ element.children.length }}
    </span>
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
.explorer-item.is-dragging {
  opacity: 0.45;
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
.count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  background: var(--surface-3);
  padding: 1px 5px;
  border-radius: 20px;
}

/* Marcas de destino */
.explorer-item.drop-before::before,
.explorer-item.drop-after::after {
  content: "";
  position: absolute;
  left: 4px;
  right: 4px;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
}
.explorer-item.drop-before::before {
  top: -1px;
}
.explorer-item.drop-after::after {
  bottom: -1px;
}
.explorer-item.drop-inside {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent);
  color: var(--text);
}
.explorer-item.drop-invalid {
  background: rgba(239, 68, 68, 0.12);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.5);
  cursor: no-drop;
}
</style>
