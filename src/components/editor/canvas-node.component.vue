<script setup lang="ts">
import { ref } from "vue";
import { useEditorStore, type UIElement } from "../../stores/editor.store";
import PanelElement from "../elements/panel.element.vue";
import ButtonElement from "../elements/button.element.vue";
import LabelElement from "../elements/label.element.vue";

const props = defineProps<{ element: UIElement }>();
const editorStore = useEditorStore();

const elementComponents: Record<string, any> = {
  panel: PanelElement,
  button: ButtonElement,
  label: LabelElement,
};

const isDragging = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const initialX = ref(0);
const initialY = ref(0);

const startDrag = (event: MouseEvent) => {
  editorStore.selectElement(props.element.id);
  isDragging.value = true;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
  initialX.value = props.element.properties.x;
  initialY.value = props.element.properties.y;

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
};

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaX = event.clientX - startMouseX.value;
  const deltaY = event.clientY - startMouseY.value;
  props.element.properties.x = initialX.value + deltaX;
  props.element.properties.y = initialY.value + deltaY;
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
};
</script>

<template>
  <div
    class="canvas-element-wrapper"
    :class="{ 'is-selected': editorStore.selectedElementId === element.id }"
    :style="{
      left: element.properties.x + 'px',
      top: element.properties.y + 'px',
      width: element.properties.width + 'px',
      height: element.properties.height + 'px',
    }"
    @mousedown.stop="startDrag"
  >
    <component :is="elementComponents[element.type]" :element="element">
      <!-- Renderiza os filhos DENTRO do componente atual -->
      <CanvasNode
        v-for="child in element.children"
        :key="child.id"
        :element="child"
      />
    </component>
  </div>
</template>

<style scoped>
.canvas-element-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
}
.canvas-element-wrapper:active {
  cursor: grabbing;
}
.canvas-element-wrapper.is-selected {
  outline: 2px solid #007acc;
  box-shadow: 0 0 5px #007acc;
  z-index: 10;
}
</style>
