<script setup lang="ts">
import type { UIElement } from "../../stores/editor.store.ts";
import TextureRenderer from "./texture-renderer.component.vue";

defineProps<{ element: UIElement }>();
</script>

<template>
  <div class="mc-panel">
    <TextureRenderer
      :src="element.properties.texture"
      :nineslice="element.properties.nineslice"
      :width="element.properties.width"
      :height="element.properties.height"
    />
    <div class="content-slot">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.mc-panel {
  width: 100%;
  height: 100%;
  position: relative;
  /* Fallback caso não tenha textura */
  background-color: rgba(198, 198, 198, 0.2);
}
.content-slot {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
