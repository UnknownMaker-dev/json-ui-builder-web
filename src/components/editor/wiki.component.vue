<script setup lang="ts">
/**
 * Wiki/documentação embutida. Overlay com navegação por tópicos à esquerda e
 * conteúdo à direita. Ensina a usar as ferramentas e explica termos (bindings,
 * nineslice, namespace, etc.).
 */
import { ref } from "vue";
import {
  X,
  Rocket,
  Boxes,
  MousePointerClick,
  Image as ImageIcon,
  Link2,
  FileJson,
  BookMarked,
  Square,
  Layers,
  LayoutGrid,
  ScrollText,
  Type,
} from "lucide-vue-next";

defineEmits<{ (e: "close"): void }>();

const topics = [
  { id: "start", icon: Rocket, title: "Começando" },
  { id: "elements", icon: Boxes, title: "Elementos" },
  { id: "editor", icon: MousePointerClick, title: "Usando o editor" },
  { id: "textures", icon: ImageIcon, title: "Texturas & NineSlice" },
  { id: "bindings", icon: Link2, title: "Bindings" },
  { id: "export", icon: FileJson, title: "Exportar & Importar" },
  { id: "glossary", icon: BookMarked, title: "Glossário" },
];

const active = ref("start");
</script>

<template>
  <div class="wiki-overlay" @click.self="$emit('close')">
    <div class="wiki">
      <aside class="wiki-nav">
        <div class="wiki-brand"><BookMarked :size="18" /> Wiki</div>
        <button
          v-for="t in topics"
          :key="t.id"
          class="nav-item"
          :class="{ active: active === t.id }"
          @click="active = t.id"
        >
          <component :is="t.icon" :size="16" />
          {{ t.title }}
        </button>
      </aside>

      <div class="wiki-body">
        <button class="close" @click="$emit('close')"><X :size="18" /></button>

        <!-- COMEÇANDO -->
        <article v-if="active === 'start'">
          <h1>Bem-vindo ao JSON UI Builder</h1>
          <p class="lead">
            Este editor deixa você <b>desenhar telas do Minecraft Bedrock</b>
            arrastando componentes, e gera o código <b>JSON UI</b> pronto para
            usar no seu addon — sem escrever JSON à mão.
          </p>

          <h2>O fluxo em 4 passos</h2>
          <ol class="steps">
            <li><b>Adicione um container.</b> Clique em <i>Panel</i> na barra da esquerda. O primeiro elemento precisa ser um container (a raiz da tela).</li>
            <li><b>Monte dentro dele.</b> Com o painel selecionado, adicione botões, textos e imagens. Arraste no canvas e use os cantos para redimensionar.</li>
            <li><b>Dê aparência.</b> No painel da direita, escolha texturas, ajuste texto, fonte, cor e nineslice.</li>
            <li><b>Exporte.</b> No topo, clique em <i>Gerar JSON UI</i>, copie ou baixe o arquivo.</li>
          </ol>

          <div class="tip">
            💡 Dica: o painel da <b>esquerda</b> adiciona e lista elementos
            (Explorer); o da <b>direita</b> edita o elemento selecionado.
          </div>
        </article>

        <!-- ELEMENTOS -->
        <article v-if="active === 'elements'">
          <h1>Elementos</h1>
          <p class="lead">Cada componente que você adiciona vira um elemento do JSON UI. Existem <b>containers</b> (que guardam outros) e <b>folhas</b> (conteúdo visível).</p>

          <div class="el-grid">
            <div class="el"><Square :size="18" /><div><b>Panel</b><span>Container básico. Guarda outros elementos sobrepostos (como uma div).</span></div></div>
            <div class="el"><Layers :size="18" /><div><b>Stack Panel</b><span>Empilha os filhos em sequência (vertical ou horizontal), sem sobrepor.</span></div></div>
            <div class="el"><LayoutGrid :size="18" /><div><b>Collection Panel</b><span>Lista dinâmica ligada a uma <i>collection</i> (ex: botões de formulário).</span></div></div>
            <div class="el"><ScrollText :size="18" /><div><b>Scrolling Panel</b><span>Área com rolagem quando o conteúdo é maior que a caixa.</span></div></div>
            <div class="el"><ImageIcon :size="18" /><div><b>Image</b><span>Mostra uma textura. Suporta nineslice para esticar sem distorcer.</span></div></div>
            <div class="el"><MousePointerClick :size="18" /><div><b>Button</b><span>Botão clicável com texturas de estado (default, hover, pressed).</span></div></div>
            <div class="el"><Type :size="18" /><div><b>Label</b><span>Texto. A caixa se ajusta ao tamanho da fonte automaticamente.</span></div></div>
          </div>

          <div class="tip">Só é possível colocar filhos dentro de <b>containers</b> (Panel, Stack, Collection, Scrolling). Botões, imagens e textos são folhas.</div>
        </article>

        <!-- EDITOR -->
        <article v-if="active === 'editor'">
          <h1>Usando o editor</h1>

          <h2>Selecionar, mover e redimensionar</h2>
          <ul class="bullets">
            <li><b>Selecionar:</b> clique no elemento no canvas ou no Explorer (esquerda).</li>
            <li><b>Mover:</b> arraste o elemento. Ele não sai das bordas do container pai.</li>
            <li><b>Redimensionar:</b> arraste um dos 8 quadradinhos ao redor do elemento selecionado.</li>
          </ul>

          <h2>Atalhos de teclado</h2>
          <div class="shortcuts">
            <div><kbd>Del</kbd> Deletar selecionado</div>
            <div><kbd>Ctrl</kbd>+<kbd>Z</kbd> Desfazer</div>
            <div><kbd>Ctrl</kbd>+<kbd>Y</kbd> Refazer</div>
            <div><kbd>Ctrl</kbd>+<kbd>C</kbd> Copiar</div>
            <div><kbd>Ctrl</kbd>+<kbd>V</kbd> Colar</div>
          </div>

          <h2>Explorer</h2>
          <p>A árvore da esquerda mostra a hierarquia (pais e filhos). Clique para selecionar; itens aninhados aparecem indentados.</p>

          <div class="tip">Ao adicionar um elemento com um container selecionado, ele entra <b>dentro</b> desse container.</div>
        </article>

        <!-- TEXTURAS -->
        <article v-if="active === 'textures'">
          <h1>Texturas & NineSlice</h1>
          <p class="lead">Painéis, imagens e botões usam texturas do Minecraft. Você escolhe pelo seletor visual ou envia as suas.</p>

          <h2>Escolhendo texturas</h2>
          <p>No painel da direita, clique no quadro de textura para abrir o seletor. Navegue pelos presets (estilos ore-ui), busque por nome, ou envie um <b>PNG</b> (com um <b>JSON</b> de nineslice opcional).</p>

          <h2>O que é NineSlice?</h2>
          <p>
            Uma textura pequena precisa esticar para preencher uma caixa grande —
            mas esticar tudo distorce as bordas. O <b>nineslice</b> divide a imagem
            em <b>9 pedaços</b>: os 4 cantos ficam fixos, as 4 bordas esticam só
            num sentido, e o miolo estica nos dois. Resultado: bordas nítidas em
            qualquer tamanho.
          </p>
          <div class="nine-demo">
            <div>canto</div><div>borda ↔</div><div>canto</div>
            <div>borda ↕</div><div class="mid">miolo</div><div>borda ↕</div>
            <div>canto</div><div>borda ↔</div><div>canto</div>
          </div>
          <p>O valor <b>NineSlice</b> no painel define a espessura (px) dessas bordas. O selo <span class="badge9">9</span> no seletor indica texturas com nineslice.</p>
        </article>

        <!-- BINDINGS -->
        <article v-if="active === 'bindings'">
          <h1>Bindings</h1>
          <p class="lead">Bindings são o jeito do JSON UI ser <b>dinâmico</b>: em vez de um valor fixo, a propriedade é <b>ligada</b> a um dado que o jogo fornece em tempo real.</p>

          <h2>Pra que servem?</h2>
          <ul class="bullets">
            <li>Mostrar um <b>texto que muda</b> (o nome do jogador, uma pontuação).</li>
            <li><b>Esconder ou mostrar</b> um elemento conforme uma condição.</li>
            <li>Preencher uma <b>lista</b> (collection) com itens gerados pelo jogo — como os botões de um formulário.</li>
          </ul>

          <div class="analogy">
            <b>Analogia:</b> um valor fixo é uma etiqueta escrita à caneta. Um
            binding é um visor digital: o jogo atualiza o número e a UI mostra
            sozinha.
          </div>

          <h2>Os tipos (binding_type)</h2>
          <ul class="bullets">
            <li><b>view</b> — reage a outro elemento ou a uma expressão da própria tela (ex: "fique visível se o texto não estiver vazio").</li>
            <li><b>global</b> — lê um dado global do jogo (plataforma, input, etc.).</li>
            <li><b>collection</b> — lê o dado de um item de uma lista (usado com Collection Panel).</li>
          </ul>

          <h2>Como usar no painel</h2>
          <ol class="steps">
            <li>Selecione o elemento e abra a seção <b>Bindings</b> (no fim do painel direito).</li>
            <li>Clique em <b>+ Adicionar</b>. Um cartão de binding aparece.</li>
            <li>Escolha o <b>tipo</b> e preencha os campos que fizerem sentido:</li>
          </ol>
          <table class="fields">
            <tr><td>binding_name</td><td>o dado de origem a ler (ex: <code>#form_button_text</code>).</td></tr>
            <tr><td>binding_name_override</td><td>renomeia o dado para a propriedade que vai recebê-lo (ex: <code>#text</code>).</td></tr>
            <tr><td>binding_collection_name</td><td>o nome da coleção (para o tipo <i>collection</i>).</td></tr>
            <tr><td>source_property_name</td><td>a propriedade/expressão de origem observada (tipo <i>view</i>).</td></tr>
            <tr><td>target_property_name</td><td>a propriedade que recebe o valor (ex: <code>#visible</code>).</td></tr>
          </table>

          <h2>Exemplo: esconder um texto quando estiver vazio</h2>
          <pre>binding_type: <span class="s">view</span>
source_property_name: <span class="s">(not (#form_button_text = ''))</span>
target_property_name: <span class="s">#visible</span></pre>
          <p>Lê a expressão "o texto não está vazio" e joga o resultado em <code>#visible</code> — se vazio, o elemento some.</p>

          <div class="tip">Não precisa de bindings para uma UI simples. Comece sem eles; adicione quando quiser conteúdo dinâmico.</div>
        </article>

        <!-- EXPORT -->
        <article v-if="active === 'export'">
          <h1>Exportar & Importar</h1>

          <h2>Namespace</h2>
          <p>No topo você define o <b>namespace</b> — o identificador único do seu arquivo JSON UI. Use um nome sem espaços (ex: <code>meu_form</code>).</p>

          <h2>As ações do topo</h2>
          <ul class="bullets">
            <li><b>Gerar JSON UI</b> — cria o arquivo <code>.json</code> da tela. Copie ou baixe.</li>
            <li><b>TS / JS</b> — gera o script do addon (<code>@minecraft/server-ui</code>) com um <code>form.button()</code> por botão desenhado.</li>
            <li><b>server_form</b> — gera o <code>server_form.json</code> (o wrapper de diálogo).</li>
            <li><b>Importar</b> — carrega um <code>.json</code> gerado aqui e reconstrói a tela no editor.</li>
          </ul>

          <div class="tip">O arquivo exportado embute um bloco <code>config</code> com os fatores de escala — é o que permite reimportar mantendo posições e tamanhos.</div>
        </article>

        <!-- GLOSSÁRIO -->
        <article v-if="active === 'glossary'">
          <h1>Glossário</h1>
          <dl class="glossary">
            <dt>namespace</dt><dd>Identificador único do arquivo de UI. Elementos são referenciados como <code>@namespace.elemento</code>.</dd>
            <dt>control / controls</dt><dd>Um elemento filho / a lista de filhos de um container.</dd>
            <dt>anchor_from / anchor_to</dt><dd>Pontos de ancoragem (ex: <code>top_left</code>) que definem a partir de onde a posição é medida.</dd>
            <dt>offset</dt><dd>Deslocamento (x, y) a partir da âncora. Aqui é derivado da posição no canvas.</dd>
            <dt>size</dt><dd>Tamanho do elemento. Aceita px, porcentagem, <code>fill</code>, etc.</dd>
            <dt>nineslice</dt><dd>Técnica de esticar texturas mantendo os cantos fixos (ver a seção Texturas).</dd>
            <dt>collection</dt><dd>Uma lista de dados fornecida pelo jogo (ex: <code>form_buttons</code>), usada com Collection Panel.</dd>
            <dt>binding</dt><dd>Ligação de uma propriedade a um dado dinâmico (ver a seção Bindings).</dd>
            <dt>font_scale_factor</dt><dd>Multiplicador do tamanho da fonte. No label, é definido pelo slider "Tam. fonte".</dd>
            <dt>UI_SCALAR</dt><dd>Fator interno (0.36) que converte os pixels do editor para as unidades do Minecraft na exportação.</dd>
          </dl>
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
