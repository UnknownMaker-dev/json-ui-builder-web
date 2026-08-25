<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-vue-next";
import { useEditorStore } from "../../stores/editor.store";
import CanvasNode from "./canvas-node.component.vue";

const editorStore = useEditorStore();

// --- ZOOM ---
const areaRef = ref<HTMLElement | null>(null);
const PADDING = 20;

/**
 * O container escalado precisa ocupar o tamanho JÁ reduzido, senão a área
 * continuaria reservando 800x600 e a rolagem apareceria mesmo com zoom baixo.
 */
const scalerStyle = computed(() => ({
  width: `${800 * editorStore.zoom}px`,
  height: `${600 * editorStore.zoom}px`,
}));

let observer: ResizeObserver | null = null;

const measure = () => {
  const el = areaRef.value;
  if (!el) return;
  editorStore.fitToViewport(
    el.clientWidth - PADDING * 2,
    el.clientHeight - PADDING * 2,
  );
};

/** Ctrl + roda dá zoom, como em qualquer editor. Sem Ctrl, rola normal. */
const onWheel = (event: WheelEvent) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  editorStore.setZoom(editorStore.zoom + (event.deltaY < 0 ? 0.1 : -0.1));
};

// Listener para deletar com o teclado
const handleKeyDown = (event: KeyboardEvent) => {
  if (document.activeElement?.tagName === "INPUT") return;

  // Deletar
  if (
    (event.key === "Delete" || event.key === "Backspace") &&
    editorStore.selectedElementId
  ) {
    editorStore.deleteElement(editorStore.selectedElementId);
  }

  // Desfazer (Ctrl + Z)
  if (event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) {
    editorStore.undo();
  }

  // Refazer (Ctrl + Y ou Ctrl + Shift + Z)
  if (
    (event.ctrlKey && event.key.toLowerCase() === "y") ||
    (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z")
  ) {
    editorStore.redo();
  }

  // Copiar (Ctrl + C)
  if (event.ctrlKey && event.key.toLowerCase() === "c") {
    editorStore.copyElement();
  }

  // Colar (Ctrl + V)
  if (event.ctrlKey && event.key.toLowerCase() === "v") {
    editorStore.pasteElement();
  }

  // Setas: move o elemento selecionado (Shift = passo maior).
  // Em filhos de stack_panel, reordena na pilha.
  if (event.key.startsWith("Arrow") && editorStore.selectedElementId) {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      editorStore.nudgeSelected(move[0], move[1]);
    }
  }
};

onMounted(() => {
  measure();
  observer = new ResizeObserver(measure);
  if (areaRef.value) observer.observe(areaRef.value);
});
onUnmounted(() => observer?.disconnect());

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<!-- O template e o style continuam iguais -->
<template>
  <main
    ref="areaRef"
    class="canvas-area"
    @click.self="editorStore.selectElement(null)"
    @wheel="onWheel"
  >
    <!-- Ocupa o tamanho JÁ escalado, para a rolagem bater com o que se vê -->
    <div class="canvas-scaler" :style="scalerStyle" @click.self="editorStore.selectElement(null)">
      <div
        class="canvas-container"
        :style="{ transform: `scale(${editorStore.zoom})` }"
        @click.self="editorStore.selectElement(null)"
      >
        <p v-if="editorStore.elements.length === 0" class="empty-text">
          O canvas está vazio. Adicione um Painel para começar.
        </p>
        <CanvasNode
          v-for="el in editorStore.elements"
          :key="el.id"
          :element="el"
        />
      </div>
    </div>

    <div class="zoom-bar">
      <button title="Menos zoom" @click="editorStore.zoomOut()"><ZoomOut :size="15" /></button>
      <button class="pct" title="Ajustar à janela" @click="editorStore.zoomToFit()">
        {{ Math.round(editorStore.zoom * 100) }}%
      </button>
      <button title="Mais zoom" @click="editorStore.zoomIn()"><ZoomIn :size="15" /></button>
      <button
        class="fit"
        :class="{ on: editorStore.zoomMode === 'fit' }"
        title="Acompanhar o tamanho da janela"
        @click="editorStore.zoomToFit()"
      >
        <Maximize2 :size="14" />
      </button>
    </div>
  </main>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  background-color: var(--bg);
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.035) 1px, transparent 0);
  background-size: 22px 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}
.canvas-scaler {
  position: relative;
  flex-shrink: 0;
}
.canvas-container {
  width: 800px;
  height: 600px;
  transform-origin: top left;
  background-color: #2b2f3d;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}
.zoom-bar {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  z-index: 20;
}
.zoom-bar button {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  background: transparent;
  border: none;
  color: var(--text-soft);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11.5px;
}
.zoom-bar button:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.zoom-bar .pct {
  min-width: 44px;
}
.zoom-bar .fit.on {
  background: var(--accent-soft);
  color: var(--accent);
}
.empty-text {
  color: var(--text-faint);
  font-size: 13px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
