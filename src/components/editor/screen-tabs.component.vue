<script setup lang="ts">
/**
 * Barra de abas: uma aba por tela do projeto.
 *
 * O nome da aba não é decoração — é o identificador que o script manda no
 * título do formulário e que o `server_form.json` usa para escolher qual tela
 * mostrar. Por isso ele aparece em destaque e é editável com duplo clique.
 */
import { ref, nextTick } from "vue";
import { Plus, X, Copy, AlertTriangle } from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";

const editorStore = useEditorStore();

const editingId = ref<string | null>(null);
const draft = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const startRename = async (id: string, current: string) => {
  editingId.value = id;
  draft.value = current;
  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select();
};

const commitRename = () => {
  if (editingId.value) editorStore.renameScreen(editingId.value, draft.value);
  editingId.value = null;
};

const cancelRename = () => {
  editingId.value = null;
};

const close = (id: string) => {
  if (editorStore.screens.length <= 1) return;
  const screen = editorStore.screens.find((s) => s.id === id);
  const hasWork = screen && screen.elements.length > 0;
  if (hasWork && !confirm(`Apagar a tela "${screen!.name}" e tudo nela?`)) return;
  editorStore.removeScreen(id);
};
</script>

<template>
  <div class="tabs-bar">
    <div class="tabs">
      <div
        v-for="screen in editorStore.screens"
        :key="screen.id"
        class="tab"
        :class="{ active: screen.id === editorStore.activeScreenId }"
        @click="editorStore.selectScreen(screen.id)"
        @dblclick="startRename(screen.id, screen.name)"
      >
        <input
          v-if="editingId === screen.id"
          ref="inputRef"
          v-model="draft"
          class="tab-input"
          spellcheck="false"
          @blur="commitRename"
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="cancelRename"
          @click.stop
        />
        <template v-else>
          <span class="tab-name" :title="`Duplo clique para renomear`">{{
            screen.name
          }}</span>
          <span class="tab-count">{{ screen.elements.length }}</span>
          <button
            class="tab-action"
            title="Duplicar tela"
            @click.stop="editorStore.duplicateScreen(screen.id)"
          >
            <Copy :size="12" />
          </button>
          <button
            v-if="editorStore.screens.length > 1"
            class="tab-action"
            title="Fechar tela"
            @click.stop="close(screen.id)"
          >
            <X :size="13" />
          </button>
        </template>
      </div>

      <button class="tab-add" title="Nova tela" @click="editorStore.addScreen()">
        <Plus :size="15" /> Nova tela
      </button>
    </div>

    <div v-if="editorStore.screenNameConflicts.length" class="conflict">
      <AlertTriangle :size="14" />
      <span>
        O nome <b>{{ editorStore.screenNameConflicts[0].a }}</b> está contido em
        <b>{{ editorStore.screenNameConflicts[0].b }}</b> — no jogo as duas telas
        abririam juntas. Renomeie uma delas.
      </span>
    </div>
  </div>
</template>

<style scoped>
.tabs-bar {
  flex-shrink: 0;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.tabs {
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 5px 10px 0;
  overflow-x: auto;
  scrollbar-width: thin;
}
.tabs::-webkit-scrollbar {
  height: 4px;
}
.tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-faint);
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}
.tab:hover {
  background: var(--surface-hover);
  color: var(--text-soft);
}
.tab.active {
  background: var(--bg);
  border-color: var(--border);
  color: var(--text);
  font-weight: 500;
}
.tab-name {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-count {
  font-family: var(--font-mono);
  font-size: 10.5px;
  background: var(--surface-3);
  color: var(--text-faint);
  padding: 1px 5px;
  border-radius: 20px;
}
.tab.active .tab-count {
  background: var(--accent-soft);
  color: var(--accent);
}
.tab-action {
  display: grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border: none;
  background: transparent;
  color: var(--text-faint);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}
.tab:hover .tab-action,
.tab.active .tab-action {
  opacity: 1;
}
.tab-action:hover {
  background: var(--surface-3);
  color: var(--text);
}
.tab-input {
  background: var(--surface);
  border: 1px solid var(--accent);
  color: var(--text);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  font-family: inherit;
  width: 170px;
  outline: none;
}
.tab-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 4px;
  padding: 6px 11px;
  background: transparent;
  border: 1px dashed var(--border);
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: var(--text-faint);
  cursor: pointer;
  font-size: 12.5px;
  font-family: inherit;
  white-space: nowrap;
}
.tab-add:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
.conflict {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: rgba(234, 179, 8, 0.1);
  border-top: 1px solid rgba(234, 179, 8, 0.25);
  color: #eab308;
  font-size: 12px;
}
.conflict b {
  color: #fde047;
}

@media (max-width: 860px) {
  .tab-name {
    max-width: 110px;
  }
  .tab-add span {
    display: none;
  }
}
</style>
