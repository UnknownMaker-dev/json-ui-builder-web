<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import type { UIElement } from "../../stores/editor.store";

const props = defineProps<{ element: UIElement }>();

const textRef = ref<HTMLElement | null>(null);

// Padding interno (px) ao redor do texto na caixa auto-dimensionada.
const PAD_X = 4;
const PAD_Y = 2;

/** Tamanho da fonte em px no canvas (font_scale_factor * base). */
const fontPx = () => (props.element.properties.fontSize ?? 1) * 16;

/**
 * A caixa se MOLDA ao texto: mede o texto no tamanho de fonte atual e ajusta
 * width/height do elemento para caberem exatamente. A fonte é quem comanda.
 */
const resizeBoxToText = () => {
  const text = textRef.value;
  if (!text) return;
  text.style.fontSize = `${fontPx()}px`;
  const w = Math.ceil(text.scrollWidth) + PAD_X * 2;
  const h = Math.ceil(text.scrollHeight) + PAD_Y * 2;
  if (w > 0) props.element.properties.width = w;
  if (h > 0) props.element.properties.height = h;
};

onMounted(() => nextTick(resizeBoxToText));

// Refaz quando a fonte, o texto ou o tipo de fonte mudam.
watch(
  () => [
    props.element.properties.fontSize,
    props.element.properties.text,
    props.element.properties.fontType,
  ],
  () => nextTick(resizeBoxToText),
);
</script>

<template>
  <div
    class="mc-label mc-font"
    :style="{
      justifyContent:
        element.properties.textAlignment === 'right'
          ? 'flex-end'
          : element.properties.textAlignment === 'center'
            ? 'center'
            : 'flex-start',
    }"
  >
    <span
      ref="textRef"
      class="label-text"
      :style="{
        fontFamily: element.properties.fontType || 'MinecraftRegular',
        fontSize: fontPx() + 'px',
        color: element.properties.color
          ? `rgb(${element.properties.color.map((c: number) => Math.round(c * 255)).join(',')})`
          : 'white',
        textShadow: element.properties.shadow ? '2px 2px 0 #3f3f3f' : 'none',
      }"
      >{{ element.properties.text }}</span
    >
  </div>
</template>

<style scoped>
.mc-label {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: visible;
}
.label-text {
  white-space: nowrap;
  line-height: 1;
  display: inline-block;
}
</style>
