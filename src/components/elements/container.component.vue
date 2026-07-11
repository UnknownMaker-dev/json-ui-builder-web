<script setup lang="ts">
/**
 * Container genérico para stack_panel, collection_panel e scrolling_panel.
 * Renderiza uma textura de fundo opcional, um contorno tracejado indicando o
 * tipo de container, e os filhos via slot.
 */
import type { UIElement } from "../../stores/editor.store";
import TextureRenderer from "./texture-renderer.component.vue";

defineProps<{ element: UIElement }>();

const labels: Record<string, string> = {
  stackPanel: "STACK",
  collectionPanel: "COLLECTION",
  scrollingPanel: "SCROLL",
  panel: "PANEL",
};
</script>

<template>
  <div class="mc-container" :class="element.type">
    <TextureRenderer
      v-if="element.properties.texture"
      :src="element.properties.texture"
      :nineslice="element.properties.nineslice"
      :width="element.properties.width"
      :height="element.properties.height"
    />
    <span class="container-tag">{{ labels[element.type] || element.type }}</span>
    <div class="content-slot"><slot></slot></div>
  </div>
</template>

<style scoped>
.mc-container {
  width: 100%;
  height: 100%;
  position: relative;
  outline: 1px dashed rgba(129, 140, 248, 0.55);
  background-color: rgba(99, 102, 241, 0.07);
  border-radius: 2px;
}
.container-tag {
  position: absolute;
  top: 3px;
  left: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: rgba(165, 173, 250, 0.9);
  pointer-events: none;
  z-index: 1;
  font-family: var(--font-mono, monospace);
}
.content-slot {
  position: absolute;
  inset: 0;
}
</style>
