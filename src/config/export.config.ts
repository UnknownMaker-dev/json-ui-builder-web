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

  /**
   * Tamanho do canvas do editor em px. A tela exportada vira um panel deste
   * tamanho (escalado), ancorado no centro — assim o desenho fica centralizado
   * em qualquer resolução em vez de grudado no canto da tela.
   */
  CANVAS_W: 800,
  CANVAS_H: 600,

  /** Layer da tela custom: acima do diálogo padrão do formulário. */
  SCREEN_LAYER: 100,

  /** Troca um nome de fonte antigo pelo equivalente válido. */
  normalizeFont(font: string | undefined): string {
    if (!font) return "default";
    const legacy: Record<string, string> = {
      MinecraftRegular: "default",
      MinecraftBold: "MinecraftSeven",
      MinecraftItalic: "default",
      MinecraftBoldItalic: "MinecraftSeven",
    };
    return legacy[font] ?? font;
  },

  /** Correção vertical do texto por tipo de fonte. */
  getFontScaledOffsetY(fontSize: number, fontType: string): number {
    const doubleFontSize = 2 * fontSize;
    if (fontType === "MinecraftTen") return -1;
    return doubleFontSize - 3;
  },
} as const;

export type ExportConfig = typeof exportConfig;

/**
 * Tipos de fonte que o JSON UI aceita de verdade (JSON-UI.md, seção 12).
 *
 * A lista antiga oferecia MinecraftRegular/Bold/Italic/BoldItalic, que não
 * existem: o jogo ignorava em silêncio e caía na fonte padrão.
 */
export const MINECRAFT_FONTS = [
  "default",
  "smooth",
  "rune",
  "MinecraftSeven",
  "MinecraftTen",
  "unicode",
] as const;

export type MinecraftFont = (typeof MINECRAFT_FONTS)[number];

