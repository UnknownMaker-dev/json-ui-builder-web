<script setup lang="ts">
/** Modal genérico que exibe código gerado (JSON UI / script) com copiar/baixar. */
const props = defineProps<{
  title: string;
  content: string;
  filename: string;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

const copy = async () => {
  await navigator.clipboard.writeText(props.content);
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
        <h3>{{ title }}</h3>
        <div class="actions">
          <button @click="copy">📋 Copiar</button>
          <button @click="download">⬇ Baixar {{ filename }}</button>
          <button class="close" @click="emit('close')">✕</button>
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: 760px;
  max-width: 94vw;
  height: 82vh;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #3e3e42;
  background: #252526;
}
h3 {
  margin: 0;
  font-size: 1rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.actions button {
  background: #0e639c;
  color: #fff;
  border: none;
  padding: 0.35rem 0.6rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}
.actions .close {
  background: #444;
}
pre {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 1rem;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #d4d4d4;
  white-space: pre;
}
</style>
