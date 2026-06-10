<script setup lang="ts">
import { computed } from "vue";
import type { UIElement } from "../../stores/editor.store";

const props = defineProps<{ element: UIElement }>();

const ninesliceStyle = computed(() => {
  const tex = props.element.properties.texture;
  const slice = props.element.properties.nineslice;

  if (!tex) return {}; // Se não tiver textura, usa o CSS padrão

  return {
    borderStyle: "solid",
    borderImageSource: `url(${tex})`,
    borderImageSlice: `${slice} fill`, // 'fill' garante que o centro da imagem seja renderizado
    borderImageWidth: `${slice}px`,
    borderImageRepeat: "stretch",
    backgroundColor: "transparent", // Remove o fundo cinza padrão
  };
});
</script>

<template>
  <div class="mc-panel" :style="ninesliceStyle">
    <slot></slot>
  </div>
</template>

<style scoped>
.mc-panel {
  width: 100%;
  height: 100%;
  background-color: rgba(198, 198, 198, 0.8);
  border: 2px solid #555;
  position: relative;

  /* A MÁGICA AQUI: Mantém o pixel art nítido ao esticar */
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges; /* Suporte para Firefox antigo */
  image-rendering: crisp-edges;
}
</style>
