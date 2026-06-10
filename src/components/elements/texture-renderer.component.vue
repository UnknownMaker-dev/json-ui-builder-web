<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { Nineslice } from "../../utils/nineslice";

const props = defineProps<{
  src?: string;
  nineslice?: number;
  width: number;
  height: number;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Cache para não carregar a mesma imagem várias vezes
const imageCache = new Map<string, HTMLImageElement>();

const drawTexture = async () => {
  if (!canvasRef.value || !props.src || props.width <= 0 || props.height <= 0)
    return;

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  // Ajusta o tamanho do canvas
  canvasRef.value.width = props.width;
  canvasRef.value.height = props.height;

  // Carrega a imagem
  let img = imageCache.get(props.src);
  if (!img) {
    img = new Image();
    img.src = props.src;
    await new Promise((resolve) => {
      img!.onload = resolve;
      img!.onerror = resolve; // Ignora erros para não travar
    });
    imageCache.set(props.src, img);
  }

  // Se não tiver nineslice configurado, desenha a imagem esticada normal
  if (!props.nineslice || props.nineslice <= 0) {
    ctx.clearRect(0, 0, props.width, props.height);
    ctx.drawImage(img, 0, 0, props.width, props.height);
    return;
  }

  // Extrai os pixels originais da imagem usando um canvas temporário
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.drawImage(img, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, img.width, img.height);

  // Chama o algoritmo do projeto original
  const newPixels = Nineslice.ninesliceResize(
    {
      nineslice_size: props.nineslice,
      base_size: [img.width, img.height],
    },
    imageData.data,
    props.width,
    props.height,
    1, // Scale (ajuste se necessário)
  );

  // Coloca os novos pixels no canvas visível
  const newImageData = new ImageData(
    newPixels as any,
    props.width,
    props.height,
  );
  ctx.putImageData(newImageData, 0, 0);
};

// Redesenha sempre que as propriedades mudarem
watch(
  () => [props.src, props.nineslice, props.width, props.height],
  drawTexture,
  { deep: true },
);

onMounted(drawTexture);
</script>

<template>
  <canvas ref="canvasRef" class="texture-canvas"></canvas>
</template>

<style scoped>
.texture-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Deixa os cliques passarem para os elementos filhos */
  image-rendering: pixelated; /* Mantém a nitidez */
}
</style>
