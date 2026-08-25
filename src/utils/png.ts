/**
 * Leitura mínima de PNG: só o cabeçalho IHDR, para descobrir largura e altura.
 *
 * O `base_size` do arquivo de nineslice precisa ser o tamanho REAL do PNG
 * (JSON-UI.md, seção 7). Como as texturas chegam como data URL ou como arquivo
 * do preset, a dimensão é lida aqui em vez de confiar no que o editor achava.
 */

import { assetUrl } from "./asset-url";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Extrai [largura, altura] do IHDR. Retorna null se não for um PNG válido. */
export function readPngSize(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 24) return null;
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (bytes[i] !== PNG_MAGIC[i]) return null;
  }
  // Após a assinatura (8 bytes) vem o chunk IHDR: tamanho(4) + "IHDR"(4) + w(4) + h(4)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (!width || !height) return null;
  return [width, height];
}

/** Converte uma data URL (`data:image/png;base64,...`) em bytes. */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const base64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Baixa qualquer URL (data: ou http) como bytes. */
export async function fetchBytes(url: string): Promise<Uint8Array> {
  if (url.startsWith("data:")) return dataUrlToBytes(url);
  const res = await fetch(assetUrl(url));
  if (!res.ok) throw new Error(`Falha ao ler ${url}: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
