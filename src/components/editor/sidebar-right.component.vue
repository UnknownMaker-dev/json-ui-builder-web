<script setup lang="ts">
import { ref, computed } from "vue";
import { useEditorStore } from "../../stores/editor.store";
import { MINECRAFT_FONTS } from "../../config/export.config";
import TexturePicker from "./texture-picker.component.vue";
import BindingsEditor from "./bindings-editor.component.vue";

const editorStore = useEditorStore();
const el = computed(() => editorStore.selectedElement);

const save = () => editorStore.saveSnapshot();
const handleDelete = () => {
  if (editorStore.selectedElementId)
    editorStore.deleteElement(editorStore.selectedElementId);
};

// Seletor de textura: guarda qual propriedade está sendo editada.
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
</script>

<template>
  <aside class="sidebar-right">
    <h2>Propriedades</h2>

    <div v-if="el" class="properties-panel">
      <div class="property-group">
        <label>Nome (Explorer)</label>
        <input type="text" v-model="el.name" @change="save" />
      </div>

      <div class="property-row">
        <div class="property-group">
          <label>Tipo</label>
          <input :value="el.type" disabled class="disabled-input" />
        </div>
        <div class="property-group">
          <label>ID</label>
          <input :value="el.id.slice(0, 8)" disabled class="disabled-input" />
        </div>
      </div>

      <!-- Texto -->
      <div class="property-group" v-if="el.properties.text !== undefined">
        <label>Texto</label>
        <input type="text" v-model="el.properties.text" @change="save" />
      </div>

      <!-- Fonte (label / button) -->
      <template v-if="isTextType">
        <div class="property-row">
          <div class="property-group">
            <label>Fonte</label>
            <select v-model="el.properties.fontType" @change="save">
              <option v-for="f in MINECRAFT_FONTS" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="property-group">
            <label>Tam. Fonte</label>
            <input type="number" step="0.1" v-model.number="el.properties.fontSize" @change="save" />
          </div>
        </div>
        <div class="property-row">
          <div class="property-group">
            <label>Alinhamento</label>
            <select v-model="el.properties.textAlignment" @change="save">
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>
          <div class="property-group checkbox">
            <label>Sombra</label>
            <input type="checkbox" v-model="el.properties.shadow" @change="save" />
          </div>
        </div>
      </template>

      <!-- Orientation (stack panel) -->
      <div class="property-group" v-if="el.type === 'stackPanel'">
        <label>Orientação</label>
        <select v-model="el.properties.orientation" @change="save">
          <option value="vertical">vertical</option>
          <option value="horizontal">horizontal</option>
        </select>
      </div>

      <!-- Collection name -->
      <div class="property-group" v-if="el.type === 'collectionPanel'">
        <label>Collection Name</label>
        <input type="text" v-model="el.properties.collectionName" @change="save" />
      </div>

      <!-- Textura única (panel / image) -->
      <div class="property-group" v-if="hasTexture">
        <label>Textura</label>
        <div class="tex-field">
          <div class="tex-preview" @click="openPicker('texture')">
            <img v-if="el.properties.texture" :src="el.properties.texture" />
            <span v-else>escolher</span>
          </div>
          <input type="text" v-model="el.properties.texture" @change="save" placeholder="/presets/..." />
        </div>
      </div>

      <!-- Texturas de estado (button) -->
      <template v-if="el.type === 'button'">
        <div class="property-group" v-for="s in ['defaultTexture', 'hoverTexture', 'pressedTexture']" :key="s">
          <label>{{ s.replace('Texture', '') }}</label>
          <div class="tex-field">
            <div class="tex-preview" @click="openPicker(s)">
              <img v-if="el.properties[s]" :src="el.properties[s]" />
              <span v-else>escolher</span>
            </div>
            <input type="text" v-model="el.properties[s]" @change="save" />
          </div>
        </div>
      </template>

      <!-- NineSlice -->
      <div class="property-group" v-if="hasTexture || el.type === 'button'">
        <label>NineSlice (px)</label>
        <input type="number" v-model.number="el.properties.nineslice" @change="save" />
      </div>

      <!-- Posição / tamanho -->
      <div class="property-row">
        <div class="property-group">
          <label>X</label>
          <input type="number" v-model.number="el.properties.x" @change="save" />
        </div>
        <div class="property-group">
          <label>Y</label>
          <input type="number" v-model.number="el.properties.y" @change="save" />
        </div>
      </div>
      <div class="property-row">
        <div class="property-group">
          <label>Largura</label>
          <input type="number" v-model.number="el.properties.width" @change="save" />
        </div>
        <div class="property-group">
          <label>Altura</label>
          <input type="number" v-model.number="el.properties.height" @change="save" />
        </div>
      </div>

      <!-- Bindings -->
      <div class="collapsible">
        <button class="collapse-btn" @click="showBindings = !showBindings">
          {{ showBindings ? "▼" : "▶" }} Bindings ({{ el.properties.bindings?.length || 0 }})
        </button>
        <BindingsEditor v-if="showBindings" />
      </div>

      <button class="btn-delete" @click="handleDelete">🗑️ Deletar Elemento</button>
    </div>

    <div v-else class="no-selection">
      <p>Nenhum elemento selecionado.</p>
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
  gap: 0.85rem;
}
.property-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.property-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.property-group.checkbox input {
  width: auto;
}
.property-row {
  display: flex;
  gap: 0.5rem;
}
label {
  font-size: 0.8rem;
  color: #aaaaaa;
}
input,
select {
  background-color: #3c3c3c;
  border: 1px solid #555;
  color: #fff;
  padding: 0.4rem;
  border-radius: 3px;
  font-size: 0.9rem;
  width: 100%;
}
input:focus,
select:focus {
  outline: none;
  border-color: #007acc;
}
.disabled-input {
  background-color: #2d2d2d;
  color: #777;
}
.tex-field {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.tex-preview {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: #1e1e1e;
  border: 1px solid #555;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.6rem;
  color: #888;
}
.tex-preview img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.collapsible {
  border-top: 1px solid #3e3e42;
  padding-top: 0.5rem;
}
.collapse-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0;
  width: 100%;
  text-align: left;
}
.no-selection {
  color: #666;
  text-align: center;
  margin-top: 2rem;
}
.btn-delete {
  margin-top: 0.5rem;
  background-color: #a12626;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-weight: bold;
}
.btn-delete:hover {
  background-color: #c53030;
}
</style>
