<script setup lang="ts">
/**
 * Barra de ferramentas superior: namespace do projeto, undo/redo, e as ações
 * de exportação (JSON UI, scripts TS/JS, server_form) e importação.
 */
import { ref } from "vue";
import {
  Blocks,
  Undo2,
  Redo2,
  Braces,
  FileCode2,
  FolderOpen,
} from "lucide-vue-next";
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
  output.value = {
    title: "JSON UI",
    content: exportToJsonUiString(editorStore.elements, {
      namespace: editorStore.projectNamespace,
    }),
    filename: `${editorStore.projectNamespace}.json`,
  };
};

const exportScript = (lang: "ts" | "js") => {
  output.value = {
    title: `Script (${lang.toUpperCase()})`,
    content: generateScript(editorStore.elements, lang),
    filename: `main.${lang}`,
  };
};

const exportServerForm = () => {
  output.value = {
    title: "server_form.json",
    content: generateServerForm(editorStore.projectNamespace),
    filename: "server_form.json",
  };
};

const triggerImport = () => fileInput.value?.click();

const onImportFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const result = importFromJsonUi(await file.text());
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
    <div class="brand">
      <span class="brand-mark"><Blocks :size="18" /></span>
      <span class="brand-name">JSON UI <b>Builder</b></span>
    </div>

    <div class="divider"></div>

    <div class="ns-field">
      <label>namespace</label>
      <input
        v-model="editorStore.projectNamespace"
        class="ns-input"
        spellcheck="false"
      />
    </div>

    <div class="icon-group">
      <button class="icon-btn" @click="editorStore.undo()" title="Desfazer (Ctrl+Z)">
        <Undo2 :size="17" />
      </button>
      <button class="icon-btn" @click="editorStore.redo()" title="Refazer (Ctrl+Y)">
        <Redo2 :size="17" />
      </button>
    </div>

    <div class="spacer"></div>

    <div class="actions">
      <button class="btn btn-primary" @click="exportJsonUi">
        <Braces :size="16" /> Gerar JSON UI
      </button>
      <div class="seg">
        <button class="btn btn-ghost seg-item" @click="exportScript('ts')">TS</button>
        <button class="btn btn-ghost seg-item" @click="exportScript('js')">JS</button>
      </div>
      <button class="btn btn-ghost" @click="exportServerForm">
        <FileCode2 :size="16" /> server_form
      </button>
      <button class="btn btn-ghost" @click="triggerImport">
        <FolderOpen :size="16" /> Importar
      </button>
    </div>

    <input ref="fileInput" type="file" accept=".json" hidden @change="onImportFile" />

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
  gap: 0.85rem;
  height: 54px;
  padding: 0 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-sm);
}
.brand-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-soft);
  letter-spacing: -0.01em;
}
.brand-name b {
  color: var(--text);
  font-weight: 700;
}
.divider {
  width: 1px;
  height: 26px;
  background: var(--border);
}
.ns-field {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ns-field label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  padding-left: 2px;
}
.ns-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 9px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-mono);
  width: 150px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ns-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.icon-group {
  display: flex;
  gap: 3px;
  background: var(--surface-2);
  padding: 3px;
  border-radius: var(--radius);
  border: 1px solid var(--border-soft);
}
.icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: var(--text-soft);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.spacer {
  flex: 1;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s, transform 0.05s;
}
.btn:active {
  transform: translateY(1px);
}
.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover {
  background: var(--accent-hover);
}
.btn-ghost {
  background: var(--surface-2);
  color: var(--text-soft);
  border-color: var(--border);
}
.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.seg {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg-item {
  border: none;
  border-radius: 0;
  padding: 7px 11px;
  font-family: var(--font-mono);
  font-size: 12px;
}
.seg-item + .seg-item {
  border-left: 1px solid var(--border);
}
</style>
