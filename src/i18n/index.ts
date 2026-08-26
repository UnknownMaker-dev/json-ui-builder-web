/**
 * Tradução da interface.
 *
 * Sem biblioteca: são poucas centenas de chaves e nenhuma precisa de plural ou
 * formatação de data. `locale` é um ref, então `t()` chamado num template
 * reacende sozinho quando o idioma muda.
 */
import { ref } from "vue";
import { enUS } from "./en-US";
import { ptBR } from "./pt-BR";

export type Locale = "en-US" | "pt-BR";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "pt-BR", label: "Português (BR)", short: "PT" },
];

const dictionaries: Record<Locale, Record<string, string>> = {
  "en-US": enUS,
  "pt-BR": ptBR,
};

const STORAGE_KEY = "jsonui_locale";

/**
 * Escolha inicial: o que o usuário já escolheu antes; senão o idioma do
 * navegador, caindo em inglês. O site é público, então inglês é o padrão para
 * quem não é falante de português.
 */
function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en-US" || saved === "pt-BR") return saved;
  } catch {
    // Sem localStorage: segue para a detecção pelo navegador.
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  return nav?.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

export const locale = ref<Locale>(detect());

export function setLocale(next: Locale) {
  locale.value = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Preferência não persiste, mas a troca vale para esta sessão.
  }
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

if (typeof document !== "undefined") document.documentElement.lang = locale.value;

/**
 * Traduz uma chave. `params` substitui `{nome}` no texto.
 * Chave sem tradução volta como ela mesma — fica visível na tela em vez de
 * sumir, o que faz o buraco aparecer no primeiro teste.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[locale.value];
  let text = dict[key] ?? dictionaries["en-US"][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}
