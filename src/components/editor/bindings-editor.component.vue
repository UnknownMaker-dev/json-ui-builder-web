<script setup lang="ts">
/**
 * Editor de bindings do elemento selecionado. Bindings ligam propriedades do
 * elemento a valores dinâmicos do Minecraft (ver docs de JSON UI). Cada binding
 * é adicionado/removido/editado e salvo no array `properties.bindings`.
 */
import { computed } from "vue";
import { Plus, Trash2 } from "lucide-vue-next";
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
      <label>Bindings do elemento</label>
      <button class="add" @click="addBinding"><Plus :size="13" /> Adicionar</button>
    </div>

    <div v-if="!bindings.length" class="empty">Nenhum binding.</div>

    <div v-for="(b, i) in bindings" :key="i" class="binding-card">
      <div class="row">
        <select v-model="b.binding_type" @change="editorStore.saveSnapshot()">
          <option value="view">view</option>
          <option value="global">global</option>
          <option value="collection">collection</option>
          <option value="collection_details">collection_details</option>
          <option value="none">none</option>
        </select>
        <button class="del" @click="removeBinding(i)"><Trash2 :size="13" /></button>
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
  gap: 8px;
  padding: 4px 0 2px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
label {
  font-size: 11px;
  color: var(--text-soft);
  font-weight: 500;
}
.add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 9px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
}
.add:hover {
  background: rgba(99, 102, 241, 0.22);
}
.empty {
  color: var(--text-faint);
  font-size: 12px;
  font-style: italic;
}
.binding-card {
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: flex;
  gap: 6px;
}
select,
input {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  width: 100%;
}
select:focus,
input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.del {
  display: grid;
  place-items: center;
  background: var(--danger-soft);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0 8px;
}
.del:hover {
  background: rgba(239, 68, 68, 0.22);
}
</style>
