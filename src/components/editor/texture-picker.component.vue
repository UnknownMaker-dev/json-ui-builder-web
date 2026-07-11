<script setup lang="ts">
/**
 * Seletor visual de texturas: presets embarcados (por estilo) + texturas do
 * usuário. Upload local (PNG + JSON de nineslice opcional).
 */
import { ref, onMounted, computed } from "vue";
import { Search, X, Upload, Trash2, ImageUp } from "lucide-vue-next";
import {
  loadAllPresets,
  getCustomTextures,
  addCustomTexture,
  removeCustomTexture,
  type TextureEntry,
} from "../../utils/presets";

const props = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "close"): void;
}>();

const groups = ref<Record<string, TextureEntry[]>>({});
const custom = ref<TextureEntry[]>([]);
const loading = ref(true);
const search = ref("");

const pngInput = ref<File | null>(null);
const jsonInput = ref<File | null>(null);

onMounted(async () => {
  groups.value = await loadAllPresets();
  custom.value = getCustomTextures();
  loading.value = false;
});

const allGroups = computed(() => {
  const merged: Record<string, TextureEntry[]> = {};
  if (custom.value.length) merged["Minhas Texturas"] = custom.value;
  Object.assign(merged, groups.value);
  const q = search.value.trim().toLowerCase();
  if (!q) return merged;
  const filtered: Record<string, TextureEntry[]> = {};
  for (const [style, list] of Object.entries(merged)) {
    const hits = list.filter((t) => t.name.toLowerCase().includes(q));
    if (hits.length) filtered[style] = hits;
  }
  return filtered;
});

const select = (entry: TextureEntry) => emit("update:modelValue", entry.url);

const onPng = (e: Event) => {
  pngInput.value = (e.target as HTMLInputElement).files?.[0] ?? null;
};
const onJson = (e: Event) => {
  jsonInput.value = (e.target as HTMLInputElement).files?.[0] ?? null;
};
const doUpload = async () => {
  if (!pngInput.value) return;
  await addCustomTexture(pngInput.value, jsonInput.value);
  custom.value = getCustomTextures();
  pngInput.value = null;
  jsonInput.value = null;
};
const doRemove = (entry: TextureEntry) => {
  removeCustomTexture(entry.url);
  custom.value = getCustomTextures();
};

const styleLabel = (style: string) =>
  style.replace(/_ore-ui_style$/, "").replace(/_/g, " ");
</script>

<template>
  <div class="picker-overlay" @click.self="emit('close')">
    <div class="picker">
      <header>
        <h3>Selecionar textura</h3>
        <div class="search-wrap">
          <Search :size="15" class="search-icon" />
          <input v-model="search" placeholder="Buscar textura..." class="search" />
        </div>
        <button class="close" @click="emit('close')"><X :size="18" /></button>
      </header>

      <div class="upload-bar">
        <ImageUp :size="16" class="up-lead" />
        <label class="file-btn">
          {{ pngInput?.name || "PNG" }}
          <input type="file" accept=".png" @change="onPng" hidden />
        </label>
        <label class="file-btn subtle">
          {{ jsonInput?.name || "JSON (opcional)" }}
          <input type="file" accept=".json" @change="onJson" hidden />
        </label>
        <button class="up-btn" :disabled="!pngInput" @click="doUpload">
          <Upload :size="14" /> Enviar
        </button>
      </div>

      <div v-if="loading" class="loading">Carregando presets…</div>
      <div v-else class="groups">
        <section v-for="(list, style) in allGroups" :key="style">
          <h4>{{ styleLabel(String(style)) }}</h4>
          <div class="grid">
            <button
              v-for="tex in list"
              :key="tex.url"
              class="tex"
              :class="{ active: tex.url === props.modelValue }"
              :title="tex.name"
              @click="select(tex)"
            >
              <div class="tex-thumb"><img :src="tex.url" :alt="tex.name" /></div>
              <span class="tex-name">{{ tex.name }}</span>
              <span v-if="tex.nineslice" class="badge">9</span>
              <span
                v-if="tex.custom"
                class="del"
                @click.stop="doRemove(tex)"
                title="Remover"
              >
                <Trash2 :size="12" />
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 14, 0.66);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.picker {
  width: 660px;
  max-width: 92vw;
  height: 80vh;
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
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-soft);
}
header h3 {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}
.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-faint);
}
.search {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 10px 8px 32px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.search:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.close {
  background: transparent;
  border: none;
  color: var(--text-soft);
  cursor: pointer;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
}
.close:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.upload-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface-2);
}
.up-lead {
  color: var(--text-faint);
}
.file-btn {
  background: var(--surface-3);
  border: 1px solid var(--border);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-btn.subtle {
  color: var(--text-soft);
}
.file-btn:hover {
  border-color: var(--accent);
}
.up-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
}
.up-btn:hover {
  background: var(--accent-hover);
}
.up-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.groups {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}
section h4 {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  margin: 8px 0 10px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
  margin-bottom: 18px;
}
.tex {
  position: relative;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  padding: 8px 6px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, transform 0.05s;
}
.tex:hover {
  border-color: var(--border-strong);
}
.tex:active {
  transform: translateY(1px);
}
.tex.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}
.tex-thumb {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  background: repeating-conic-gradient(#2a2f3e 0% 25%, #232838 0% 50%) 50% / 12px 12px;
  border-radius: var(--radius-sm);
}
.tex-thumb img {
  max-width: 44px;
  max-height: 44px;
  object-fit: contain;
  image-rendering: pixelated;
}
.tex-name {
  font-size: 10px;
  color: var(--text-soft);
  max-width: 78px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: var(--accent);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.del {
  position: absolute;
  top: 4px;
  left: 4px;
  color: #f87171;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
.del:hover {
  background: var(--danger-soft);
}
.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-faint);
}
</style>
