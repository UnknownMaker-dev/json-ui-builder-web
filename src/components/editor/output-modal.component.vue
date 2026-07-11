<script setup lang="ts">
/** Modal genérico que exibe código gerado (JSON UI / script) com copiar/baixar. */
import { ref } from "vue";
import { Copy, Download, X, Check } from "lucide-vue-next";

const props = defineProps<{
  title: string;
  content: string;
  filename: string;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

const copied = ref(false);
const copy = async () => {
  await navigator.clipboard.writeText(props.content);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
};
const download = () => {
  const blob = new Blob([props.content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = props.filename;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <header>
        <div class="title">
          <h3>{{ title }}</h3>
          <code class="fname">{{ filename }}</code>
        </div>
        <div class="actions">
          <button :class="{ ok: copied }" @click="copy">
            <component :is="copied ? Check : Copy" :size="15" />
            {{ copied ? "Copiado" : "Copiar" }}
          </button>
          <button @click="download"><Download :size="15" /> Baixar</button>
          <button class="close" @click="emit('close')"><X :size="17" /></button>
        </div>
      </header>
      <pre><code>{{ content }}</code></pre>
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
  width: 780px;
  max-width: 94vw;
  height: 82vh;
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
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface-2);
}
.title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.fname {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-faint);
}
.actions {
  display: flex;
  gap: 7px;
}
.actions button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-3);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 6px 11px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
}
.actions button:hover {
  background: var(--surface-hover);
}
.actions button.ok {
  color: var(--success);
  border-color: rgba(34, 197, 94, 0.4);
}
.actions .close {
  padding: 6px;
}
pre {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 16px;
  background: var(--bg);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  color: #cdd3e0;
  white-space: pre;
}
</style>
