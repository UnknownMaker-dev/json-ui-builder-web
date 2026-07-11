<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import type { UIElement } from "../../stores/editor.store";

const props = defineProps<{ element: UIElement }>();

const boxRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

// Tamanho de referência usado só para medir o texto antes de escalar.
const REF_PX = 100;

/**
 * Ajusta a fonte para o texto CABER na caixa (fit): mede o texto num tamanho
 * de referência e escala pela menor razão entre largura e altura da caixa.
 * O valor resultante também é gravado em `fontSize` (font_scale_factor) para
 * o export ficar consistente com o que se vê.
 */
const fitText = () => {
  const box = boxRef.value;
  const text = textRef.value;
  if (!box || !text) return;

  text.style.fontSize = `${REF_PX}px`;
  const tw = text.scrollWidth;
  const th = text.scrollHeight;
  if (tw === 0 || th === 0) return;

  const scale = Math.min(box.clientWidth / tw, box.clientHeight / th);
  const px = Math.max(1, REF_PX * scale);
  text.style.fontSize = `${px}px`;

  // Mantém a propriedade fontSize (font_scale_factor) alinhada ao visual.
  props.element.properties.fontSize = +(px / 16).toFixed(3);
};

onMounted(() => nextTick(fitText));

// Refaz o fit quando a caixa, o texto ou a fonte mudam.
watch(
  () => [
    props.element.properties.width,
    props.element.properties.height,
    props.element.properties.text,
    props.element.properties.fontType,
  ],
  () => nextTick(fitText),
);
</script>

<template>
  <div
    ref="boxRef"
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
  overflow: hidden;
}
.label-text {
  white-space: nowrap;
  line-height: 1;
  display: inline-block;
}
</style>
