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
  outline: 1px dashed rgba(120, 170, 255, 0.5);
  background-color: rgba(120, 170, 255, 0.06);
}
.container-tag {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 9px;
  letter-spacing: 0.5px;
  color: rgba(160, 200, 255, 0.8);
  pointer-events: none;
  z-index: 1;
}
.content-slot {
  position: absolute;
  inset: 0;
}
</style>
