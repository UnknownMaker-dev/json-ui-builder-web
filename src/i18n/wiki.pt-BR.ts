/**
 * Conteúdo da wiki embutida, em português.
 *
 * HTML solto em vez de template: o texto muda por idioma e não tem lógica
 * nenhuma. A grade de elementos é a exceção — ela é montada pelo componente a
 * partir do registro de tipos, para não sair de sincronia quando um tipo novo
 * aparecer.
 */
export const wikiPtBR: Record<string, string> = {
  start: `<h1>Bem-vindo ao JSON UI Builder</h1>
<p class="lead">
  Este editor deixa você <b>desenhar telas do Minecraft Bedrock</b> arrastando
  componentes, e entrega um addon pronto para instalar — sem escrever JSON à mão.
</p>

<h2>O fluxo em 4 passos</h2>
<ol class="steps">
  <li><b>Adicione um container.</b> Clique em <i>Panel</i> na barra da esquerda. O primeiro elemento precisa ser um container.</li>
  <li><b>Monte dentro dele.</b> Com o painel selecionado, adicione botões, textos e imagens. Arraste no canvas e use os cantos para redimensionar.</li>
  <li><b>Dê aparência.</b> No painel da direita, escolha texturas, ajuste texto, fonte, cor e nineslice.</li>
  <li><b>Baixe o pacote.</b> No topo, clique em <i>Baixar pacote</i> e instale o <code>.mcaddon</code> no jogo.</li>
</ol>

<div class="tip">
  💡 Cada <b>aba</b> é uma tela, e o nome dela não é enfeite: é o que o script
  manda no título do formulário para o jogo saber qual tela mostrar.
</div>
`,

  elements: `<h1>Elementos</h1>
<p class="lead">Cada componente que você adiciona vira um elemento do JSON UI. Existem <b>containers</b> (que guardam outros) e <b>folhas</b> (conteúdo visível).</p>

<!--ELEMENT-GRID-->

<div class="tip">Só é possível colocar filhos dentro de <b>containers</b>. Botões e textos são folhas.</div>
`,

  editor: `<h1>Usando o editor</h1>

<h2>Selecionar, mover e redimensionar</h2>
<ul class="bullets">
  <li><b>Selecionar:</b> clique no elemento no canvas ou no Explorer.</li>
  <li><b>Mover:</b> arraste, ou use as <b>setas</b> (com <kbd>Shift</kbd> o passo vira 10px). O elemento não sai das bordas do pai.</li>
  <li><b>Redimensionar:</b> arraste um dos 8 quadradinhos. <kbd>Shift</kbd> <b>mantém a proporção</b>, <kbd>Alt</kbd> redimensiona <b>a partir do centro</b>.</li>
</ul>

<h2>Atalhos de teclado</h2>
<div class="shortcuts">
  <div><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Mover selecionado</div>
  <div><kbd>Shift</kbd>+setas Passo de 10px</div>
  <div><kbd>Del</kbd> Deletar selecionado</div>
  <div><kbd>Ctrl</kbd>+<kbd>Z</kbd> Desfazer</div>
  <div><kbd>Ctrl</kbd>+<kbd>Y</kbd> Refazer</div>
  <div><kbd>Ctrl</kbd>+<kbd>C</kbd> Copiar</div>
  <div><kbd>Ctrl</kbd>+<kbd>V</kbd> Colar</div>
  <div><kbd>Ctrl</kbd>+roda Zoom do canvas</div>
</div>

<h2>Explorer</h2>
<p>A árvore da esquerda mostra a hierarquia. <b>Arraste</b> para reordenar ou trocar de pai: solte no <b>miolo</b> de um container para entrar nele, nas <b>bordas</b> para inserir antes ou depois, e na área tracejada embaixo da árvore para <b>tirar do container</b>.</p>

<h2>Stack Panel</h2>
<p>Um stack panel posiciona os filhos sozinho, então X e Y ficam desabilitados dentro dele. Quem manda são <b>Alinhar na pilha</b> (no filho), <b>Distribuir os filhos</b>, <b>Espaçamento</b> e <b>Recuo interno</b> (na pilha).</p>
<div class="tip">Nas setas: no eixo da pilha elas <b>reordenam</b>; no outro eixo, mudam o <b>alinhamento</b>.</div>
`,

  textures: `<h1>Texturas & NineSlice</h1>
<p class="lead">Painéis, imagens e botões usam texturas. Você escolhe pelo seletor visual ou envia as suas.</p>

<h2>Escolhendo texturas</h2>
<p>No painel da direita, clique no quadro de textura para abrir o seletor. Navegue pelos presets, busque por nome, ou envie um <b>PNG</b> (com um <b>JSON</b> de nineslice opcional). Para um fundo, o botão <b>Importar imagem de fundo</b> na barra da esquerda já cria o elemento atrás dos outros.</p>

<h2>O que é NineSlice?</h2>
<p>
  Uma textura pequena precisa esticar para preencher uma caixa grande — mas
  esticar tudo distorce as bordas. O <b>nineslice</b> divide a imagem em
  <b>9 pedaços</b>: os 4 cantos ficam fixos, as 4 bordas esticam só num sentido,
  e o miolo estica nos dois. Resultado: bordas nítidas em qualquer tamanho.
</p>
<div class="nine-demo">
  <div>canto</div><div>borda ↔</div><div>canto</div>
  <div>borda ↕</div><div class="mid">miolo</div><div>borda ↕</div>
  <div>canto</div><div>borda ↔</div><div>canto</div>
</div>
<p>Escolher uma textura do seletor adota também o nineslice que vem com ela — é o dado da própria arte, e costuma ter bordas diferentes em cada lado.</p>
<div class="tip">Borda maior que a própria imagem não deixa miolo para esticar. Nesse caso a exportação descarta o nineslice e avisa, em vez de gerar borrão no jogo.</div>
`,

  bindings: `<h1>Bindings</h1>
<p class="lead">Bindings são o jeito do JSON UI ser <b>dinâmico</b>: em vez de um valor fixo, a propriedade é <b>ligada</b> a um dado que o jogo fornece em tempo real.</p>

<h2>Pra que servem?</h2>
<ul class="bullets">
  <li>Mostrar um <b>texto que muda</b> (o nome do jogador, uma pontuação).</li>
  <li><b>Esconder ou mostrar</b> um elemento conforme uma condição.</li>
  <li>Preencher uma <b>lista</b> com itens gerados pelo jogo — como os botões de um formulário.</li>
</ul>

<div class="analogy">
  <b>Analogia:</b> um valor fixo é uma etiqueta escrita à caneta. Um binding é um
  visor digital: o jogo atualiza o número e a UI mostra sozinha.
</div>

<h2>Os tipos (binding_type)</h2>
<ul class="bullets">
  <li><b>view</b> — reage a outro elemento ou a uma expressão da própria tela.</li>
  <li><b>global</b> — lê um dado global do jogo.</li>
  <li><b>collection</b> — lê o dado de um item de uma lista.</li>
</ul>

<h2>Como usar no painel</h2>
<ol class="steps">
  <li>Selecione o elemento e abra a seção <b>Bindings</b>, no fim do painel direito.</li>
  <li>Clique em <b>Adicionar</b>. Um cartão de binding aparece.</li>
  <li>Escolha o <b>tipo</b> e preencha os campos que fizerem sentido:</li>
</ol>
<table class="fields">
  <tbody>
    <tr><td>binding_name</td><td>o dado de origem a ler (ex: <code>#form_button_text</code>).</td></tr>
    <tr><td>binding_name_override</td><td>renomeia o dado para a propriedade que vai recebê-lo (ex: <code>#text</code>).</td></tr>
    <tr><td>binding_collection_name</td><td>o nome da coleção (para o tipo <i>collection</i>).</td></tr>
    <tr><td>source_property_name</td><td>a propriedade ou expressão observada (tipo <i>view</i>).</td></tr>
    <tr><td>target_property_name</td><td>a propriedade que recebe o valor (ex: <code>#visible</code>).</td></tr>
  </tbody>
</table>

<h2>Exemplo: esconder um texto quando estiver vazio</h2>
<pre>binding_type: <span class="s">view</span>
source_property_name: <span class="s">(not (#form_button_text = ''))</span>
target_property_name: <span class="s">#visible</span></pre>
<p>Lê a expressão "o texto não está vazio" e joga o resultado em <code>#visible</code> — se vazio, o elemento some.</p>

<div class="tip">Não precisa de bindings para uma UI simples. Comece sem eles; adicione quando quiser conteúdo dinâmico.</div>
`,

  export: `<h1>Exportar o pacote</h1>
<p class="lead"><b>Baixar pacote</b> monta um <code>.mcaddon</code> com tudo: o resource pack com as telas e as texturas, e o behavior pack com o script que as abre.</p>

<h2>O que configurar</h2>
<ul class="bullets">
  <li><b>Nome do pacote</b> — como ele aparece na lista de recursos do jogo.</li>
  <li><b>Item que abre o menu</b> — <code>minecraft:stick</code> por padrão.</li>
  <li><b>Versão da API de script</b> — 2.x por padrão. Se o script não carregar no jogo, troque para 1.x e gere de novo.</li>
</ul>

<h2>Instalando</h2>
<ol class="steps">
  <li>Dois cliques no <code>.mcaddon</code>.</li>
  <li>No mundo, ative <b>os dois</b> packs: o RP e o BP.</li>
  <li>Ligue as <b>Beta APIs</b> nos experimentos — o script não roda sem isso.</li>
  <li>Use o item configurado com o botão direito.</li>
</ol>

<h2>Guardando o trabalho</h2>
<p><b>Salvar</b> baixa um <code>.json</code> com todas as telas, e <b>Abrir projeto</b> o restaura. O editor também guarda um rascunho no navegador sozinho, mas o arquivo é a garantia.</p>

<div class="tip">Os UUID do pacote são estáveis: exportar de novo conta como <b>atualização</b> do mesmo pacote, sem encher a lista do mundo de cópias.</div>
`,

  glossary: `<h1>Glossário</h1>
<dl class="glossary">
  <dt>namespace</dt><dd>Identificador único do arquivo de UI. Elementos são referenciados como <code>@namespace.elemento</code>.</dd>
  <dt>control / controls</dt><dd>Um elemento filho / a lista de filhos de um container.</dd>
  <dt>anchor_from / anchor_to</dt><dd>Pontos de ancoragem (ex: <code>top_left</code>) que definem a partir de onde a posição é medida.</dd>
  <dt>offset</dt><dd>Deslocamento (x, y) a partir da âncora. Aqui é derivado da posição no canvas.</dd>
  <dt>size</dt><dd>Tamanho do elemento. Aceita px, porcentagem, <code>fill</code>, etc.</dd>
  <dt>nineslice</dt><dd>Técnica de esticar texturas mantendo os cantos fixos.</dd>
  <dt>collection</dt><dd>Uma lista de dados fornecida pelo jogo (ex: <code>form_buttons</code>).</dd>
  <dt>collection_index</dt><dd>A posição de um botão na coleção. É um contrato com o script: o botão N responde pelo N-ésimo <code>form.button()</code>.</dd>
  <dt>binding</dt><dd>Ligação de uma propriedade a um dado dinâmico.</dd>
  <dt>UI_SCALAR</dt><dd>Fator interno (0.36) que converte os pixels do editor para as unidades do Minecraft na exportação.</dd>
</dl>
`,
};
