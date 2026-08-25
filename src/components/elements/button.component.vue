<script setup lang="ts">
import { assetUrl } from "../../utils/asset-url";
import type { UIElement } from "../../stores/editor.store";
import TextureRenderer from "./texture-renderer.component.vue";

defineProps<{ element: UIElement }>();
</script>

<template>
  <button class="mc-button mc-font">
    <TextureRenderer
      :src="assetUrl(element.properties.defaultTexture || element.properties.texture)"
      :nineslice="element.properties.nineslice"
      :width="element.properties.width"
      :height="element.properties.height"
    />
    <span
      class="button-text"
      :style="{
        fontFamily: element.properties.fontType || 'MinecraftRegular',
        fontSize: (element.properties.fontSize ?? 1) * 16 + 'px',
        textAlign: element.properties.textAlignment || 'center',
      }"
      >{{ element.properties.text }}</span
    >
  </button>
</template>

<style scoped>
.mc-button {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
  border: none;
  cursor: inherit;
  outline: none;
  font-size: 16px;
  text-shadow: 1px 1px 0 #3f3f3f;
  color: white;
}
.button-text {
  position: relative;
  z-index: 1; /* Fica acima do canvas da textura */
}
</style>
