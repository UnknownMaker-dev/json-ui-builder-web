<script setup lang="ts">
import { ref, computed } from "vue";
import {
  SlidersHorizontal,
  Trash2,
  ChevronRight,
  ChevronDown,
  ImagePlus,
  MousePointer2,
} from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";
import { MINECRAFT_FONTS } from "../../config/export.config";
import { ELEMENT_DEFINITIONS } from "../../types/element.types";
import TexturePicker from "./texture-picker.component.vue";
import BindingsEditor from "./bindings-editor.component.vue";

const editorStore = useEditorStore();
const el = computed(() => editorStore.selectedElement);
const typeIcon = computed(() =>
  el.value ? ELEMENT_DEFINITIONS[el.value.type]?.icon : null,
);

const save = () => editorStore.saveSnapshot();
const handleDelete = () => {
  if (editorStore.selectedElementId)
    editorStore.deleteElement(editorStore.selectedElementId);
};

const pickerField = ref<string | null>(null);
const openPicker = (field: string) => (pickerField.value = field);
const onPick = (url: string) => {
  if (el.value && pickerField.value) {
    el.value.properties[pickerField.value] = url;
    save();
  }
};

const isTextType = computed(
  () => el.value?.type === "label" || el.value?.type === "button",
);
const hasTexture = computed(
  () => el.value?.type === "panel" || el.value?.type === "image",
);
const showBindings = ref(false);

const stateLabels: Record<string, string> = {
  defaultTexture: "Default",
  hoverTexture: "Hover",
  pressedTexture: "Pressed",
};
</script>

<template>
  <aside class="sidebar-right">
    <h2><SlidersHorizontal :size="14" /> Propriedades</h2>

    <div v-if="el" class="properties-panel">
      <div class="type-chip">
        <component :is="typeIcon" :size="15" />
        <span>{{ ELEMENT_DEFINITIONS[el.type].label }}</span>
        <code>{{ el.id.slice(0, 8) }}</code>
      </div>

      <div class="field">
        <label>Nome (Explorer)</label>
        <input type="text" v-model="el.name" @change="save" />
      </div>

      <div class="field" v-if="el.properties.text !== undefined">
        <label>Texto</label>
        <input type="text" v-model="el.properties.text" @change="save" />
      </div>

      <template v-if="isTextType">
        <div class="row">
          <div class="field">
            <label>Fonte</label>
            <select v-model="el.properties.fontType" @change="save">
              <option v-for="f in MINECRAFT_FONTS" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="field small">
            <label>Tamanho</label>
            <input type="number" step="0.1" v-model.number="el.properties.fontSize" @change="save" />
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Alinhamento</label>
            <select v-model="el.properties.textAlignment" @change="save">
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="el.properties.shadow" @change="save" />
            <span>Sombra</span>
          </label>
        </div>
      </template>

      <div class="field" v-if="el.type === 'stackPanel'">
        <label>Orientação</label>
        <select v-model="el.properties.orientation" @change="save">
          <option value="vertical">vertical</option>
          <option value="horizontal">horizontal</option>
        </select>
      </div>

      <div class="field" v-if="el.type === 'collectionPanel'">
        <label>Collection Name</label>
        <input type="text" v-model="el.properties.collectionName" @change="save" />
      </div>

      <!-- Textura única -->
      <div class="field" v-if="hasTexture">
        <label>Textura</label>
        <button class="tex-slot" @click="openPicker('texture')">
          <img v-if="el.properties.texture" :src="el.properties.texture" />
          <span v-else class="tex-empty"><ImagePlus :size="18" /> escolher</span>
        </button>
      </div>

      <!-- Texturas de estado (button) -->
      <template v-if="el.type === 'button'">
        <div class="tex-states">
          <div
            class="tex-state"
            v-for="s in ['defaultTexture', 'hoverTexture', 'pressedTexture']"
            :key="s"
          >
            <button class="tex-slot square" @click="openPicker(s)">
              <img v-if="el.properties[s]" :src="el.properties[s]" />
              <span v-else class="tex-empty"><ImagePlus :size="16" /></span>
            </button>
            <span class="tex-state-label">{{ stateLabels[s] }}</span>
          </div>
        </div>
      </template>

      <div class="field" v-if="hasTexture || el.type === 'button'">
        <label>NineSlice (px)</label>
        <input type="number" v-model.number="el.properties.nineslice" @change="save" />
      </div>

      <div class="group">
        <span class="group-title">Posição & Tamanho</span>
        <div class="row">
          <div class="field small"><label>X</label><input type="number" v-model.number="el.properties.x" @change="save" /></div>
          <div class="field small"><label>Y</label><input type="number" v-model.number="el.properties.y" @change="save" /></div>
        </div>
        <div class="row">
          <div class="field small"><label>Largura</label><input type="number" v-model.number="el.properties.width" @change="save" /></div>
          <div class="field small"><label>Altura</label><input type="number" v-model.number="el.properties.height" @change="save" /></div>
        </div>
      </div>

      <button class="collapse-btn" @click="showBindings = !showBindings">
        <component :is="showBindings ? ChevronDown : ChevronRight" :size="15" />
        Bindings
        <span class="count">{{ el.properties.bindings?.length || 0 }}</span>
      </button>
      <BindingsEditor v-if="showBindings" />

      <button class="btn-delete" @click="handleDelete">
        <Trash2 :size="15" /> Deletar Elemento
      </button>
    </div>

    <div v-else class="no-selection">
      <MousePointer2 :size="26" />
      <p>Selecione um elemento no canvas ou no Explorer.</p>
    </div>

    <TexturePicker
      v-if="pickerField"
      :model-value="el?.properties[pickerField]"
      @update:model-value="onPick"
      @close="pickerField = null"
    />
  </aside>
</template>

<style scoped>
.sidebar-right {
  width: 308px;
  background-color: var(--surface);
  border-left: 1px solid var(--border);
  padding: 14px;
  overflow-y: auto;
}
h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--text-faint);
  font-weight: 600;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-soft);
}
h2 :deep(svg) {
  color: var(--accent);
}
.properties-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.type-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
}
.type-chip :deep(svg) {
  color: var(--accent);
}
.type-chip code {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}
.field.small {
  flex: 0 0 auto;
}
.row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
label {
  font-size: 11px;
  color: var(--text-soft);
  font-weight: 500;
}
input,
select {
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 7px 9px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: inherit;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--text-soft);
  cursor: pointer;
  padding-bottom: 7px;
  white-space: nowrap;
}
.toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}
.tex-slot {
  width: 100%;
  height: 56px;
  background: var(--surface-2);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
}
.tex-slot:hover {
  border-color: var(--accent);
  background: var(--surface-hover);
}
.tex-slot.square {
  height: 52px;
}
.tex-slot img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.tex-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-faint);
  font-size: 12px;
}
.tex-states {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.tex-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.tex-state-label {
  font-size: 10.5px;
  color: var(--text-faint);
  font-family: var(--font-mono);
}
.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
}
.group-title {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-faint);
  font-family: var(--font-mono);
}
.group .field input {
  background: var(--surface);
}
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  color: var(--text-soft);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  width: 100%;
}
.collapse-btn:hover {
  color: var(--text);
  background: var(--surface-hover);
}
.count {
  margin-left: auto;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  font-family: var(--font-mono);
}
.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-faint);
  text-align: center;
  margin-top: 40px;
  padding: 0 20px;
  font-size: 13px;
}
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 4px;
  background-color: var(--danger-soft);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: background 0.15s;
}
.btn-delete:hover {
  background-color: rgba(239, 68, 68, 0.22);
}
</style>
