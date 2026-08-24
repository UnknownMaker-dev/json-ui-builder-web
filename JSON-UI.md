# JSON UI do Minecraft Bedrock — guia prático

Escrito a partir do pack do plugin **RPGStats** (`RPGStats/resourcepack/`), que usa quase
tudo que dá para usar: nine-slice, herança, variáveis, bindings, injeção em tela do jogo e
o truque do título como canal de dados. Todo exemplo aqui saiu de um arquivo que funciona.

> **Aviso honesto:** JSON UI não é documentado pela Mojang. Não há schema, não há changelog,
> e uma atualização pode renomear um controle e quebrar seu pack sem aviso. O que está aqui
> vale para a linha 1.20–1.21. Quando algo não funcionar, a causa mais provável é nome de
> controle que mudou, não erro seu.

---

## 1. O que dá e o que não dá

**Dá:**
- Repintar qualquer tela do jogo (inventário, chat, HUD, pause, formulários do servidor)
- Reposicionar, esconder e criar controles
- Reagir a valores que o jogo já expõe (vida, fome, texto do título, nome do jogador)
- Animar por estados (hover, pressed) e por transições

**Não dá:**
- Guardar estado próprio, fazer conta arbitrária ou salvar nada
- Pedir dado ao servidor. **A UI é cega.** Ela só lê o que o cliente já tem
- Criar tela nova do nada que o jogo abra sozinho — você sempre parasita uma tela existente

Essa última linha é a mais importante. Todo "menu customizado" de servidor Bedrock é uma
tela do jogo (formulário, diálogo de NPC, livro) redesenhada até não parecer o que é.

---

## 2. Estrutura de arquivos

```
meu_pack/
├── manifest.json              obrigatório, na RAIZ do zip
├── textures/
│   └── ui/…                   PNGs, com .json ao lado quando houver nine-slice
└── ui/
    ├── _ui_defs.json          registra SEUS arquivos novos
    ├── hud_screen.json        sobrescreve a do jogo (mesmo nome = substitui)
    └── utils/menu_utils.json  arquivo seu qualquer
```

### `_ui_defs.json`

Só arquivos **novos** precisam entrar aqui. Arquivo com nome de uma tela do jogo
(`hud_screen.json`) é reconhecido pelo nome e **não** deve ser listado.

```json
{
    "ui_defs": [
        "ui/bars/attributes_bar.json",
        "ui/dialogues/stats.json",
        "ui/utils/menu_utils.json"
    ]
}
```

Esquecer de registrar é o erro nº 1: o arquivo simplesmente não existe para o jogo, sem
nenhuma mensagem.

### Sobrescrita é por arquivo inteiro, não por mesclagem

Se dois packs do `resource_stack` trazem `ui/hud_screen.json`, vale só o de cima — o de
baixo é ignorado por completo. É por isso que se usa `modifications` (seção 8) em vez de
reescrever a tela.

---

## 3. Anatomia de um controle

```json
{
  "namespace": "meu_pack",

  "meu_painel": {
    "type": "panel",
    "size": [ 200, 100 ],
    "controls": [
      { "fundo@meu_pack.moldura": {} },
      { "titulo": { "type": "label", "text": "Olá" } }
    ]
  }
}
```

- **`namespace`** — obrigatório, um por arquivo. É o sobrenome dos controles dele.
- **Cada chave de topo é um controle**, endereçável de fora como `namespace.nome`.
- **`controls`** é uma **lista de objetos de uma chave só**. Não é um objeto. Repetir nome
  dentro da mesma lista faz o segundo sumir sem aviso.

### Tipos

| `type` | Serve para |
|---|---|
| `panel` | agrupar. Filhos se posicionam livremente, uns por cima dos outros |
| `stack_panel` | empilhar filhos em sequência (`orientation`: `vertical`/`horizontal`) |
| `image` | desenhar textura |
| `label` | texto |
| `button` | área clicável com estados `default`/`hover`/`pressed` |
| `input_panel` | captura entrada sem ser botão |
| `grid` | repete um filho em linhas/colunas |
| `screen` | tela inteira; você raramente cria uma |
| `custom` | controles especiais do jogo (mapa, modelo 3D, gradiente) |
| `scroll_view` | área rolável |
| `edit_box` | caixa de digitação |
| `toggle` | liga/desliga |

---

## 4. Herança com `@`

```json
"meu_botao@common.button": { "size": [ 40, 20 ] }
```

Lê-se: *cria `meu_botao` copiando `common.button` e sobrescreve `size`*.

- `@namespace.controle` — herda de outro arquivo
- `@controle` — herda do mesmo arquivo
- O nome antes do `@` é como o controle passa a se chamar **aqui**

Herança é cópia com sobrescrita rasa: você troca a chave inteira, não faz merge dentro dela.
Sobrescrever `controls` **substitui a lista toda** — para acrescentar sem perder o que veio,
use `modifications`.

---

## 5. Variáveis `$`

O que transforma um controle em template.

```json
"basic_button@common.button": {
  "$size|default": [ 15, 15 ],
  "$texture|default": "",
  "$text_color|default": "white",

  "size": "$size",
  "controls": [
    { "background": { "type": "image", "texture": "$texture" } }
  ]
}
```

Usando:

```json
{ "mais@menu_utils.basic_button": {
    "$texture": "textures/ui/uis/presets/sistema/plus",
    "$texture_hover": "textures/ui/uis/presets/sistema/plus_hover"
} }
```

- **`$nome|default`** define o valor de reserva. **Sem `|default`, a variável não resolvida
  vira texto literal na tela** — é assim que aparece `$texture` escrito no meio do menu.
- Variáveis **descem** para os filhos: declarar `$cor` no pai serve o neto.
- Isso é o que permite um preset: a mesma tela, com outro conjunto de caminhos de textura.
  No RPGStats os 6 presets são exatamente isso — um painel por preset, cada um passando
  `$bg_texture`, `$plus_texture`, etc. para o **mesmo** `stats.menu`.

---

## 6. Tamanho, posição e âncora

```json
"size": [ 200, "100%" ],
"offset": [ 5, -12 ],
"anchor_from": "top_left",
"anchor_to": "top_left"
```

### Unidades de tamanho

| Forma | Significa |
|---|---|
| `40` | 40 pixels |
| `"50%"` | 50% do **pai** |
| `"100%c"` | 100% do **conteúdo** (o que os filhos ocupam) |
| `"50%sm"` | 50% do lado menor do próprio controle |
| `"fill"` | ocupa o que sobrou (em stack_panel) |
| `"default"` | o tamanho natural da textura/texto |
| `"50%c + 18px"` | dá para somar |

`%c` é o que faz um painel crescer junto com o texto. Cuidado: `%c` dentro de um filho que
usa `%` do pai vira dependência circular e o jogo desenha 0×0.

### Âncoras

`anchor_from` é o ponto **do pai**; `anchor_to` é o ponto **do filho** que encosta nele.
Valores: `top_left`, `top_middle`, `top_right`, `left_middle`, `center`, `right_middle`,
`bottom_left`, `bottom_middle`, `bottom_right`.

`offset` desloca a partir daí, e aceita negativo.

### `layer`

Número maior desenha por cima. Filhos do mesmo painel sem `layer` seguem a ordem da lista.

---

## 7. Nine-slice — a parte que mais dá dor de cabeça

Um PNG ao lado de um `.json` de mesmo nome:

`textures/ui/uis/presets/sistema/background.png` + `background.json`

```json
{
    "nineslice_size": [ 8, 8, 8, 8 ],
    "base_size": [ 32, 32 ]
}
```

- `nineslice_size` — a borda que **não** estica: `[esquerda, cima, direita, baixo]`.
  Um número só aplica aos quatro lados.
- `base_size` — o tamanho real do PNG.

O jogo corta a imagem em 9 pedaços: 4 cantos fixos, 4 bordas que esticam num eixo, e o
miolo que estica nos dois.

### As três regras que eu aprendi errando

**1. O miolo tem que ser liso.** Ele é o pedaço esticado. Qualquer desenho ali vira borrão
quando o painel cresce. Uma **linha contínua** de ponta a ponta sobrevive (a coluna do meio
vira mais do mesmo pixel); um detalhe solto no meio, não.

**2. O canto tem exatamente o tamanho da borda.** Quer um canto chanfrado ou uma cantoneira
em L? Precisa de pixels para isso. Com `nineslice_size: 2` o canto é 2×2 e não cabe nada.
No preset `sistema` eu tive que ir para **32×32 com borda 8** só por causa do chanfro.

**3. O canto não escala.** Num painel de 600 px o canto continua com os 8 px do desenho.
Traço fino de 1 px some. Cantoneira que precisa ser vista quer 2 px de espessura.

### Transparência com nine-slice

Dá para ter canto recortado (chanfro) deixando os pixels transparentes — o `alpha` é
respeitado. É assim que a janela do sistema tem o canto cortado.

---

## 8. Alterar tela do jogo sem reescrevê-la: `modifications`

```json
{
    "namespace": "hud",
    "root_panel": {
        "modifications": [
            {
                "array_name": "controls",
                "operation": "insert_back",
                "value": [ { "meu_hud@rpgstats_bar.content": {} } ]
            }
        ]
    }
}
```

Operações: `insert_front`, `insert_back`, `insert_before`, `insert_after`, `replace`,
`remove`. As posicionais levam `"target"` com o nome do controle de referência.

Isto é **muito** melhor que copiar a tela inteira: quando a Mojang mexer nela, seu pack
continua funcionando, porque você só acrescentou um item na lista.

---

## 9. Bindings — como a UI lê o jogo

É aqui que mora a mágica e a frustração.

```json
"bindings": [
    {
        "binding_name": "#hud_title_text_string"
    },
    {
        "binding_type": "view",
        "source_property_name": "(#text = '')",
        "target_property_name": "#visible"
    }
]
```

### Os três tipos

| `binding_type` | O que faz |
|---|---|
| `global` | lê um valor global do jogo (`#title_text`, `#hud_title_text_string`) |
| `view` | calcula a partir de propriedades já ligadas, **neste** controle ou em outro |
| `collection` | liga o controle a um item de uma coleção (lista de botões, slots) |

Em `view`, `source_control_name` diz **de qual controle** vem a propriedade. Sem ele, é do
próprio controle.

### Propriedades de destino que valem a pena

`#visible`, `#text`, `#texture`, `#enabled`, `#clip_ratio`, `#alpha`, `#size`, `#offset`,
`#text_color`.

### Operadores em `source_property_name`

Aritmética (`+ - * /`), comparação (`=`, `<`, `>`, `<=`, `>=`), lógica (`and`, `or`, `not`),
e **subtração de string** — que não é conta, é remoção de trecho.

### O truque da subtração de string

```json
"source_property_name": "(not (#title_text - 'menu:rpg_sistema' = #title_text))"
```

Lê-se: *"tirar `menu:rpg_sistema` de `#title_text` mudou alguma coisa?"* Se mudou, a string
continha aquilo. **É assim que se faz "contém" em JSON UI**, porque não existe operador de
contém.

É esse mecanismo que faz um servidor rotear várias telas diferentes por um canal só: o
plugin põe uma chave no nome do NPC, e cada painel só fica visível quando acha a sua chave.

### O truque do título como canal de dados

O servidor não fala com a UI. Mas ele pode mandar um **título** — e a UI lê o texto do
título. Então:

1. O plugin manda `sendTitle("rpg_hp:82")`
2. A barra de vida faz `((#hud_title_text_string - 'rpg_hp:') * 1.0)` e recebe **82**
3. A tela do título esconde qualquer texto que comece com os prefixos conhecidos

```json
"hud_title_text/title_frame": {
    "bindings": [
        {
            "binding_type": "view",
            "source_control_name": "title",
            "source_property_name": "((#text - 'rpg_hp:' - 'rpg_ki:') = #text)",
            "target_property_name": "#visible"
        }
    ]
}
```

**A armadilha:** sem o pack instalado, o jogador lê `rpg_hp:82` escrito na tela. Todo plugin
que use isso precisa nascer com a HUD desligada.

**A outra armadilha:** o controle só relê o valor quando o texto **muda**. Mandar o mesmo
título de novo não atualiza nada — e mandar título a cada tick é tráfego à toa. Mande só o
que mudou.

### Barra que enche e esvazia

```json
{
  "fill": {
    "type": "image",
    "texture": "textures/ui/rpgstats/hp_bar",
    "size": [ "100%", "100%" ],
    "clip_direction": "right",
    "clip_pixelperfect": false,
    "bindings": [
        {
            "binding_type": "view",
            "source_control_name": "health_bar_title",
            "source_property_name": "((#max_value - #value) / #max_value)",
            "target_property_name": "#clip_ratio"
        }
    ]
  }
}
```

`#clip_ratio` é **quanto cortar** (0 = cheia, 1 = vazia), e `clip_direction` diz de que lado
o corte entra. Barras espelhadas — uma esvaziando para cada borda da tela — são só duas
direções diferentes.

Desenhe a textura no tamanho exato do slot. Com `clip_pixelperfect: false` ela é escalada, e
proporção 1:1 mantém o corte preciso.

### `property_bag`

Guarda constantes no controle para os bindings usarem:

```json
"property_bag": { "#max_value": 100 }
```

### `ignored`

Tira o controle da árvore quando a expressão for verdadeira. Diferente de `visible`:
`ignored` não ocupa espaço nem entra em `%c`.

```json
"ignored": "($minha_var = '')"
```

---

## 10. Coleções e `collection_index`

Botões de formulário e de diálogo de NPC chegam como **coleção**. Cada botão desenhado
declara qual índice ele representa:

```json
{
  "atributo_0@menu_utils.basic_button": {
    "collection_index": 0,
    "$texture": "textures/ui/uis/stats/upgrade/mais"
  }
}
```

**O índice é posicional e é um contrato com o servidor.** No RPGStats: 0–5 são os atributos,
6 é o fechar, 7/8/9 são `−`, quantidade e `+`. Inserir um botão no meio da lista do lado do
plugin move todos os outros e a tela inteira passa a clicar no lugar errado.

Corolário: **botão escondido por permissão precisa sair da lista antes de montar a tela**,
não ficar como buraco.

O `collection_name` no painel-pai diz de qual coleção os índices vêm
(`"collection_name": "student_buttons_collection"` no diálogo de NPC).

---

## 11. Estados de botão

```json
"meu_botao@common.button": {
  "controls": [
    { "default|pressed": { "type": "panel", "controls": [ … ] } },
    { "hover":            { "type": "panel", "controls": [ … ] } }
  ]
}
```

`default`, `hover`, `pressed`, `locked`. `a|b` aplica aos dois estados. É a forma padrão de
trocar a textura no passar do mouse.

---

## 12. Fontes

`"font_type"`: `default`, `smooth`, `rune`, `MinecraftSeven`, `MinecraftTen` (a de título,
grossa), `unicode`. Mais `font_scale_factor` e `shadow`.

`§` funciona dentro de `text` e no texto que o servidor manda.

---

## 13. Depurar

Não existe inspetor. O que dá:

1. **Ligar o log de erro de UI** — Configurações → Criador → *Content Log*. Ele acusa
   textura faltando e JSON malformado. É a única mensagem que você vai ter.
2. **Pintar de rosa.** Trocar a textura por um PNG chapado e ver se aparece resolve metade
   dos problemas de posição.
3. **`/reload`** no mundo recarrega o pack sem sair do jogo.
4. **Validar o JSON fora do jogo.** JSON UI aceita `//` comentários — então um validador
   comum reclama. Tire os comentários antes de validar:
   ```bash
   python3 -c "import json,re,sys;json.loads(re.sub(r'//.*','',open(sys.argv[1]).read()))" arquivo.json
   ```
5. **Conferir textura referenciada que não existe:** varra os JSON procurando caminhos
   `textures/...` e teste se o `.png` está lá. Foi assim que descobri 16 texturas fantasma
   num pack herdado.

O sintoma mais comum — **tela em branco ou nada acontecendo** — quase sempre é uma destas
três: arquivo não registrado no `_ui_defs.json`, nome de controle do jogo que mudou, ou
`$variável` sem `|default`.

---

## 14. Lista de armadilhas

| Sintoma | Causa provável |
|---|---|
| Arquivo novo não faz nada | não está no `_ui_defs.json` |
| `$alguma_coisa` escrito na tela | variável sem `|default` e sem valor |
| Painel some / desenha 0×0 | `%c` circular, ou `size` dependendo de filho que depende do pai |
| Moldura vira borrão ao esticar | desenho no miolo do nine-slice |
| Canto do nine-slice "sumiu" | canto tem o tamanho da borda; num painel grande, 1–2 px não se vê |
| Botão clica no lugar errado | `collection_index` deslocado — alguém inseriu botão no meio |
| Dois packs, um não aparece | mesmo arquivo de tela; sobrescrita é total, não merge |
| Texto do servidor aparece cru | prefixo de canal sem o pack instalado |
| Barra não atualiza | o título mandado é idêntico ao anterior |
| Item duplicado na tela | controle repetido com o mesmo nome na lista `controls` |

---

## 15. Fluxo de trabalho que funcionou aqui

1. **Gerar textura por script, não desenhar à mão.** Neste pack há dois geradores em
   Python + Pillow (`tools/make_ui.py`, `tools/make_presets.py`). Criar um estilo novo é
   acrescentar uma paleta e rodar. Textura editada à mão some no próximo `python3 tools/…`.
2. **Renderizar preview fora do jogo.** `tools/preview_presets.py` monta uma aproximação da
   tela com as texturas reais e o mesmo nine-slice. Não substitui testar no jogo, mas pega
   erro de paleta e de moldura em segundos em vez de minutos.
3. **Manter o preview atualizado.** O meu ficou com o vocabulário antigo e passou meses
   fazendo parecer que o plugin estava desatualizado. Preview velho mente.
4. **Empacotar com o manifest na raiz:**
   ```bash
   cd resourcepack && zip -r ../MeuPack.mcpack . -x README.md -x "tools/*"
   ```
   Manifest dentro de uma subpasta = o jogo recusa o pack sem explicar direito.

---

## 16. Para começar um pack do zero

```jsonc
// manifest.json — na raiz do zip
{
    "format_version": 1,
    "header": {
        "description": "Meu pack de UI",
        "name": "Meu Pack",
        "uuid": "GERE-UM-UUID-AQUI",
        "version": [ 1, 0, 0 ],
        "min_engine_version": [ 1, 20, 0 ]
    },
    "modules": [
        {
            "description": "Interface",
            "type": "resources",
            "uuid": "OUTRO-UUID-DIFERENTE",
            "version": [ 1, 0, 0 ]
        }
    ]
}
```

Os dois UUID precisam ser diferentes entre si e **estáveis**: mudar o do header faz todo
jogador baixar o pack de novo do zero.

Depois: `ui/_ui_defs.json` com seu primeiro arquivo, um `namespace`, um `panel` com uma
`image` rosa, e vá dali.

---

## Onde olhar exemplo real

Neste repositório, em `RPGStats/resourcepack/`:

| Arquivo | Mostra |
|---|---|
| `ui/_ui_defs.json` | registro mínimo |
| `ui/utils/menu_utils.json` | template com `$variáveis` e estados de botão |
| `ui/hud_screen.json` | `modifications` + esconder o título por prefixo |
| `ui/bars/attributes_bar.json` | barra com `#clip_ratio` e `property_bag` |
| `ui/npc_interact_screen.json` | rotear 7 telas por subtração de string |
| `ui/dialogues/stats.json` | layout completo com coleção de botões |
| `tools/make_presets.py` | gerar textura e nine-slice por script |
