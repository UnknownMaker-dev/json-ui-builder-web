/**
 * Configurações de exportação para JSON UI do Minecraft Bedrock.
 *
 * Portado e adaptado do projeto original (CONFIG.ts -> magicNumbers).
 * O editor trabalha em PIXELS absolutos (canto superior esquerdo); o Minecraft
 * usa um sistema de coordenadas próprio. O UI_SCALAR converte px do editor em
 * unidades do Minecraft. Estes "números mágicos" são calibração empírica e podem
 * ser reimportados junto do arquivo gerado para reconstruir a tela fielmente.
 */
export const exportConfig = {
  /** Fator de escala: px do editor -> unidades Minecraft (offset e size). */
  UI_SCALAR: 0.36,

  /** Escala aplicada ao font_scale_factor dos labels. */
  fontScalar: 1.6,

  /** Deslocamento base do texto (antes da escala). */
  fontOffsetX: 6,
  fontOffsetY: 6,

  /** Deslocamento do ícone dentro de um botão. */
  buttonImageOffsetX: 2,
  buttonImageOffsetY: 2,

  /** Nome da coleção usada pelos botões de formulário. */
  defaultCollectionName: "form_buttons",

  /** Correção vertical do texto por tipo de fonte. */
  getFontScaledOffsetY(fontSize: number, fontType: string): number {
    const doubleFontSize = 2 * fontSize;
    if (fontType === "MinecraftTen") return -1;
    return doubleFontSize - 3;
  },
} as const;

export type ExportConfig = typeof exportConfig;

/** Tipos de fonte válidos do Minecraft (para o seletor de propriedades). */
export const MINECRAFT_FONTS = [
  "MinecraftRegular",
  "MinecraftTen",
  "MinecraftBold",
  "MinecraftItalic",
  "MinecraftBoldItalic",
] as const;

export type MinecraftFont = (typeof MINECRAFT_FONTS)[number];
