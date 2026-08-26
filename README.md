# JSON UI Builder

<div align="center">

[![English](https://img.shields.io/badge/lang-English-2b6cb0?style=for-the-badge)](README.md)
[![Português&nbsp;(BR)](https://img.shields.io/badge/lang-Portugu%C3%AAs%20%28BR%29-4a5568?style=for-the-badge)](README.pt-BR.md)

</div>

Visual editor for building **Minecraft Bedrock** interfaces and downloading them
as a ready-to-install addon — resource pack, behavior pack and script, in a
single file.

You design by dragging elements onto a canvas; the editor handles the JSON UI,
the coordinates, the nine-slice, the textures and the script that opens the menu
in-game.

![A screen built in the editor](docs/img/exemplo-ffa.png)

---

## Contents

- [Running the project](#running-the-project)
- [Hosting it online](#hosting-it-online)
- [Using the editor](#using-the-editor)
- [Downloading the pack](#downloading-the-pack)
- [Installing in Minecraft](#installing-in-minecraft)
- [The generated script](#the-generated-script)
- [How it works under the hood](#how-it-works-under-the-hood)
- [When nothing shows up](#when-nothing-shows-up)
- [Known limitations](#known-limitations)
- [Repository layout](#repository-layout)
- [Origin, credits and usage](#origin-credits-and-usage)

---

## Running the project

Requires [Bun](https://bun.sh). Node works too — swap `bun` for `npm`.

```bash
git clone https://github.com/UnknownMaker-dev/json-ui-builder-web
cd json-ui-builder-web
bun install
bun run dev
```

Opens at `http://localhost:5173`.

| command | what it does |
|---|---|
| `bun run dev` | development server with hot reload |
| `bun run build` | builds the static site into `dist/` |
| `bun run preview` | serves `dist/` so you can check it before publishing |

The editor is entirely client-side: **no backend, no database, no uploads**.
Everything happens in the browser, and the pack is assembled on your machine.

## Hosting it online

The repository ships with a GitHub Pages workflow
(`.github/workflows/deploy.yml`). To turn it on:

1. On GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Push to `master`.

The site goes live at `https://<user>.github.io/<repository>/` and is
republished on every push.

Pages serves the project from a subfolder, so the build reads a `BASE` variable:

```bash
BASE=/json-ui-builder-web/ bun run build
```

The workflow sets that automatically from the repository name. Locally,
`bun run dev` still runs at `/`. For another host (Vercel, Netlify, Cloudflare
Pages), just point it at `bun run build` and publish the `dist/` folder — no
`BASE` needed, since those serve from the root.

> Texture paths are stored in the project file as `/presets/...` and only become
> full URLs at the moment of use. A saved project file keeps working at any
> address.

## Using the editor

### Screens (tabs)

Each tab is a screen, and becomes **one JSON UI file** inside the pack.

The **tab name is not decoration**: it is the identifier the script sends as the
form title, and what the game uses to pick which screen to show. Double-click to
rename.

> If one screen's name is a substring of another's (`Menu` and `Menu Shop`),
> both open on top of each other in-game — the editor warns you before you
> export.

### Elements

| element | becomes, in JSON UI | holds children |
|---|---|---|
| **Panel** | `panel`, or `image` when it has a texture | yes |
| **Stack Panel** | `stack_panel` | yes |
| **Collection Panel** | `collection_panel` | yes |
| **Scrolling Panel** | `stack_panel` + `common.scrolling_panel` | yes |
| **Image** | `image` | yes |
| **Button** | inherits `common_buttons.light_content_button` | no |
| **Label** | `label` | no |

- **Drag and resize** directly on the canvas, with 8 handles. `SHIFT` keeps the
  aspect ratio, `ALT` resizes from the center.
- **Arrow keys** move by 1px (`SHIFT` = 10px). Inside a stack panel they reorder
  along one axis and change alignment on the other.
- **Ctrl+Z / Ctrl+Y**, **Ctrl+C / Ctrl+V**, `Delete`.
- **Explorer**: drag to reorder or reparent. Drop on the middle of a container to
  move inside it, on the edges to insert before/after, and on the dashed area
  below the tree to pull an element out of its container.
- **Zoom**: fits the window on its own; `Ctrl` + mouse wheel or the corner
  buttons control it manually.

### Stack panel

Unlike a plain panel, a stack panel positions its children itself. X and Y are
disabled inside it — what governs instead:

- **Align in stack** (on the child) — the cross axis: left/center/right in a
  vertical stack, top/middle/bottom in a horizontal one.
- **Distribute children** (on the stack) — the whole block along the stack axis.
- **Spacing** and **Inner padding** (on the stack), **Margin before** (on the
  child).

> JSON UI has no `margin` and no `gap`. The editor emits invisible empty panels
> between items to produce the space.

### Textures

- **Picker** with five bundled sets; choosing a texture also adopts the
  nine-slice that ships with it.
- **Import background image** uploads a PNG/JPG and creates the element behind
  the others, at its original aspect ratio.
- Your own textures live in the browser and travel with the pack.

### Saving

A draft is kept in the browser automatically. To not depend on that, **Save**
downloads a `.json` with every screen, and **Open project** restores it.

## Downloading the pack

**Download pack** opens the export dialog, where you set:

- **Pack name** — how it appears in the game's resource list.
- **Item that opens the menu** — `minecraft:stick` by default.
- **Script API version** — 2.x by default; switch to 1.x if the script fails to
  load on your game version.

The same dialog shows the `main.js` that will be generated, before you download.

Out comes a `.mcaddon` (or a `.zip`, if you prefer) containing:

```
<pack>_RP/                        resource pack
├── manifest.json
├── ui/
│   ├── _ui_defs.json             registers the new files
│   ├── server_form.json          routes: which screen for which title
│   └── <pack>/<screen>.json      one per tab
├── textures/ui/<pack>/           PNGs + nine-slice .json
└── LEIA-ME.txt

<pack>_BP/                        behavior pack
├── manifest.json
├── scripts/main.js               opens the screens
└── LEIA-ME.txt
```

UUIDs stay stable across exports and the patch version bumps each time: the game
recognises it as an **update to the same pack**, instead of filling the list
with copies.

## Installing in Minecraft

1. Double-click the `.mcaddon` — the game imports both packs.
2. In the world settings, enable **both**: `<pack>_RP` and `<pack>_BP`.
3. Turn on **Beta APIs** (Experiments). The script will not run without it.
4. Enter the world and right-click with the configured item.

To install by hand, rename it to `.zip` and extract the two folders into
`com.mojang/development_resource_packs` and `development_behavior_packs`.

## The generated script

```js
import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TRIGGER_ITEM = "minecraft:stick";

const SCREENS = {
    "FFA": {
        buttons: [
            { text: "SUMO FFA" },
            { text: "FIST FFA" },
            { text: "BOW FFA" },
        ],
    },
};

function showScreen(player, name) {
    const screen = SCREENS[name];
    if (!screen) return;

    const form = new ActionFormData().title(name);
    for (const button of screen.buttons) {
        if (button.icon) form.button(button.text, button.icon);
        else form.button(button.text);
    }

    form.show(player).then((response) => {
        if (response.canceled) return;
        const clicked = screen.buttons[response.selection];
        player.sendMessage("§aClicked: §f" + clicked.text);
    });
}

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack?.typeId !== TRIGGER_ITEM) return;
    system.run(() => showScreen(event.source, "FFA"));
});
```

Two rules when editing it:

- **The title must be the screen name.** That is how the game picks the artwork.
  Change it on one side, change it on the other.
- **Button order is a contract.** Button N in the editor answers for the Nth
  `form.button(...)`. Inserting one in the middle shifts every one after it.

To navigate between screens, call `showScreen` again inside the `then`:

```js
if (clicked.text === "Shop") showScreen(player, "Shop");
```

## How it works under the hood

### Routing

Minecraft will not let you create a brand-new screen that the game opens on its
own — you always parasite an existing one. Here it is the `ActionFormData` form.

The server does not talk to the interface, but it does send the form **title**,
and the interface can read that title. That is the channel:

```json
"bindings": [
    { "binding_name": "#title_text" },
    { "binding_type": "view",
      "source_property_name": "(not ((#title_text - 'FFA') = #title_text))",
      "target_property_name": "#visible" }
]
```

Since JSON UI has no "contains" operator, this uses **string subtraction**: did
removing `'FFA'` from the title change anything? If it did, the title contained
it — and the screen shows.

### Coordinates

The editor works in absolute pixels, Minecraft in units of its own. Every value
is multiplied by `UI_SCALAR` (0.36) on export, and each screen becomes a panel
the size of the canvas anchored at the **center**, so the design stays centered
at any resolution.

### Buttons

Each button is wrapped in a `collection_panel` declaring
`collection_name: "form_buttons"`, holding a control that inherits
`common_buttons.light_content_button` and carries the `collection_index`.

That structure is specific: `collection_index` **is only accepted on a control of
type `button`**, and `collection_name` **only on a `collection_panel`**. On a
plain panel the game rejects both with `Unknown property`, and the button
disappears from the screen.

### Nine-slice

The `.json` next to the texture is the source of truth — it carries the artwork's
real borders (often asymmetric, like `[2,2,2,5]`) and `base_size` is read from
the PNG itself. Borders that do not fit the image are dropped with a warning,
rather than turning into a smear in-game.

A hands-on JSON UI guide lives in **[JSON-UI.md](JSON-UI.md)** — types,
inheritance, variables, units, anchors, bindings and the usual traps. *(Written
in Portuguese.)*

## When nothing shows up

Turn on the **Content Log**: Settings → Creator → *Content Log*. It is the only
error message JSON UI ever gives you.

| symptom | likely cause |
|---|---|
| Nothing happens when using the item | packs not enabled, or Beta APIs off |
| The script does not load | API version — swap 2.x ↔ 1.x and export again |
| The default form opens instead | the script title does not match the screen name |
| A button does not appear | its text comes from the script; a button with no text is invisible |
| Button clicks the wrong thing | button order differs between editor and script |
| Missing texture | the Content Log names the exact path |
| Two screens overlapping | one screen name is a substring of another |

## Known limitations

- **While the pack is active, forms that are not yours open empty.** Routing
  requires replacing `ui/server_form.json` wholesale, and it now only routes.
- No `toggle`, `slider`, `grid` or `edit_box`.
- `collection_panel` does not repeat content: buttons are placed by hand.
  Dynamic lists would need `factory`, not implemented yet.
- Re-importing an exported JSON UI works, but does not return the exact tree.
- Custom bindings can be written by hand, with no assistant.

## Repository layout

```
src/
├── components/
│   ├── editor/        toolbar, tabs, canvas, explorer, sidebars, modals
│   └── elements/      how each type is drawn, and nine-slice on a 2D canvas
├── stores/            state (screens, selection, history, zoom) in Pinia
├── types/             element and screen models
├── config/            UI_SCALAR and the other calibration numbers
└── utils/
    ├── json-ui-exporter.ts    tree → JSON UI
    ├── json-ui-importer.ts    JSON UI → tree
    ├── json-ui-templates.ts   form button and router
    ├── pack-builder.ts        assembles the .mcaddon
    ├── scripter.ts            generates main.js
    ├── nineslice.ts           9-slice cutting on canvas
    └── project-file.ts        save and open project
```

## Origin, credits and usage

This editor is a Vue 3 rewrite of
**[SebTheSigma/JSON-UI-Maker](https://github.com/SebTheSigma/JSON-UI-Maker)**,
which is where the coordinate conversion algorithm, the calibration numbers and
the JSON UI templates came from. Credit for the approach goes to them.

> **Read [NOTICE.md](NOTICE.md) before reusing or republishing this
> repository.** The upstream project **declares no license**, which legally means
> all rights reserved — and no license added here changes that. NOTICE explains
> the situation and what actually resolves it.

The original code in this repository is under [MIT](LICENSE), with the scope
spelled out in the file itself.

**Unofficial project.** Not affiliated with, sponsored by or approved by Mojang
Studios or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB. No game
code, asset or binary is distributed here — the project only generates files in
the JSON UI format.

Provided "as is", without warranty. The generated packs modify the game's
interface; back up your worlds before testing.
