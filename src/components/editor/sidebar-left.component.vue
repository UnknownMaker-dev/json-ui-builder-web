<script setup lang="ts">
import { t } from "../../i18n";
import { ref } from "vue";
import { Boxes, FolderTree, ImageUp, CornerLeftUp } from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";
import {
  ELEMENT_DEFINITIONS,
  isContainer,
  type UIElement,
  type UIElementType,
} from "../../types/element.types";
import { addCustomTexture } from "../../utils/presets";
import ExplorerItem from "./explorer-item.component.vue";

const editorStore = useEditorStore();

const tools = Object.values(ELEMENT_DEFINITIONS);

const isDisabled = (type: UIElementType) =>
  editorStore.elements.length === 0 && !isContainer(type);

const handleAddElement = (type: UIElementType) => {
  if (isDisabled(type)) {
    alert(t("left.needContainer"));
    return;
  }
  editorStore.addElement(type);
};

// --- SOLTAR NA RAIZ (tirar do container) ---
const rootOver = ref(false);
const onDropRoot = (event: DragEvent) => {
  rootOver.value = false;
  const dragId =
    event.dataTransfer?.getData("text/plain") || editorStore.draggingId;
  editorStore.draggingId = null;
  if (dragId) editorStore.moveElement(dragId, null, "inside");
};

// --- IMPORTAR IMAGEM DE FUNDO ---
const bgInput = ref<HTMLInputElement | null>(null);
const importing = ref(false);

const pickBackground = () => bgInput.value?.click();

/** Descobre o tamanho natural do PNG para o elemento nascer na proporção certa. */
const naturalSize = (url: string): Promise<[number, number]> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
    img.onerror = () => resolve([400, 300]);
    img.src = url;
  });

/**
 * Sobe a imagem, guarda como textura do usuário e cria um `image` no fundo da
 * tela (primeiro da lista = desenhado atrás dos outros).
 */
const onBackgroundFile = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  importing.value = true;
  try {
    const entry = await addCustomTexture(file, null);
    const [w, h] = await naturalSize(entry.url);

    // Cabe no canvas (800x600) sem perder a proporção original.
    const scale = Math.min(800 / w, 600 / h, 1);
    const width = Math.round(w * scale);
    const height = Math.round(h * scale);

    const element: UIElement = {
      id: crypto.randomUUID(),
      type: "image",
      name: entry.name || "Fundo",
      properties: {
        x: Math.round((800 - width) / 2),
        y: Math.round((600 - height) / 2),
        width,
        height,
        texture: entry.url,
      },
      children: [],
    };
    editorStore.addRootElement(element, true);
  } catch (err) {
    alert(t("left.imageFailed", { reason: String(err instanceof Error ? err.message : err) }));
  } finally {
    importing.value = false;
  }
};
</script>

<template>
  <aside class="sidebar-left">
    <div class="section">
      <h2><Boxes :size="14" /> {{ t("left.add") }}</h2>
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

      <button class="bg-btn" :disabled="importing" @click="pickBackground">
        <ImageUp :size="15" />
        {{ importing ? t("left.importing") : t("left.importBackground") }}
      </button>
      <input
        ref="bgInput"
        type="file"
        accept="image/png,image/jpeg"
        hidden
        @change="onBackgroundFile"
      />
    </div>

    <div class="section explorer-section">
      <h2><FolderTree :size="14" /> {{ t("left.explorer") }}</h2>
      <div v-if="editorStore.elements.length === 0" class="empty-explorer">
        {{ t("left.empty") }}
      </div>
      <ul class="explorer-tree" v-else>
        <ExplorerItem
          v-for="el in editorStore.elements"
          :key="el.id"
          :element="el"
          :depth="0"
        />
      </ul>

      <!-- Soltar aqui tira o elemento de qualquer container e leva para a raiz -->
      <div
        v-if="editorStore.draggingId"
        class="root-drop"
        :class="{ over: rootOver }"
        @dragover.prevent="rootOver = true"
        @dragleave="rootOver = false"
        @drop.prevent="onDropRoot"
      >
        <CornerLeftUp :size="14" />
        {{ t("left.dropToRoot") }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.root-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 8px;
  padding: 12px 10px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-faint);
  font-size: 11.5px;
  text-align: center;
}
.root-drop.over {
  border-color: var(--accent);
  border-style: solid;
  background: var(--accent-soft);
  color: var(--accent);
}
.bg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  margin-top: 9px;
  padding: 8px 10px;
  background: var(--accent-soft);
  border: 1px dashed var(--accent);
  color: var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
}
.bg-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}
.bg-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
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
