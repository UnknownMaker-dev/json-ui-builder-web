<script setup lang="ts">
// Aqui ficará a lista de elementos (botões, painéis) para arrastar ou clicar
</script>

<template>
  <aside class="sidebar-left">
    <h2>Elementos</h2>
    <ul>
      <li>Button</li>
      <li>Panel</li>
      <li>Label</li>
    </ul>
  </aside>
</template>

<style scoped>
.sidebar-left {
  width: 250px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  padding: 1rem;
  overflow-y: auto;
}
h2 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #cccccc;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 0.5rem;
  background-color: #333333;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}
li:hover {
  background-color: #094771;
}
</style>
