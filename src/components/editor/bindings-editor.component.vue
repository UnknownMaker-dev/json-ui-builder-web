<script setup lang="ts">
/**
 * Editor de bindings do elemento selecionado. Bindings ligam propriedades do
 * elemento a valores dinâmicos do Minecraft (ver docs de JSON UI). Cada binding
 * é adicionado/removido/editado e salvo no array `properties.bindings`.
 */
import { computed } from "vue";
import { useEditorStore } from "../../stores/editor.store";
import type { UIBinding } from "../../types/element.types";

const editorStore = useEditorStore();

const bindings = computed<UIBinding[]>({
  get() {
    const el = editorStore.selectedElement;
    if (!el) return [];
    if (!el.properties.bindings) el.properties.bindings = [];
    return el.properties.bindings;
  },
  set(v) {
    if (editorStore.selectedElement) editorStore.selectedElement.properties.bindings = v;
  },
});

const addBinding = () => {
  bindings.value.push({ binding_type: "view", binding_name: "" });
  editorStore.saveSnapshot();
};
const removeBinding = (i: number) => {
  bindings.value.splice(i, 1);
  editorStore.saveSnapshot();
};
</script>

<template>
  <div class="bindings">
    <div class="head">
      <label>Bindings</label>
      <button class="add" @click="addBinding">+ Adicionar</button>
    </div>

    <div v-if="!bindings.length" class="empty">Sem bindings.</div>

    <div v-for="(b, i) in bindings" :key="i" class="binding-card">
      <div class="row">
        <select v-model="b.binding_type" @change="editorStore.saveSnapshot()">
          <option value="view">view</option>
          <option value="global">global</option>
          <option value="collection">collection</option>
          <option value="collection_details">collection_details</option>
          <option value="none">none</option>
        </select>
        <button class="del" @click="removeBinding(i)">🗑</button>
      </div>
      <input
        v-model="b.binding_name"
        placeholder="binding_name (ex: #text)"
        @change="editorStore.saveSnapshot()"
      />
      <input
        v-model="b.binding_name_override"
        placeholder="binding_name_override"
        @change="editorStore.saveSnapshot()"
      />
      <input
        v-model="b.binding_collection_name"
        placeholder="binding_collection_name"
        @change="editorStore.saveSnapshot()"
      />
      <input
        v-model="b.source_property_name"
        placeholder="source_property_name"
        @change="editorStore.saveSnapshot()"
      />
      <input
        v-model="b.target_property_name"
        placeholder="target_property_name"
        @change="editorStore.saveSnapshot()"
      />
    </div>
  </div>
</template>

<style scoped>
.bindings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
label {
  font-size: 0.8rem;
  color: #aaa;
}
.add {
  background: #0e639c;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
}
.empty {
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
}
.binding-card {
  background: #2d2d2d;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.row {
  display: flex;
  gap: 0.35rem;
}
select,
input {
  background: #3c3c3c;
  border: 1px solid #555;
  color: #fff;
  padding: 0.3rem;
  border-radius: 3px;
  font-size: 0.8rem;
  width: 100%;
}
.del {
  background: #a12626;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  padding: 0 0.5rem;
}
</style>
