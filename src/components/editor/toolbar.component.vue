<script setup lang="ts">
/**
 * Barra de ferramentas superior: namespace do projeto, undo/redo, e as ações
 * de exportação (JSON UI, scripts TS/JS, server_form) e importação.
 */
import { ref } from "vue";
import { useEditorStore } from "../../stores/editor.store";
import { exportToJsonUiString } from "../../utils/json-ui-exporter";
import { importFromJsonUi } from "../../utils/json-ui-importer";
import { generateScript, generateServerForm } from "../../utils/scripter";
import OutputModal from "./output-modal.component.vue";

const editorStore = useEditorStore();

const output = ref<{ title: string; content: string; filename: string } | null>(
  null,
);
const fileInput = ref<HTMLInputElement | null>(null);

const exportJsonUi = () => {
  const content = exportToJsonUiString(editorStore.elements, {
    namespace: editorStore.projectNamespace,
  });
  output.value = {
    title: "JSON UI",
    content,
    filename: `${editorStore.projectNamespace}.json`,
  };
};

const exportScript = (lang: "ts" | "js") => {
  const content = generateScript(editorStore.elements, lang);
  output.value = {
    title: `Script (${lang.toUpperCase()})`,
    content,
    filename: `main.${lang}`,
  };
};

const exportServerForm = () => {
  const content = generateServerForm(editorStore.projectNamespace);
  output.value = {
    title: "server_form.json",
    content,
    filename: "server_form.json",
  };
};

const triggerImport = () => fileInput.value?.click();

const onImportFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const result = importFromJsonUi(text);
  if (result.ok && result.elements) {
    editorStore.setElements(result.elements);
  } else {
    alert("Falha ao importar: " + (result.error ?? "desconhecido"));
  }
  (e.target as HTMLInputElement).value = "";
};
</script>

<template>
  <header class="toolbar">
    <div class="brand">🎨 JSON UI Builder</div>

    <div class="group">
      <label>Namespace</label>
      <input
        v-model="editorStore.projectNamespace"
        class="ns-input"
        spellcheck="false"
      />
    </div>

    <div class="group">
      <button @click="editorStore.undo()" title="Desfazer (Ctrl+Z)">↩</button>
      <button @click="editorStore.redo()" title="Refazer (Ctrl+Y)">↪</button>
    </div>

    <div class="spacer"></div>

    <div class="group">
      <button class="primary" @click="exportJsonUi">⧉ Gerar JSON UI</button>
      <button @click="exportScript('ts')">TS</button>
      <button @click="exportScript('js')">JS</button>
      <button @click="exportServerForm">server_form</button>
      <button @click="triggerImport">📂 Importar</button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      hidden
      @change="onImportFile"
    />

    <OutputModal
      v-if="output"
      :title="output.title"
      :content="output.content"
      :filename="output.filename"
      @close="output = null"
    />
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 48px;
  padding: 0 1rem;
  background: #333333;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}
.brand {
  font-weight: bold;
  font-size: 0.95rem;
  color: #fff;
}
.group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.group label {
  font-size: 0.75rem;
  color: #aaa;
}
.ns-input {
  background: #3c3c3c;
  border: 1px solid #555;
  color: #fff;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
  width: 140px;
}
.spacer {
  flex: 1;
}
button {
  background: #444;
  color: #fff;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.82rem;
}
button:hover {
  background: #094771;
}
button.primary {
  background: #0e639c;
  font-weight: bold;
}
button.primary:hover {
  background: #1177bb;
}
</style>
