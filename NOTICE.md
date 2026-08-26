# Third-party notices and rights status

> 🇧🇷 [Leia em português](NOTICE.pt-BR.md)

This file exists to be honest about what in this repository is **not original**
and what the situation is for each part. It is not legal advice.

---

## 1. Upstream project — an unresolved issue

This editor is a rewrite of
**[SebTheSigma/JSON-UI-Maker](https://github.com/SebTheSigma/JSON-UI-Maker)**.
Ported from it: the coordinate conversion algorithm, the calibration "magic
numbers" (`UI_SCALAR`, font offsets) and the JSON UI templates that became
`src/utils/json-ui-templates.ts`.

**That repository declares no license** — there is no `LICENSE` file and GitHub
reports `license: null`.

Under copyright law, the absence of a license means **all rights reserved**.
Publishing a repository on GitHub grants viewers the right to view it and to
fork it *within GitHub* (GitHub Terms of Service, section D.5), but it does
**not** grant a license to copy, modify or redistribute the code elsewhere.

The practical consequence: the derived parts of this repository sit in a zone
with no explicit permission, and no license placed here fixes that — you cannot
sublicense what you have no right to license.

**What actually resolves it**, in order of effectiveness:

1. Ask the original author for written permission (an issue or an email asking
   them to add a license to their repository is enough, and benefits everyone).
   Keep the reply.
2. Rewrite the derived parts from observed behaviour, without consulting their
   code, and record that in the git history.
3. Keep attribution visible — this does not remove the problem, but it does rule
   out any claim that the work was passed off as your own, which is the
   aggravating factor.

## 2. Textures in `public/presets/`

The five texture sets in `public/presets/textures/` entered the repository in
the initial commit and **their origin is not recorded**. They do not come from
the upstream project (verified: the files do not exist there).

If you did not produce them, check their provenance before keeping the
repository public. If you cannot determine it, the safe route is to replace them
with your own artwork — the editor does not depend on any specific texture, they
are only the picker's starting catalogue.

## 3. Minecraft, Mojang and Microsoft

This is an **unofficial** project, with no affiliation with, sponsorship from or
approval by Mojang Studios or Microsoft.

"Minecraft" is a trademark of Mojang Synergies AB. The JSON UI format belongs to
Minecraft Bedrock Edition; this project only generates files in that format and
distributes no game code, asset or binary.

Usage follows the spirit of the [Mojang Usage
Guidelines](https://www.minecraft.net/usage-guidelines): a free tool that does
not charge for access to game content and does not present itself as an official
product.

## 4. Dependencies

`vue`, `pinia`, `vite`, `jszip` and `lucide-vue-next` — all MIT, compatible with
use and redistribution. See `package.json`.

## 5. No warranty

The software is provided "as is". The generated packs modify the Minecraft
interface by replacing `ui/server_form.json`; using it on a production server is
the publisher's responsibility. Back up your worlds before testing.
