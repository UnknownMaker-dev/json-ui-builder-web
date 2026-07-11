<script setup lang="ts">
/**
 * Controle numérico com barra deslizante + campo de número.
 * Arrastar a barra e digitar o número editam o mesmo valor. O número pode
 * ultrapassar o máximo da barra (a barra apenas fixa no limite visual).
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    // Aceita número único; se vier array (ex: nineslice [l,t,r,b]) usa o 1º valor.
    modelValue: number | [number, number, number, number] | undefined;
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
  }>(),
  { min: 0, max: 100, step: 1, disabled: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "change"): void;
}>();

// Valor numérico atual (coage undefined/array para número).
const current = computed(() => {
  const v = props.modelValue;
  if (Array.isArray(v)) return v[0] ?? 0;
  return typeof v === "number" ? v : 0;
});

// Valor mostrado na barra (fixado ao intervalo p/ não estourar o trilho).
const sliderValue = computed(() =>
  Math.min(Math.max(current.value, props.min), props.max),
);

// Porcentagem preenchida do trilho (para o gradiente).
const fillPct = computed(() => {
  const range = props.max - props.min || 1;
  return ((sliderValue.value - props.min) / range) * 100;
});

const onSlider = (e: Event) => {
  emit("update:modelValue", Number((e.target as HTMLInputElement).value));
};
const onNumber = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value);
  emit("update:modelValue", Number.isFinite(v) ? v : 0);
};
const commit = () => emit("change");
</script>

<template>
  <div class="prop-slider" :class="{ disabled }">
    <label v-if="label" class="ps-label">
      {{ label }}<span v-if="unit" class="unit">{{ unit }}</span>
    </label>
    <div class="ps-controls">
      <input
        class="ps-range"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="sliderValue"
        :disabled="disabled"
        :style="{ '--fill': fillPct + '%' }"
        @input="onSlider"
        @change="commit"
      />
      <input
        class="ps-number"
        type="number"
        :step="step"
        :value="current"
        :disabled="disabled"
        @input="onNumber"
        @change="commit"
      />
    </div>
  </div>
</template>

<style scoped>
.prop-slider {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.prop-slider.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.ps-label {
  font-size: 11px;
  color: var(--text-soft);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
}
.unit {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}
.ps-controls {
  display: flex;
  align-items: center;
  gap: 9px;
}
.ps-range {
  flex: 1;
  min-width: 0;
  -webkit-appearance: none;
  appearance: none;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--accent) 0%,
    var(--accent) var(--fill, 0%),
    var(--surface-3) var(--fill, 0%),
    var(--surface-3) 100%
  );
  cursor: pointer;
  outline: none;
}
.ps-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--accent);
  box-shadow: var(--shadow-sm);
  cursor: grab;
  transition: transform 0.1s;
}
.ps-range::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}
.ps-range::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--accent);
  cursor: grab;
}
.ps-range:focus-visible {
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.ps-number {
  width: 62px;
  flex-shrink: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 7px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-family: var(--font-mono);
  text-align: center;
}
.ps-number:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
/* remove as setinhas do number para um visual mais limpo */
.ps-number::-webkit-outer-spin-button,
.ps-number::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ps-number {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
