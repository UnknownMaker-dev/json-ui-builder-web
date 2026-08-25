/**
 * Scripter: gera o addon (@minecraft/server + server-ui) que abre as telas
 * desenhadas no editor.
 *
 * O elo entre script e JSON UI é o TÍTULO do formulário: o script manda
 * `form.title("Custom UI")` e o `server_form.json` mostra a tela cujo nome está
 * no título (JSON-UI.md, seção 9). Por isso o nome da tela no editor é o
 * identificador de verdade, não um rótulo cosmético.
 */
import type { UIScreen } from "../types/screen.types";
import { sanitizeFlag } from "../types/screen.types";
import { collectFormButtons } from "./form-buttons";
import type { TextureResolver } from "./json-ui-exporter";

export interface ScriptOptions {
  /** Item que abre a primeira tela ao ser usado. */
  triggerItem: string;
  /** Converte texturas do editor em caminhos do pack (para os ícones). */
  resolveTexture?: TextureResolver;
}

/** Escapa uma string para caber entre aspas duplas no código gerado. */
const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

interface ScreenScriptData {
  flag: string;
  buttons: { text: string; icon?: string }[];
}

function buildScreenData(
  screens: UIScreen[],
  options: ScriptOptions,
): ScreenScriptData[] {
  return screens.map((screen) => {
    const buttons: ScreenScriptData["buttons"] = collectFormButtons(
      screen.elements,
    ).map((b) => ({
      text: b.text,
      icon:
        b.icon && options.resolveTexture ? options.resolveTexture(b.icon) : b.icon,
    }));

    // Um ActionForm sem nenhum botão não chega a abrir. Se a tela não tem
    // botões desenhados, entra um de reserva: ele não é desenhado pelo JSON UI
    // (nenhum controle aponta para esse índice), mas faz o formulário existir.
    if (buttons.length === 0) buttons.push({ text: "Fechar" });

    return { flag: sanitizeFlag(screen.name), buttons };
  });
}

function screensLiteral(data: ScreenScriptData[]): string {
  const entries = data.map((screen) => {
    const buttons = screen.buttons
      .map((b) =>
        b.icon
          ? `            { text: ${q(b.text)}, icon: ${q(b.icon)} },`
          : `            { text: ${q(b.text)} },`,
      )
      .join("\n");
    return `    ${q(screen.flag)}: {\n        buttons: [\n${buttons}\n        ],\n    },`;
  });
  return `{\n${entries.join("\n")}\n}`;
}

/** Gera o `main.js` / `main.ts` do behavior pack. */
export function generateScript(
  screens: UIScreen[],
  language: "ts" | "js",
  options: ScriptOptions,
): string {
  const data = buildScreenData(screens, options);
  const first = data[0]?.flag ?? "Custom UI";
  const ts = language === "ts";

  const playerType = ts ? ": Player" : "";
  const nameType = ts ? ": string" : "";
  const imports = ts
    ? `import { world, system, Player } from "@minecraft/server";`
    : `import { world, system } from "@minecraft/server";`;

  return `${imports}
import { ActionFormData } from "@minecraft/server-ui";

/**
 * Gerado por json-ui-builder-web.
 *
 * O TÍTULO do formulário é o que faz o resource pack escolher a tela.
 * Se você mudar um nome aqui, mude também o nome da tela no editor —
 * senão o jogo abre o formulário padrão em vez da sua tela.
 */

const TRIGGER_ITEM = ${q(options.triggerItem)};

/** A ordem dos botões TEM que bater com a ordem no editor (collection_index). */
const SCREENS = ${screensLiteral(data)};

function showScreen(player${playerType}, name${nameType}) {
    const screen = SCREENS[name];
    if (!screen) {
        console.warn("Tela desconhecida: " + name);
        return;
    }

    const form = new ActionFormData().title(name);
    for (const button of screen.buttons) {
        if (button.icon) form.button(button.text, button.icon);
        else form.button(button.text);
    }

    form.show(player).then((response) => {
        if (response.canceled) return;

        const clicked = screen.buttons[response.selection];
        player.sendMessage("§aClicou em: §f" + clicked.text);

        // Para abrir outra tela a partir de um botão:
        // if (clicked.text === "Loja") showScreen(player, "Loja");
    });
}

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack?.typeId !== TRIGGER_ITEM) return;
    const player = event.source;
    system.run(() => showScreen(player, ${q(first)}));
});
`;
}

/** Lista das telas com seus botões — usada pela pré-visualização na interface. */
export function describeScreens(
  screens: UIScreen[],
  options: ScriptOptions,
): ScreenScriptData[] {
  return buildScreenData(screens, options);
}
