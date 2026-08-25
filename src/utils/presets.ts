/**
 * Sistema de presets de textura.
 *
 * Os presets embarcados ficam em `public/presets/textures/<style>/` com:
 *   - <img>.png            (a textura)
 *   - <img>.json           (dados de nineslice: nineslice_size / base_size)
 *   - mapping.json         ({ data: [{ image, nineslice }] })
 *
 * Além dos embarcados, o usuário pode subir texturas próprias (PNG + JSON de
 * nineslice), guardadas localmente no navegador (localStorage, base64).
 */

import { assetUrl } from "./asset-url";

/** Estilos embarcados conhecidos (pastas em public/presets/textures). */
export const BUILTIN_PRESET_STYLES = [
  "other_ore-ui_style",
  "red_ore-ui_style",
  "pink_ore-ui_style",
  "eternal_ore-ui_style",
  "turquoise_ore-ui_style",
] as const;

export interface TextureEntry {
  /** Nome de exibição (nome do arquivo sem extensão). */
  name: string;
  /** URL utilizável em <img src> / fetch (ex: /presets/textures/.../x.png ou data:). */
  url: string;
  /** Usa nineslice? */
  nineslice: boolean;
  /** Estilo/grupo a que pertence. */
  style: string;
  /** true se for textura enviada pelo usuário. */
  custom?: boolean;
}

interface MappingFile {
  data: { image: string; nineslice: boolean }[];
}

const cache = new Map<string, TextureEntry[]>();

/** Carrega as texturas de um estilo embarcado (via fetch do mapping.json). */
export async function loadPresetStyle(style: string): Promise<TextureEntry[]> {
  if (cache.has(style)) return cache.get(style)!;
  const base = `/presets/textures/${style}`;
  try {
    const res = await fetch(assetUrl(`${base}/mapping.json`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mapping = (await res.json()) as MappingFile;
    const entries: TextureEntry[] = (mapping.data ?? []).map((d) => ({
      name: d.image,
      url: `${base}/${d.image}.png`,
      nineslice: !!d.nineslice,
      style,
    }));
    cache.set(style, entries);
    return entries;
  } catch (e) {
    console.warn(`Falha ao carregar preset "${style}":`, e);
    cache.set(style, []);
    return [];
  }
}

/** Carrega todos os estilos embarcados. */
export async function loadAllPresets(): Promise<Record<string, TextureEntry[]>> {
  const result: Record<string, TextureEntry[]> = {};
  await Promise.all(
    BUILTIN_PRESET_STYLES.map(async (style) => {
      result[style] = await loadPresetStyle(style);
    }),
  );
  return result;
}

/** Busca os dados de nineslice (json ao lado do png) de uma textura embarcada. */
export async function loadNinesliceData(
  entry: TextureEntry,
): Promise<{ nineslice_size: number | number[]; base_size: [number, number] } | null> {
  if (!entry.nineslice) return null;
  if (entry.custom) {
    const stored = getCustomTextures().find((t) => t.url === entry.url);
    return stored?.ninesliceData ?? null;
  }
  const jsonUrl = entry.url.replace(/\.png$/i, ".json");
  try {
    const res = await fetch(assetUrl(jsonUrl));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Busca o nineslice de uma textura por URL, seja ela preset embarcado ou envio
 * do usuário. É o dado oficial da arte — tem prioridade sobre o que o editor
 * tiver guardado no elemento.
 */
export async function loadNinesliceFor(
  url: string,
): Promise<{ nineslice_size: number | number[]; base_size?: unknown } | null> {
  const stored = getCustomTextures().find((t) => t.url === url);
  if (stored) return stored.ninesliceData ?? null;
  if (url.startsWith("data:")) return null;
  try {
    const res = await fetch(assetUrl(url.replace(/\.png$/i, ".json")));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Texturas enviadas pelo usuário (armazenadas localmente, sem backend)
// ---------------------------------------------------------------------------

const CUSTOM_KEY = "jsonui_custom_textures";

interface StoredCustomTexture extends TextureEntry {
  ninesliceData?: {
    nineslice_size: number | number[];
    base_size: [number, number];
  } | null;
}

export function getCustomTextures(): StoredCustomTexture[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustomTextures(list: StoredCustomTexture[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Registra uma textura enviada pelo usuário. `png` é obrigatório; `json` é
 * opcional (dados de nineslice). Guarda tudo em base64 no localStorage.
 */
export async function addCustomTexture(
  png: File,
  json?: File | null,
): Promise<TextureEntry> {
  const url = await readFileAsDataUrl(png);
  let ninesliceData = null;
  if (json) {
    try {
      ninesliceData = JSON.parse(await readFileAsText(json));
    } catch {
      ninesliceData = null;
    }
  }
  const entry: StoredCustomTexture = {
    name: png.name.replace(/\.png$/i, ""),
    url,
    nineslice: !!ninesliceData,
    style: "Minhas Texturas",
    custom: true,
    ninesliceData,
  };
  const list = getCustomTextures();
  list.push(entry);
  saveCustomTextures(list);
  return entry;
}

export function removeCustomTexture(url: string): void {
  saveCustomTextures(getCustomTextures().filter((t) => t.url !== url));
}
