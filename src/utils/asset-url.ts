/**
 * Resolve o caminho de um arquivo servido junto do site.
 *
 * As texturas ficam guardadas no projeto como `/presets/...` — caminho absoluto
 * e portátil. Quando o site é publicado numa subpasta (GitHub Pages serve em
 * /<repo>/), esse caminho sozinho aponta para a raiz do domínio e dá 404. A
 * conversão acontece só na hora de usar, para o arquivo de projeto continuar
 * abrindo em qualquer endereço.
 */
export function assetUrl(path: string | undefined): string {
  if (!path) return "";
  // data:, blob:, http(s): já são absolutos de verdade.
  if (/^[a-z]+:/i.test(path)) return path;
  if (!path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + path;
}
