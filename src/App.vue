<script setup lang="ts">
import toolbarComponent from "./components/editor/toolbar.component.vue";
import sidebarleftComponent from "./components/editor/sidebar-left.component.vue";
import sidebarrightComponent from "./components/editor/sidebar-right.component.vue";
import canvasareaComponent from "./components/editor/canvas-area.component.vue";
</script>

<template>
  <div class="app-shell">
    <toolbarComponent />
    <div class="editor-layout">
      <sidebarleftComponent />
      <canvasareaComponent />
      <sidebarrightComponent />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  color: var(--text);
  background-color: var(--bg);
  overflow: hidden; /* Evita scroll na página inteira */
}

.app-shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}
.editor-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
</style>
