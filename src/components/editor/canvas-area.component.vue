<script setup lang="ts">
import { useEditorStore } from '../../stores/editor.store'

const editorStore = useEditorStore()
</script>

<template>
  <main class="canvas-area" @click.self="editorStore.selectElement(null)">
    <div class="canvas-container" @click.self="editorStore.selectElement(null)">
      
      <p v-if="editorStore.elements.length === 0" class="empty-text">
        O canvas está vazio. Adicione um elemento.
      </p>

      <!-- Renderização dos Elementos -->
      <div 
        v-for="el in editorStore.elements" 
        :key="el.id"
        class="canvas-element"
        :class="{ 'is-selected': editorStore.selectedElementId === el.id }"
        :style="{
          left: el.properties.x + 'px',
          top: el.properties.y + 'px',
          width: el.properties.width + 'px',
          height: el.properties.height + 'px'
        }"
        @click.stop="editorStore.selectElement(el.id)"
      >
        {{ el.properties.text || el.type }}
      </div>

    </div>
  </main>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  background-color: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 2rem;
}
.canvas-container {
  width: 800px;
  height: 600px;
  background-color: #333333; /* Fundo simulando a tela */
  border: 2px dashed #3e3e42;
  position: relative;
  overflow: hidden;
}
.empty-text {
  color: #888;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Estilo genérico temporário para os elementos no canvas */
.canvas-element {
  position: absolute;
  background-color: #555;
  border: 1px solid #777;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.canvas-element.is-selected {
  border: 2px solid #007acc;
  box-shadow: 0 0 5px #007acc;
  z-index: 10;
}
</style>
