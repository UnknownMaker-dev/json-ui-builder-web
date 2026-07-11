<script setup lang="ts">
/**
 * Seletor visual de texturas: mostra os presets embarcados (agrupados por
 * estilo) e as texturas enviadas pelo usuário. Permite upload local (PNG + JSON
 * de nineslice opcional). Emite o caminho da textura escolhida.
 */
import { ref, onMounted, computed } from "vue";
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

const select = (entry: TextureEntry) => {
  emit("update:modelValue", entry.url);
};

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
        <h3>Selecionar Textura</h3>
        <input v-model="search" placeholder="🔍 Buscar..." class="search" />
        <button class="close" @click="emit('close')">✕</button>
      </header>

      <div class="upload-bar">
        <label class="file-btn">
          PNG
          <input type="file" accept=".png" @change="onPng" hidden />
        </label>
        <span class="fname">{{ pngInput?.name || "nenhum" }}</span>
        <label class="file-btn">
          JSON (nineslice)
          <input type="file" accept=".json" @change="onJson" hidden />
        </label>
        <span class="fname">{{ jsonInput?.name || "opcional" }}</span>
        <button class="up-btn" :disabled="!pngInput" @click="doUpload">
          ⬆ Enviar
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
              <img :src="tex.url" :alt="tex.name" />
              <span class="tex-name">{{ tex.name }}</span>
              <span v-if="tex.nineslice" class="badge">9</span>
              <span
                v-if="tex.custom"
                class="del"
                @click.stop="doRemove(tex)"
                title="Remover"
                >🗑</span
              >
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.picker {
  width: 640px;
  max-width: 92vw;
  height: 80vh;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #3e3e42;
}
header h3 {
  font-size: 1rem;
  margin: 0;
}
.search {
  flex: 1;
  background: #3c3c3c;
  border: 1px solid #555;
  color: #fff;
  padding: 0.35rem 0.5rem;
  border-radius: 3px;
}
.close {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.1rem;
  cursor: pointer;
}
.upload-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #3e3e42;
  font-size: 0.8rem;
  flex-wrap: wrap;
}
.file-btn {
  background: #333;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
}
.file-btn:hover {
  background: #094771;
}
.fname {
  color: #888;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.up-btn {
  background: #0e639c;
  color: #fff;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  cursor: pointer;
}
.up-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.groups {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}
section h4 {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #9ab;
  margin: 0.5rem 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tex {
  position: relative;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 0.35rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.tex:hover {
  border-color: #0e639c;
}
.tex.active {
  border-color: #007acc;
  box-shadow: 0 0 0 1px #007acc;
}
.tex img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
}
.tex-name {
  font-size: 0.62rem;
  color: #bbb;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #0e639c;
  color: #fff;
  font-size: 0.55rem;
  padding: 0 3px;
  border-radius: 2px;
}
.del {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 0.7rem;
}
.loading {
  padding: 2rem;
  text-align: center;
  color: #888;
}
</style>
