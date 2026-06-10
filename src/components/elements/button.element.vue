<script setup lang="ts">
import type { UIElement } from "../../stores/editor.store";

defineProps<{
  element: UIElement;
}>();
</script>

<template>
  <button class="mc-button mc-font">
    {{ element.properties.text }}
  </button>
</template>

<style scoped>
.mc-button {
  width: 100%;
  height: 100%;
  background-color: #3c8527;
  color: white;
  border: 2px solid #1e4d12;
  cursor: inherit;
  outline: none;
  font-size: 16px; /* Ajuste conforme necessário */
  text-shadow: 1px 1px 0 #1e4d12; /* Sombra clássica de texto em botões */
}
.mc-button:hover {
  background-color: #4a9e32;
}
</style>
