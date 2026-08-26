/**
 * Embedded wiki content, in English.
 *
 * Plain HTML instead of a template: the text changes per locale and carries no
 * logic. The element grid is the exception — the component builds it from the
 * type registry, so it cannot drift when a new type appears.
 */
export const wikiEnUS: Record<string, string> = {
  start: `<h1>Welcome to JSON UI Builder</h1>
<p class="lead">
  This editor lets you <b>design Minecraft Bedrock screens</b> by dragging
  components, and hands you an addon ready to install — no hand-written JSON.
</p>

<h2>The flow in 4 steps</h2>
<ol class="steps">
  <li><b>Add a container.</b> Click <i>Panel</i> in the left bar. The first element has to be a container.</li>
  <li><b>Build inside it.</b> With the panel selected, add buttons, text and images. Drag on the canvas and use the corners to resize.</li>
  <li><b>Give it a look.</b> In the right panel, pick textures and adjust text, font, colour and nine-slice.</li>
  <li><b>Download the pack.</b> Up top, click <i>Download pack</i> and install the <code>.mcaddon</code> in-game.</li>
</ol>

<div class="tip">
  💡 Each <b>tab</b> is a screen, and its name is not decoration: it is what the
  script sends as the form title so the game knows which screen to show.
</div>
`,

  elements: `<h1>Elements</h1>
<p class="lead">Every component you add becomes a JSON UI element. There are <b>containers</b> (which hold others) and <b>leaves</b> (visible content).</p>

<!--ELEMENT-GRID-->

<div class="tip">Children can only go inside <b>containers</b>. Buttons and labels are leaves.</div>
`,

  editor: `<h1>Using the editor</h1>

<h2>Select, move and resize</h2>
<ul class="bullets">
  <li><b>Select:</b> click the element on the canvas or in the Explorer.</li>
  <li><b>Move:</b> drag it, or use the <b>arrow keys</b> (hold <kbd>Shift</kbd> for 10px steps). It will not leave the parent's bounds.</li>
  <li><b>Resize:</b> drag one of the 8 handles. <kbd>Shift</kbd> <b>keeps the aspect ratio</b>, <kbd>Alt</kbd> resizes <b>from the center</b>.</li>
</ul>

<h2>Keyboard shortcuts</h2>
<div class="shortcuts">
  <div><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Move selection</div>
  <div><kbd>Shift</kbd>+arrows 10px step</div>
  <div><kbd>Del</kbd> Delete selection</div>
  <div><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</div>
  <div><kbd>Ctrl</kbd>+<kbd>Y</kbd> Redo</div>
  <div><kbd>Ctrl</kbd>+<kbd>C</kbd> Copy</div>
  <div><kbd>Ctrl</kbd>+<kbd>V</kbd> Paste</div>
  <div><kbd>Ctrl</kbd>+wheel Canvas zoom</div>
</div>

<h2>Explorer</h2>
<p>The tree on the left shows the hierarchy. <b>Drag</b> to reorder or reparent: drop on the <b>middle</b> of a container to move inside it, on the <b>edges</b> to insert before or after, and on the dashed area below the tree to <b>pull it out of the container</b>.</p>

<h2>Stack Panel</h2>
<p>A stack panel positions its children itself, so X and Y are disabled inside it. What governs instead is <b>Align in stack</b> (on the child), plus <b>Distribute children</b>, <b>Spacing</b> and <b>Inner padding</b> (on the stack).</p>
<div class="tip">About the arrow keys: along the stack axis they <b>reorder</b>; on the other axis they change the <b>alignment</b>.</div>
`,

  textures: `<h1>Textures &amp; NineSlice</h1>
<p class="lead">Panels, images and buttons use textures. Pick one from the visual browser or upload your own.</p>

<h2>Choosing textures</h2>
<p>In the right panel, click the texture box to open the picker. Browse the presets, search by name, or upload a <b>PNG</b> (with an optional nine-slice <b>JSON</b>). For a background, the <b>Import background image</b> button in the left bar creates the element behind the others for you.</p>

<h2>What is NineSlice?</h2>
<p>
  A small texture has to stretch to fill a large box — but stretching all of it
  distorts the borders. <b>Nine-slice</b> cuts the image into <b>9 pieces</b>:
  the 4 corners stay fixed, the 4 edges stretch along one axis only, and the
  middle stretches both ways. The result: crisp borders at any size.
</p>
<div class="nine-demo">
  <div>corner</div><div>edge ↔</div><div>corner</div>
  <div>edge ↕</div><div class="mid">middle</div><div>edge ↕</div>
  <div>corner</div><div>edge ↔</div><div>corner</div>
</div>
<p>Choosing a texture from the picker also adopts the nine-slice that ships with it — that is the artwork's own data, and it usually has different borders on each side.</p>
<div class="tip">A border larger than the image itself leaves no middle to stretch. In that case the export drops the nine-slice and warns, instead of producing a smear in-game.</div>
`,

  bindings: `<h1>Bindings</h1>
<p class="lead">Bindings are how JSON UI becomes <b>dynamic</b>: instead of a fixed value, a property is <b>bound</b> to data the game provides in real time.</p>

<h2>What are they for?</h2>
<ul class="bullets">
  <li>Showing <b>text that changes</b> (a player name, a score).</li>
  <li><b>Hiding or showing</b> an element based on a condition.</li>
  <li>Filling a <b>list</b> with items the game generates — like the buttons of a form.</li>
</ul>

<div class="analogy">
  <b>Analogy:</b> a fixed value is a label written in pen. A binding is a digital
  display: the game updates the number and the UI shows it on its own.
</div>

<h2>The types (binding_type)</h2>
<ul class="bullets">
  <li><b>view</b> — reacts to another element or to an expression on the screen itself.</li>
  <li><b>global</b> — reads a global value from the game.</li>
  <li><b>collection</b> — reads the data of one item in a list.</li>
</ul>

<h2>Using the panel</h2>
<ol class="steps">
  <li>Select the element and open the <b>Bindings</b> section at the bottom of the right panel.</li>
  <li>Click <b>Add</b>. A binding card appears.</li>
  <li>Pick the <b>type</b> and fill in the fields that make sense:</li>
</ol>
<table class="fields">
  <tbody>
    <tr><td>binding_name</td><td>the source value to read (e.g. <code>#form_button_text</code>).</td></tr>
    <tr><td>binding_name_override</td><td>renames the value to the property that will receive it (e.g. <code>#text</code>).</td></tr>
    <tr><td>binding_collection_name</td><td>the collection's name (for the <i>collection</i> type).</td></tr>
    <tr><td>source_property_name</td><td>the property or expression being watched (<i>view</i> type).</td></tr>
    <tr><td>target_property_name</td><td>the property that receives the value (e.g. <code>#visible</code>).</td></tr>
  </tbody>
</table>

<h2>Example: hide a label when it is empty</h2>
<pre>binding_type: <span class="s">view</span>
source_property_name: <span class="s">(not (#form_button_text = ''))</span>
target_property_name: <span class="s">#visible</span></pre>
<p>It reads the expression "the text is not empty" and pushes the result into <code>#visible</code> — if empty, the element disappears.</p>

<div class="tip">A simple UI needs no bindings at all. Start without them; add them when you want dynamic content.</div>
`,

  export: `<h1>Exporting the pack</h1>
<p class="lead"><b>Download pack</b> assembles a <code>.mcaddon</code> with everything: the resource pack holding the screens and textures, and the behavior pack with the script that opens them.</p>

<h2>What to configure</h2>
<ul class="bullets">
  <li><b>Pack name</b> — how it shows up in the game's resource list.</li>
  <li><b>Item that opens the menu</b> — <code>minecraft:stick</code> by default.</li>
  <li><b>Script API version</b> — 2.x by default. If the script fails to load in-game, switch to 1.x and export again.</li>
</ul>

<h2>Installing</h2>
<ol class="steps">
  <li>Double-click the <code>.mcaddon</code>.</li>
  <li>In the world, enable <b>both</b> packs: the RP and the BP.</li>
  <li>Turn on <b>Beta APIs</b> in the experiments — the script will not run without it.</li>
  <li>Right-click with the configured item.</li>
</ol>

<h2>Keeping your work</h2>
<p><b>Save</b> downloads a <code>.json</code> with every screen, and <b>Open project</b> restores it. The editor also keeps a draft in the browser on its own, but the file is the guarantee.</p>

<div class="tip">The pack UUIDs are stable: exporting again counts as an <b>update</b> to the same pack, instead of filling the world's list with copies.</div>
`,

  glossary: `<h1>Glossary</h1>
<dl class="glossary">
  <dt>namespace</dt><dd>Unique identifier of a UI file. Elements are referenced as <code>@namespace.element</code>.</dd>
  <dt>control / controls</dt><dd>A child element / the list of children of a container.</dd>
  <dt>anchor_from / anchor_to</dt><dd>Anchor points (e.g. <code>top_left</code>) defining where the position is measured from.</dd>
  <dt>offset</dt><dd>Displacement (x, y) from the anchor. Here it is derived from the position on the canvas.</dd>
  <dt>size</dt><dd>The element's size. Accepts px, percentages, <code>fill</code>, and more.</dd>
  <dt>nineslice</dt><dd>A technique for stretching textures while keeping the corners fixed.</dd>
  <dt>collection</dt><dd>A list of data provided by the game (e.g. <code>form_buttons</code>).</dd>
  <dt>collection_index</dt><dd>A button's position in the collection. It is a contract with the script: button N answers for the Nth <code>form.button()</code>.</dd>
  <dt>binding</dt><dd>Binding a property to a dynamic value.</dd>
  <dt>UI_SCALAR</dt><dd>Internal factor (0.36) converting the editor's pixels into Minecraft units on export.</dd>
</dl>
`,
};
