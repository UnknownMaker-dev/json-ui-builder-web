/**
 * Scripter: gera o código do addon (@minecraft/server + server-ui) que exibe o
 * formulário com os botões desenhados no editor. Portado de
 * scripter/generator.ts + scriptFormText.ts do original.
 *
 * Cada botão da árvore vira uma chamada `form.button(text, texture)`. A ordem
 * segue a ordem dos botões na árvore (profundidade primeiro).
 */
import type { UIElement } from "../types/element.types";
import { serverFormTemplate } from "./json-ui-templates";

export interface FormButtonData {
  texture: string;
  text: string;
}

/** Prefixo invisível no título usado para casar o form com o JSON UI custom. */
const DEFAULT_TITLE_FLAG = "";

/** Coleta todos os botões da árvore, em ordem (pré-ordem). */
export function collectButtons(elements: UIElement[]): FormButtonData[] {
  const out: FormButtonData[] = [];
  const walk = (nodes: UIElement[]) => {
    for (const el of nodes) {
      if (el.type === "button") {
        const tex = el.properties.defaultTexture ?? "ui/blank";
        out.push({
          texture: normalizeTexture(tex),
          text: el.properties.text ?? el.name ?? "Label",
        });
      }
      if (el.children.length) walk(el.children);
    }
  };
  walk(elements);
  return out;
}

function normalizeTexture(path: string): string {
  let t = path.replace(/^\/+/, "").replace(/\.png$/i, "");
  if (!t.startsWith("textures/")) t = `textures/${t}`;
  return t;
}

export function buttonDataToJavaScript(
  buttons: FormButtonData[],
  titleFlag = DEFAULT_TITLE_FLAG,
): string {
  return `
import { system, world } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

function showCustomForm(player) {
    const form = new ActionFormData();
    form.title("${titleFlag}Example Title");

${buttons.map((b) => `    form.button("${b.text}", "${b.texture}");`).join("\n")}

    form.show(player).then(r => {

    })
}

world.beforeEvents.itemUse.subscribe(ev => {
    const item = ev.itemStack;
    const player = ev.source;

    if (item.typeId == 'minecraft:stick') {
        system.run(() => {
            showCustomForm(player);
        })
    }
})
`;
}

export function buttonDataToTypeScript(
  buttons: FormButtonData[],
  titleFlag = DEFAULT_TITLE_FLAG,
): string {
  return `
import { system, world, Player } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

function showCustomForm(player: Player) {
    const form = new ActionFormData();
    form.title("${titleFlag}Example Title");

${buttons.map((b) => `    form.button("${b.text}", "${b.texture}");`).join("\n")}

    form.show(player).then(r => {

    })
}

world.beforeEvents.itemUse.subscribe(ev => {
    const item = ev.itemStack;
    const player = ev.source;

    if (item.typeId == 'minecraft:stick') {
        system.run(() => {
            showCustomForm(player);
        })
    }
})
`;
}

/** Gera o script no idioma pedido a partir da árvore de elementos. */
export function generateScript(
  elements: UIElement[],
  language: "ts" | "js",
): string {
  const buttons = collectButtons(elements);
  return language === "ts"
    ? buttonDataToTypeScript(buttons)
    : buttonDataToJavaScript(buttons);
}

/** Reexporta o gerador do server_form.json. */
export function generateServerForm(namespace: string, titleFlag = DEFAULT_TITLE_FLAG): string {
  return serverFormTemplate(namespace, titleFlag);
}
