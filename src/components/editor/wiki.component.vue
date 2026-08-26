<script setup lang="ts">
/**
 * Wiki embutida.
 *
 * O texto dos artigos vem de módulos por idioma, como HTML, e é injetado com
 * v-html — conteúdo nosso, estático, sem entrada de usuário. A grade de
 * elementos é a exceção: ela é montada a partir do registro de tipos, para não
 * sair de sincronia quando um tipo novo entrar no editor.
 */
import { ref, computed } from "vue";
import {
  X,
  BookMarked,
  Rocket,
  Boxes,
  MousePointerClick,
  Image as ImageIcon,
  Link2,
  FileJson,
} from "lucide-vue-next";
import { t, locale } from "../../i18n";
import { wikiPtBR } from "../../i18n/wiki.pt-BR";
import { wikiEnUS } from "../../i18n/wiki.en-US";
import { ELEMENT_DEFINITIONS, type UIElementType } from "../../types/element.types";

defineEmits<{ (e: "close"): void }>();

const topics = [
  { id: "start", icon: Rocket, key: "wiki.nav.start" },
  { id: "elements", icon: Boxes, key: "wiki.nav.elements" },
  { id: "editor", icon: MousePointerClick, key: "wiki.nav.editor" },
  { id: "textures", icon: ImageIcon, key: "wiki.nav.textures" },
  { id: "bindings", icon: Link2, key: "wiki.nav.bindings" },
  { id: "export", icon: FileJson, key: "wiki.nav.export" },
  { id: "glossary", icon: BookMarked, key: "wiki.nav.glossary" },
];

const active = ref("start");

const articles = computed(() => (locale.value === "pt-BR" ? wikiPtBR : wikiEnUS));

/** O artigo dos elementos é partido no marcador para a grade entrar no meio. */
const MARKER = "<!--ELEMENT-GRID-->";
const parts = computed(() => {
  const html = articles.value[active.value] ?? "";
  const i = html.indexOf(MARKER);
  return i === -1
    ? { before: html, after: "" }
    : { before: html.slice(0, i), after: html.slice(i + MARKER.length) };
});
const hasGrid = computed(() => (articles.value[active.value] ?? "").includes(MARKER));

const elementTypes = Object.keys(ELEMENT_DEFINITIONS) as UIElementType[];
</script>

<template>
  <div class="wiki-overlay" @click.self="$emit('close')">
    <div class="wiki">
      <aside class="wiki-nav">
        <div class="wiki-brand"><BookMarked :size="18" /> {{ t("toolbar.wiki") }}</div>
        <button
          v-for="topic in topics"
          :key="topic.id"
          class="nav-item"
          :class="{ active: active === topic.id }"
          @click="active = topic.id"
        >
          <component :is="topic.icon" :size="16" />
          {{ t(topic.key) }}
        </button>
      </aside>

      <div class="wiki-body">
        <button class="close" @click="$emit('close')"><X :size="18" /></button>

        <article>
          <div v-html="parts.before"></div>

          <div v-if="hasGrid" class="el-grid">
            <div v-for="type in elementTypes" :key="type" class="el">
              <component :is="ELEMENT_DEFINITIONS[type].icon" :size="18" />
              <div>
                <b>{{ ELEMENT_DEFINITIONS[type].label }}</b>
                <span>{{ t("wiki.el." + type) }}</span>
              </div>
            </div>
          </div>

          <div v-html="parts.after"></div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wiki-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 14, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.wiki {
  width: 980px;
  max-width: 95vw;
  height: 86vh;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  overflow: hidden;
}
.wiki-nav {
  width: 232px;
  flex-shrink: 0;
  background: var(--surface-2);
  border-right: 1px solid var(--border);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.wiki-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  padding: 4px 8px 14px;
}
.wiki-brand :deep(svg) {
  color: var(--accent);
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  background: transparent;
  border: none;
  color: var(--text-soft);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.nav-item.active {
  background: var(--accent-soft);
  color: var(--text);
  box-shadow: inset 2px 0 0 var(--accent);
}
.nav-item.active :deep(svg) {
  color: var(--accent);
}
.wiki-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px 48px;
  position: relative;
}
.close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-soft);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.close:hover {
  background: var(--surface-hover);
  color: var(--text);
}
article {
  max-width: 660px;
}
h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}
h2 {
  font-size: 15px;
  font-weight: 600;
  margin: 28px 0 10px;
  color: var(--text);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-soft);
}
p {
  color: var(--text-soft);
  line-height: 1.65;
  margin-bottom: 12px;
}
.lead {
  font-size: 15.5px;
  color: var(--text);
}
b {
  color: var(--text);
  font-weight: 600;
}
i {
  color: var(--text);
  font-style: italic;
}
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--surface-3);
  padding: 1px 6px;
  border-radius: 4px;
  color: #c7cbff;
}
.steps {
  counter-reset: st;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 4px 0 8px;
}
.steps li {
  counter-increment: st;
  position: relative;
  padding-left: 38px;
  color: var(--text-soft);
  line-height: 1.6;
}
.steps li::before {
  content: counter(st);
  position: absolute;
  left: 0;
  top: -1px;
  width: 26px;
  height: 26px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  font-family: var(--font-mono);
}
.bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.bullets li {
  position: relative;
  padding-left: 18px;
  color: var(--text-soft);
  line-height: 1.6;
}
.bullets li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
.tip,
.analogy {
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: 12px 15px;
  color: var(--text-soft);
  font-size: 13.5px;
  line-height: 1.6;
  margin: 18px 0;
}
.el-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 8px 0;
}
.el {
  display: flex;
  gap: 11px;
  padding: 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
}
.el :deep(svg) {
  color: var(--accent);
  flex-shrink: 0;
  margin-top: 2px;
}
.el b {
  display: block;
  font-size: 13.5px;
  margin-bottom: 2px;
}
.el span {
  font-size: 12px;
  color: var(--text-soft);
  line-height: 1.5;
}
.shortcuts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.shortcuts div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-soft);
  font-size: 13px;
}
kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 2px 7px;
  color: var(--text);
}
.nine-demo {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  grid-template-rows: 40px 1fr 40px;
  gap: 4px;
  width: 260px;
  height: 180px;
  margin: 10px 0 14px;
  font-family: var(--font-mono);
  font-size: 10px;
}
.nine-demo div {
  display: grid;
  place-items: center;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-faint);
  text-align: center;
}
.nine-demo .mid {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}
.badge9 {
  display: inline-grid;
  place-items: center;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.fields,
.glossary {
  width: 100%;
  margin: 8px 0 4px;
}
.fields {
  border-collapse: collapse;
  font-size: 13px;
}
.fields td {
  padding: 9px 12px;
  border-top: 1px solid var(--border-soft);
  vertical-align: top;
  color: var(--text-soft);
  line-height: 1.5;
}
.fields td:first-child {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  white-space: nowrap;
  width: 1%;
}
pre {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-soft);
  overflow-x: auto;
  margin: 10px 0;
}
pre .s {
  color: #c7cbff;
}
.glossary dt {
  font-weight: 700;
  color: var(--text);
  font-size: 13.5px;
  margin-top: 14px;
}
.glossary dd {
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
  margin: 3px 0 0;
}
</style>
