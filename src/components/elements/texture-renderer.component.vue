<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { Nineslice } from "../../utils/nineslice";
import { assetUrl } from "../../utils/asset-url";

const props = defineProps<{
  src?: string;
  nineslice?: number | [number, number, number, number];
  width: number;
  height: number;
}>();

// nineslice pode ser número único ou [l,t,r,b]; usa a soma p/ decidir se aplica.
const hasNineslice = () => {
  const n = props.nineslice;
  if (n == null) return false;
  return Array.isArray(n) ? n.some((v) => v > 0) : n > 0;
};

const canvasRef = ref<HTMLCanvasElement | null>(null);

// Cache para não carregar a mesma imagem várias vezes
const imageCache = new Map<string, HTMLImageElement>();

// Cache dos dados de nineslice (.json ao lado do .png).
type NsInfo = {
  nineslice_size: number | [number, number, number, number];
  base_size: [number, number];
} | null;
const ninesliceInfoCache = new Map<string, NsInfo>();

/** Normaliza base_size (número único ou [w,h]) para [w,h]. */
const normalizeBase = (b: any): [number, number] =>
  Array.isArray(b) ? [b[0], b[1]] : [b, b];

/**
 * Busca os dados de nineslice reais da textura: o arquivo .json que acompanha
 * o .png. É a fonte correta de nineslice_size E base_size (o PNG pode estar em
 * resolução maior que o tamanho lógico). Para texturas enviadas (data:) não há
 * sidecar — retorna null e caímos no fallback.
 */
const loadNinesliceInfo = async (src: string): Promise<NsInfo> => {
  if (ninesliceInfoCache.has(src)) return ninesliceInfoCache.get(src)!;
  let info: NsInfo = null;
  if (!src.startsWith("data:") && /\.png$/i.test(src)) {
    try {
      const res = await fetch(assetUrl(src.replace(/\.png$/i, ".json")));
      if (res.ok) {
        const raw = await res.json();
        if (raw?.base_size != null && raw?.nineslice_size != null) {
          info = {
            nineslice_size: raw.nineslice_size,
            base_size: normalizeBase(raw.base_size),
          };
        }
      }
    } catch {
      info = null;
    }
  }
  ninesliceInfoCache.set(src, info);
  return info;
};

const drawTexture = async () => {
  if (!canvasRef.value || !props.src || props.width <= 0 || props.height <= 0)
    return;

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;

  // Dimensões DEVEM ser inteiras: new ImageData() lança erro com frações
  // (o resize com proporção pode gerar tamanhos fracionários).
  const W = Math.max(1, Math.round(props.width));
  const H = Math.max(1, Math.round(props.height));

  // Ajusta o tamanho do canvas e desliga a suavização (queremos pixels nítidos).
  canvasRef.value.width = W;
  canvasRef.value.height = H;
  ctx.imageSmoothingEnabled = false;

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

  // Fonte de verdade do nineslice: o .json da textura (nineslice_size + base_size).
  const info = await loadNinesliceInfo(props.src);

  // Sem nineslice (nem no json, nem manual): desenha esticado, mas sem suavizar.
  if (!info && !hasNineslice()) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    return;
  }

  // Resolve nineslice_size e base_size (json tem prioridade sobre o valor manual).
  const nsSize: number | [number, number, number, number] = info
    ? info.nineslice_size
    : (props.nineslice as number);
  const [baseW, baseH] = info ? info.base_size : [img.width, img.height];

  // Extrai os pixels na RESOLUÇÃO LÓGICA (base_size). Se o PNG estiver em
  // resolução maior, ele é reduzido para o tamanho lógico aqui — assim o
  // algoritmo indexa os pixels corretamente.
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = baseW;
  tempCanvas.height = baseH;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(img, 0, 0, baseW, baseH);
  const imageData = tempCtx.getImageData(0, 0, baseW, baseH);

  // Chama o algoritmo do projeto original (dimensões inteiras)
  const newPixels = Nineslice.ninesliceResize(
    { nineslice_size: nsSize, base_size: [baseW, baseH] },
    imageData.data,
    W,
    H,
    1,
  );

  const newImageData = new ImageData(newPixels as any, W, H);
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
