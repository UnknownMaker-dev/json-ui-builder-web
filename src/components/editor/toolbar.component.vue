<script setup lang="ts">
/**
 * Barra de ferramentas superior: nome do pacote, undo/redo, e as ações de
 * exportação (pacote pronto, JSON UI avulso, script) e importação.
 */
import { ref } from "vue";
import {
  Blocks,
  Undo2,
  Redo2,
  Braces,
  FileCode2,
  FolderOpen,
  BookOpen,
  Lock,
  Unlock,
  Package,
  Save,
} from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";
import { exportToJsonUiString } from "../../utils/json-ui-exporter";
import { importFromJsonUi } from "../../utils/json-ui-importer";
import { serverFormTemplate } from "../../utils/json-ui-templates";
import { generateScript } from "../../utils/scripter";
import { sanitizeFlag } from "../../types/screen.types";
import { serializeProject, parseProject } from "../../utils/project-file";
import OutputModal from "./output-modal.component.vue";
import PackModal from "./pack-modal.component.vue";
import Wiki from "./wiki.component.vue";

const editorStore = useEditorStore();
const showWiki = ref(false);
const showPack = ref(false);

const output = ref<{ title: string; content: string; filename: string } | null>(
  null,
);
const fileInput = ref<HTMLInputElement | null>(null);

const exportJsonUi = () => {
  const screen = editorStore.activeScreen;
  output.value = {
    title: `JSON UI — ${screen.name}`,
    content: exportToJsonUiString(screen.elements, {
      namespace: screen.namespace,
    }),
    filename: `${screen.namespace}.json`,
  };
};

const exportScript = (lang: "ts" | "js") => {
  output.value = {
    title: `Script (${lang.toUpperCase()})`,
    content: generateScript(editorStore.screens, lang, {
      triggerItem: editorStore.triggerItem,
    }),
    filename: `main.${lang}`,
  };
};

const exportServerForm = () => {
  const routes = editorStore.screens.map((s) => ({
    flag: sanitizeFlag(s.name),
    namespace: s.namespace,
  }));
  output.value = {
    title: "server_form.json",
    content: serverFormTemplate(routes),
    filename: "server_form.json",
  };
};

// --- PROJETO (.json com todas as telas) ---
const projectInput = ref<HTMLInputElement | null>(null);

const saveProject = () => {
  const blob = new Blob([serializeProject(editorStore.snapshotProject())], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${editorStore.packName.replace(/\s+/g, "-").toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const openProject = () => projectInput.value?.click();

const onProjectFile = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const result = parseProject(await file.text());
  if (!result.ok || !result.project) {
    alert("Não consegui abrir o projeto: " + (result.error ?? "desconhecido"));
    return;
  }
  editorStore.loadProject(result.project);
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
      <label>pacote</label>
      <input
        v-model="editorStore.packName"
        class="ns-input"
        spellcheck="false"
        title="Nome do resource pack gerado"
      />
    </div>

    <div class="icon-group">
      <button class="icon-btn" @click="editorStore.undo()" title="Desfazer (Ctrl+Z)">
        <Undo2 :size="17" />
      </button>
      <button class="icon-btn" @click="editorStore.redo()" title="Refazer (Ctrl+Y)">
        <Redo2 :size="17" />
      </button>
      <button
        class="icon-btn"
        :class="{ on: editorStore.aspectLocked }"
        @click="editorStore.toggleAspectLock()"
        title="Manter proporção ao redimensionar (ou segure SHIFT)"
      >
        <component :is="editorStore.aspectLocked ? Lock : Unlock" :size="16" />
      </button>
    </div>

    <div class="spacer"></div>

    <button class="btn btn-ghost wiki-btn" @click="showWiki = true">
      <BookOpen :size="16" /> Wiki
    </button>

    <div class="actions">
      <button class="btn btn-primary" @click="showPack = true">
        <Package :size="16" /> Baixar pacote
      </button>
      <button class="btn btn-ghost" @click="exportJsonUi">
        <Braces :size="16" /> JSON UI
      </button>
      <div class="seg">
        <button class="btn btn-ghost seg-item" @click="exportScript('ts')">TS</button>
        <button class="btn btn-ghost seg-item" @click="exportScript('js')">JS</button>
      </div>
      <button class="btn btn-ghost" @click="exportServerForm">
        <FileCode2 :size="16" /> server_form
      </button>
      <button class="btn btn-ghost" @click="openProject">
        <FolderOpen :size="16" /> Abrir projeto
      </button>
      <button class="btn btn-ghost" @click="saveProject">
        <Save :size="16" /> Salvar
      </button>
      <button
        class="btn btn-ghost"
        @click="triggerImport"
        title="Importar um arquivo JSON UI do Minecraft para a tela ativa"
      >
        <FileCode2 :size="16" /> Importar JSON UI
      </button>
    </div>

    <input ref="fileInput" type="file" accept=".json" hidden @change="onImportFile" />
    <input ref="projectInput" type="file" accept=".json" hidden @change="onProjectFile" />

    <OutputModal
      v-if="output"
      :title="output.title"
      :content="output.content"
      :filename="output.filename"
      @close="output = null"
    />

    <PackModal v-if="showPack" @close="showPack = false" />

    <Wiki v-if="showWiki" @close="showWiki = false" />
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
.icon-btn.on {
  background: var(--accent);
  color: #fff;
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

/* Mobile: toolbar compacta e rolável na horizontal */
@media (max-width: 860px) {
  .toolbar {
    height: 50px;
    gap: 8px;
    padding: 0 10px;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .toolbar::-webkit-scrollbar {
    display: none;
  }
  .brand-name,
  .divider,
  .ns-field label {
    display: none;
  }
  .ns-input {
    width: 96px;
  }
  .brand,
  .ns-field,
  .icon-group,
  .actions,
  .wiki-btn {
    flex-shrink: 0;
  }
  .spacer {
    display: none;
  }
  .btn {
    padding: 7px 10px;
  }
}
.wiki-btn {
  color: var(--accent);
}
.wiki-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
</style>
