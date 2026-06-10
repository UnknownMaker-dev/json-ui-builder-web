<script setup lang="ts">
import type { UIElement } from "../../stores/editor.store";

defineProps<{
  element: UIElement;
}>();
</script>

<template>
  <div class="mc-panel">
    <!-- Futuramente aqui entrará a lógica do NineSlice para a textura do painel -->
    <slot></slot>
  </div>
</template>

<style scoped>
.mc-panel {
  width: 100%;
  height: 100%;
  background-color: rgba(
    198,
    198,
    198,
    0.8
  ); /* Cor provisória estilo painel clássico */
  border: 2px solid #555;
  position: relative;
}
</style>
