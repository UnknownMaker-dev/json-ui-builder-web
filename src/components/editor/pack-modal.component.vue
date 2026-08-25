<script setup lang="ts">
/**
 * Modal de exportação do pacote: configurações, pré-visualização do script e
 * download do .mcaddon pronto para o Minecraft.
 */
import { ref, computed } from "vue";
import {
  X,
  Package,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  FileArchive,
} from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";
import { buildPack } from "../../utils/pack-builder";
import { generateScript } from "../../utils/scripter";

const emit = defineEmits<{ (e: "close"): void }>();
const editorStore = useEditorStore();

const building = ref(false);
const buildError = ref<string | null>(null);
const result = ref<{ files: string[]; warnings: string[] } | null>(null);
const copied = ref(false);

/** Itens comuns para abrir o menu (o campo aceita qualquer id). */
const COMMON_ITEMS = [
  "minecraft:stick",
  "minecraft:compass",
  "minecraft:clock",
  "minecraft:book",
  "minecraft:nether_star",
];

const scriptPreview = computed(() =>
  generateScript(editorStore.screens, "js", {
    triggerItem: editorStore.triggerItem,
  }),
);

const totalButtons = computed(() =>
  editorStore.screens.map((s) => {
    const count = (function walk(nodes: any[]): number {
      let n = 0;
      for (const el of nodes) {
        if (el.type === "button") n++;
        n += walk(el.children);
      }
      return n;
    })(s.elements);
    return { name: s.name, namespace: s.namespace, buttons: count, elements: s.elements.length };
  }),
);

const copyScript = async () => {
  await navigator.clipboard.writeText(scriptPreview.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
};

const download = async (extension: "mcaddon" | "zip") => {
  building.value = true;
  buildError.value = null;
  result.value = null;
  try {
    const built = await buildPack({
      screens: editorStore.screens,
      packName: editorStore.packName,
      triggerItem: editorStore.triggerItem,
      scriptApi: editorStore.scriptApi,
    });
    result.value = { files: built.files, warnings: built.warnings };

    const url = URL.createObjectURL(built.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = built.filename.replace(/\.mcaddon$/, `.${extension}`);
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    buildError.value = e instanceof Error ? e.message : String(e);
  } finally {
    building.value = false;
  }
};
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <header>
        <div class="title">
          <Package :size="17" />
          <h3>Exportar pacote</h3>
        </div>
        <button class="close" @click="emit('close')"><X :size="17" /></button>
      </header>

      <div class="body">
        <!-- Configurações -->
        <section class="panel">
          <h4>Pacote</h4>
          <div class="grid">
            <label class="field">
              <span>Nome do pacote</span>
              <input v-model="editorStore.packName" spellcheck="false" />
            </label>

            <label class="field">
              <span>Item que abre o menu</span>
              <input
                v-model="editorStore.triggerItem"
                list="trigger-items"
                spellcheck="false"
              />
              <datalist id="trigger-items">
                <option v-for="item in COMMON_ITEMS" :key="item" :value="item" />
              </datalist>
            </label>

            <label class="field">
              <span>Versão da API de script</span>
              <select v-model="editorStore.scriptApi">
                <option value="1.x">1.x — @minecraft/server 1.11.0</option>
                <option value="2.x">2.x — @minecraft/server 2.0.0</option>
              </select>
            </label>
          </div>
          <p class="hint">
            Se o script não carregar no jogo, a causa mais comum é a versão da
            API. Troque aqui e gere de novo.
          </p>
        </section>

        <!-- Telas -->
        <section class="panel">
          <h4>Telas ({{ editorStore.screens.length }})</h4>
          <div class="screens">
            <div v-for="s in totalButtons" :key="s.namespace" class="screen-row">
              <code class="flag">{{ s.name }}</code>
              <span class="meta">{{ s.elements }} elementos · {{ s.buttons }} botões</span>
              <code class="ns">{{ s.namespace }}.json</code>
            </div>
          </div>
          <div v-if="editorStore.screenNameConflicts.length" class="warn">
            <AlertTriangle :size="14" />
            <span>
              <b>{{ editorStore.screenNameConflicts[0].a }}</b> é trecho de
              <b>{{ editorStore.screenNameConflicts[0].b }}</b
              >. No jogo as duas telas apareceriam sobrepostas — renomeie antes
              de exportar.
            </span>
          </div>
        </section>

        <!-- Script -->
        <section class="panel">
          <div class="panel-head">
            <h4>scripts/main.js</h4>
            <button class="mini" :class="{ ok: copied }" @click="copyScript">
              <component :is="copied ? Check : Copy" :size="13" />
              {{ copied ? "Copiado" : "Copiar" }}
            </button>
          </div>
          <pre class="code"><code>{{ scriptPreview }}</code></pre>
        </section>

        <!-- Resultado -->
        <section v-if="result" class="panel">
          <h4>Gerado ({{ result.files.length }} arquivos)</h4>
          <div v-for="w in result.warnings" :key="w" class="warn">
            <AlertTriangle :size="14" /><span>{{ w }}</span>
          </div>
          <pre class="files"><code>{{ result.files.join("\n") }}</code></pre>
        </section>

        <div v-if="buildError" class="error">
          <AlertTriangle :size="15" /> Falha ao gerar o pacote: {{ buildError }}
        </div>
      </div>

      <footer>
        <p class="foot-hint">
          Dois cliques no <code>.mcaddon</code> instalam o resource pack e o
          behavior pack. Ative os dois no mundo e ligue as Beta APIs.
        </p>
        <div class="foot-actions">
          <button class="btn ghost" :disabled="building" @click="download('zip')">
            <FileArchive :size="15" /> .zip
          </button>
          <button class="btn primary" :disabled="building" @click="download('mcaddon')">
            <component :is="building ? Loader2 : Download" :size="15" :class="{ spin: building }" />
            {{ building ? "Gerando…" : "Baixar .mcaddon" }}
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 14, 0.66);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: 860px;
  max-width: 95vw;
  height: 88vh;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface-2);
}
.title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--accent);
}
h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text);
}
.close {
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-soft);
  padding: 5px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.close:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.panel {
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 13px 14px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h4 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-faint);
  font-family: var(--font-mono);
}
.panel-head h4 {
  margin-bottom: 10px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 11px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field span {
  font-size: 11.5px;
  color: var(--text-faint);
}
.field input,
.field select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 9px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-mono);
  width: 100%;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.hint {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--text-faint);
  line-height: 1.5;
}
.screens {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.screen-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
}
.flag {
  font-family: var(--font-mono);
  color: var(--accent);
  background: var(--accent-soft);
  padding: 2px 7px;
  border-radius: 4px;
}
.meta {
  color: var(--text-faint);
  font-size: 11.5px;
}
.ns {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
}
.warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 9px;
  padding: 8px 10px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: var(--radius-sm);
  color: #eab308;
  font-size: 12px;
  line-height: 1.5;
}
.warn b {
  color: #fde047;
}
.error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: #f87171;
  font-size: 12.5px;
}
.code,
.files {
  margin: 0;
  max-height: 260px;
  overflow: auto;
  padding: 11px;
  background: var(--bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.6;
  color: #cdd3e0;
  white-space: pre;
}
.files {
  max-height: 180px;
  color: var(--text-faint);
}
.mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-soft);
  padding: 4px 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 11.5px;
  font-family: inherit;
}
.mini:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.mini.ok {
  color: var(--success);
}
footer {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-soft);
  background: var(--surface-2);
}
.foot-hint {
  margin: 0;
  flex: 1;
  font-size: 11.5px;
  color: var(--text-faint);
  line-height: 1.5;
}
.foot-hint code {
  font-family: var(--font-mono);
  color: var(--text-soft);
}
.foot-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn.primary {
  background: var(--accent);
  color: #fff;
}
.btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn.ghost {
  background: var(--surface-3);
  color: var(--text-soft);
  border-color: var(--border);
}
.btn.ghost:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  footer {
    flex-direction: column;
    align-items: stretch;
  }
  .foot-actions {
    justify-content: flex-end;
  }
}
</style>
