<script setup lang="ts">
import sidebarleftComponent from "./components/editor/sidebarleft.component.vue";
import sidebarrightComponent from "./components/editor/sidebarright.component.vue";
import canvasareaComponent from "./components/editor/canvasarea.component.vue";
</script>

<template>
  <div class="editor-layout">
    <sidebarleftComponent />
    <sidebarrightComponent />
    <canvasareaComponent />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #e0e0e0;
  background-color: #1e1e1e;
  overflow: hidden; /* Evita scroll na página inteira */
}

.editor-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
}
</style>
