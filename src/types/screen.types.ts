/**
 * Modelo de "tela" (aba) do editor.
 *
 * Uma sessão pode conter várias telas. Cada uma vira UM arquivo JSON UI dentro
 * do resource pack, e é aberta no jogo pelo `name` — que o script envia como
 * título do formulário e o `server_form.json` usa para rotear (o truque da
 * subtração de string descrito no JSON-UI.md, seção 9).
 */
import type { UIElement } from "./element.types";

export interface UIScreen {
  id: string;
  /**
   * Nome amigável da tela, ex. "Custom UI". É o identificador que o script
   * manda em `form.title(...)` e o que faz o JSON UI decidir qual tela mostrar.
   */
  name: string;
  /** Namespace do arquivo JSON UI gerado (derivado do nome, editável). */
  namespace: string;
  /** Árvore de elementos desta tela. */
  elements: UIElement[];
  /** Item selecionado nesta tela (preservado ao trocar de aba). */
  selectedElementId: string | null;
}

/**
 * Converte um nome de tela num namespace válido de JSON UI.
 * O namespace não aceita espaço nem acento; o nome de exibição aceita.
 */
export function toNamespace(name: string): string {
  const ns = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ns || "custom_ui";
}

/**
 * Limpa o nome da tela para uso dentro de uma expressão de binding.
 * A aspa simples fecharia a string do `source_property_name`, então some.
 */
export function sanitizeFlag(name: string): string {
  return name.replace(/['"\\]/g, "").trim();
}
