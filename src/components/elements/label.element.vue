<script setup lang="ts">
import type { UIElement } from '../../stores/editor.store'

defineProps<{
  element: UIElement
}>()
</script>

<template>
  <div class="mc-label mc-font">
    {{ element.properties.text }}
  </div>
</template>

<style scoped>
.mc-label {
  width: 100%;
  height: 100%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  text-shadow: 1px 1px 0 #3f3f3f;
}
</style>
