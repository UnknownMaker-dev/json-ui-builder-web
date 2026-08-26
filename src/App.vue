<script setup lang="ts">
import { t } from "./i18n";
import { ref } from "vue";
import { Boxes, SlidersHorizontal, Lock, Unlock } from "lucide-vue-next";
import { useEditorStore } from "./stores/editor.store";
import toolbarComponent from "./components/editor/toolbar.component.vue";
import sidebarleftComponent from "./components/editor/sidebar-left.component.vue";
import sidebarrightComponent from "./components/editor/sidebar-right.component.vue";
import canvasareaComponent from "./components/editor/canvas-area.component.vue";
import screentabsComponent from "./components/editor/screen-tabs.component.vue";

const editorStore = useEditorStore();

// Estado das gavetas no mobile.
const leftOpen = ref(false);
const rightOpen = ref(false);

const openLeft = () => {
  rightOpen.value = false;
  leftOpen.value = !leftOpen.value;
};
const openRight = () => {
  leftOpen.value = false;
  rightOpen.value = !rightOpen.value;
};
const closeDrawers = () => {
  leftOpen.value = false;
  rightOpen.value = false;
};
</script>

<template>
  <div class="app-shell">
    <toolbarComponent />
    <screentabsComponent />

    <div class="editor-layout">
      <sidebarleftComponent class="drawer-left" :class="{ open: leftOpen }" />
      <canvasareaComponent />
      <sidebarrightComponent class="drawer-right" :class="{ open: rightOpen }" />

      <!-- Cobertura para fechar gavetas no mobile -->
      <div
        v-if="leftOpen || rightOpen"
        class="scrim"
        @click="closeDrawers"
      ></div>
    </div>

    <!-- Barra inferior (só mobile) -->
    <nav class="mobile-bar">
      <button :class="{ active: leftOpen }" @click="openLeft">
        <Boxes :size="20" />
        <span>{{ t("mobile.elements") }}</span>
      </button>
      <button
        :class="{ active: editorStore.aspectLocked }"
        @click="editorStore.toggleAspectLock()"
      >
        <component :is="editorStore.aspectLocked ? Lock : Unlock" :size="20" />
        <span>{{ t("mobile.aspect") }}</span>
      </button>
      <button :class="{ active: rightOpen }" @click="openRight">
        <SlidersHorizontal :size="20" />
        <span>{{ t("mobile.properties") }}</span>
      </button>
    </nav>
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
  overflow: hidden;
}

.app-shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* respeita a barra do navegador no mobile */
}
.editor-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}

/* A barra inferior e o scrim só existem no mobile */
.mobile-bar {
  display: none;
}
.scrim {
  display: none;
}

/* ============================================================
   MOBILE — sidebars viram gavetas deslizantes
   ============================================================ */
@media (max-width: 860px) {
  .drawer-left,
  .drawer-right {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 900;
    box-shadow: var(--shadow-lg);
    transition: transform 0.25s ease;
    width: min(300px, 86vw) !important;
  }
  .drawer-left {
    left: 0;
    transform: translateX(-100%);
  }
  .drawer-left.open {
    transform: translateX(0);
  }
  .drawer-right {
    right: 0;
    transform: translateX(100%);
  }
  .drawer-right.open {
    transform: translateX(0);
  }

  .scrim {
    display: block;
    position: absolute;
    inset: 0;
    background: rgba(6, 8, 14, 0.5);
    z-index: 850;
  }

  .mobile-bar {
    display: flex;
    height: 60px;
    flex-shrink: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .mobile-bar button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: transparent;
    border: none;
    color: var(--text-soft);
    font-size: 10.5px;
    font-weight: 500;
    cursor: pointer;
  }
  .mobile-bar button.active {
    color: var(--accent);
  }
  .mobile-bar button.active svg {
    color: var(--accent);
  }
}
</style>
