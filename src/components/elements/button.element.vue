<script setup lang="ts">
import type { UIElement } from "../../stores/editor.store";

defineProps<{
  element: UIElement;
}>();
</script>

<template>
  <button class="mc-button">
    {{ element.properties.text }}
  </button>
</template>

<style scoped>
.mc-button {
  width: 100%;
  height: 100%;
  background-color: #3c8527; /* Cor provisória estilo botão verde do MC */
  color: white;
  border: 2px solid #1e4d12;
  font-family: sans-serif; /* Mudaremos para a fonte do MC depois */
  cursor: inherit; /* Herda o cursor grab do pai */
  outline: none;
}
.mc-button:hover {
  background-color: #4a9e32;
}
</style>
