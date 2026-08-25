<script setup lang="ts">
import { assetUrl } from "../../utils/asset-url";
import type { UIElement } from "../../stores/editor.store";
import TextureRenderer from "./texture-renderer.component.vue";

defineProps<{ element: UIElement }>();
</script>

<template>
  <div class="mc-image">
    <TextureRenderer
      :src="assetUrl(element.properties.texture)"
      :nineslice="element.properties.nineslice"
      :width="element.properties.width"
      :height="element.properties.height"
    />
    <div class="content-slot"><slot></slot></div>
  </div>
</template>

<style scoped>
.mc-image {
  width: 100%;
  height: 100%;
  position: relative;
}
.content-slot {
  position: absolute;
  inset: 0;
}
</style>
