/**
 * Salvar e abrir o projeto inteiro num arquivo .json.
 *
 * Diferente do export de JSON UI, que é de mão única (o arquivo do Minecraft
 * perde a estrutura do editor), este formato guarda a árvore como ela é: todas
 * as telas, com nome, namespace e elementos. É o que permite parar o trabalho e
 * retomar depois, ou passar uma tela pronta para outra pessoa.
 */
import type { UIScreen } from "../types/screen.types";
import { toNamespace } from "../types/screen.types";
import type { UIElement } from "../types/element.types";

/** Sobe quando o formato mudar de um jeito que exija conversão. */
export const PROJECT_FORMAT = 1;

export interface ProjectFile {
  format: number;
  packName: string;
  triggerItem: string;
  scriptApi: string;
  screens: UIScreen[];
}

export interface LoadResult {
  ok: boolean;
  project?: ProjectFile;
  error?: string;
}

export function serializeProject(data: Omit<ProjectFile, "format">): string {
  const project: ProjectFile = { format: PROJECT_FORMAT, ...data };
  return JSON.stringify(project, null, 2);
}

/** Garante que todo elemento tem os campos que o editor espera. */
function normalizeElement(raw: any): UIElement | null {
  if (!raw || typeof raw !== "object" || typeof raw.type !== "string") return null;
  const children = Array.isArray(raw.children)
    ? (raw.children.map(normalizeElement).filter(Boolean) as UIElement[])
    : [];
  return {
    id: typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
    type: raw.type,
    name: typeof raw.name === "string" ? raw.name : raw.type,
    properties: {
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      ...(raw.properties ?? {}),
    },
    children,
  };
}

export function parseProject(text: string): LoadResult {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: "arquivo não é um JSON válido" };
  }

  if (!Array.isArray(raw?.screens) || raw.screens.length === 0) {
    return { ok: false, error: "não encontrei nenhuma tela neste arquivo" };
  }
  if (typeof raw.format === "number" && raw.format > PROJECT_FORMAT) {
    return {
      ok: false,
      error: `arquivo salvo numa versão mais nova do editor (formato ${raw.format})`,
    };
  }

  const screens: UIScreen[] = raw.screens.map((s: any, i: number) => {
    const name = typeof s?.name === "string" && s.name.trim() ? s.name : `Tela ${i + 1}`;
    return {
      id: typeof s?.id === "string" ? s.id : crypto.randomUUID(),
      name,
      namespace:
        typeof s?.namespace === "string" && s.namespace ? s.namespace : toNamespace(name),
      elements: Array.isArray(s?.elements)
        ? (s.elements.map(normalizeElement).filter(Boolean) as UIElement[])
        : [],
      selectedElementId: null,
    };
  });

  return {
    ok: true,
    project: {
      format: typeof raw.format === "number" ? raw.format : PROJECT_FORMAT,
      packName: typeof raw.packName === "string" ? raw.packName : "Meu Pack de UI",
      triggerItem:
        typeof raw.triggerItem === "string" ? raw.triggerItem : "minecraft:stick",
      scriptApi: raw.scriptApi === "1.x" ? "1.x" : "2.x",
      screens,
    },
  };
}
