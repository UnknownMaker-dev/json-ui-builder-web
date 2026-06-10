<script setup lang="ts">
import { computed } from 'vue'
import type { UIElement } from '../../stores/editor.store'

const props = defineProps<{ element: UIElement }>()

const ninesliceStyle = computed(() => {
  const tex = props.element.properties.texture
  const slice = props.element.properties.nineslice

  if (!tex) return {}

  return {
    borderStyle: 'solid',
    borderImageSource: `url(${tex})`,
    borderImageSlice: `${slice} fill`,
    borderImageWidth: `${slice}px`,
    borderImageRepeat: 'stretch',
    backgroundColor: 'transparent'
  }
})
</script>

<template>
  <button class="mc-button mc-font" :style="ninesliceStyle">
    {{ element.properties.text }}
  </button>
</template>

<style scoped>
.mc-button {
  width: 100%;
  height: 100%;
  background-color: #3c8527; /* Fallback */
  color: white;
  border: 2px solid #1e4d12; /* Fallback */
  cursor: inherit;
  outline: none;
  font-size: 16px;
  text-shadow: 1px 1px 0 #3f3f3f;
}
.mc-button:hover {
  filter: brightness(1.1); /* Efeito de hover genérico */
}
</style>
