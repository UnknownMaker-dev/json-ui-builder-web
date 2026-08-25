/**
 * Templates JSON UI reutilizáveis.
 *
 * O `custom_button` é o template que faz um botão desenhado no editor virar um
 * botão de formulário de verdade: ele lê `#form_button_text` e
 * `#form_button_texture` da coleção `form_buttons` que o `ActionFormData` do
 * script alimenta.
 */

export interface ScreenRoute {
  /** Nome amigável da tela — é o que o script manda em `form.title(...)`. */
  flag: string;
  /** Namespace do arquivo JSON UI da tela. */
  namespace: string;
}

/**
 * Conteúdo desenhado DENTRO do botão: o ícone e o texto.
 *
 * Fica separado porque o `common_buttons.light_content_button` recebe o próprio
 * conteúdo pela variável `$button_content` — um controle que herda dele não
 * pode declarar `controls` sem destruir o botão do jogo. E o conteúdo precisa
 * estar aqui dentro: é este botão que carrega o `collection_index`, então é
 * dentro dele que `#form_button_text` resolve para o item certo da coleção.
 */
export function buttonFaceTemplate(): any {
  return {
    type: "panel",
    size: ["100%", "100%"],
    controls: [
      {
        icone: {
          type: "image",
          anchor_from: "top_left",
          anchor_to: "top_left",
          layer: 2,
          size: "$icon_size",
          offset: "$icon_offset",
          bindings: [
            {
              binding_name: "#form_button_texture",
              binding_name_override: "#texture",
              binding_type: "collection",
              binding_collection_name: "form_buttons",
            },
            {
              binding_name: "#form_button_texture_file_system",
              binding_name_override: "#texture_file_system",
              binding_type: "collection",
              binding_collection_name: "form_buttons",
            },
            {
              binding_type: "view",
              source_property_name:
                "(not ((#texture = '') or (#texture = 'loading')))",
              target_property_name: "#visible",
            },
          ],
        },
      },
      {
        rotulo: {
          type: "label",
          // Centralizado na caixa do botão; o alinhamento horizontal do texto
          // continua vindo da propriedade escolhida no editor.
          anchor_from: "center",
          anchor_to: "center",
          layer: 3,
          size: ["100%", "default"],
          text: "#form_button_text",
          font_type: "$font_type",
          font_scale_factor: "$font_size",
          text_alignment: "$text_alignment",
          shadow: "$shadow",
          offset: "$text_offset",
          bindings: [
            {
              binding_name: "#form_button_text",
              binding_type: "collection",
              binding_collection_name: "form_buttons",
            },
          ],
        },
      },
    ],
  };
}

/**
 * O botão de formulário.
 *
 * Herda direto de `common_buttons.light_content_button` porque `button` é o
 * único tipo que aceita `collection_index` — o teste no jogo mostrou o jogo
 * recusando a propriedade tanto em `panel` quanto em `collection_panel`. Sem o
 * índice, `#form_button_text` não resolve, o binding de visibilidade entende
 * como texto vazio e o botão inteiro some da tela.
 */
export function buttonWithHoverTextTemplate(namespace: string): any {
  return {
    "$default_button_background_texture|default": "textures/ui/glass_pane",
    "$hover_button_background_texture|default": "textures/ui/glass_pane_hover",
    "$pressed_button_background_texture|default": "textures/ui/button_black_hover",

    "$button_size|default": ["100%", "100%"],
    "$button_offset|default": [0, 0],

    "$icon_size|default": ["100%", "100%"],
    "$icon_offset|default": [0, 0],

    "$text_offset|default": [0, 0],
    "$font_size|default": 1,
    "$font_type|default": "default",
    "$shadow|default": false,
    "$text_alignment|default": "center",

    $default_button_texture: "$default_button_background_texture",
    $hover_button_texture: "$hover_button_background_texture",
    $pressed_button_texture: "$pressed_button_background_texture",
    $default_state_border_visible: false,
    $hover_state_border_visible: false,
    $pressed_state_border_visible: false,
    $pressed_button_name: "button.form_button_click",

    // O texto do jogo fica desligado: quem desenha é o `button_face`, com a
    // fonte e o alinhamento escolhidos no editor.
    $button_text: "#null",
    $button_text_binding_type: "collection",
    $button_text_grid_collection_name: "form_buttons",
    $button_content: `${namespace}.button_face`,

    size: "$button_size",
    offset: "$button_offset",
    anchor_from: "top_left",
    anchor_to: "top_left",

    bindings: [
      {
        binding_type: "collection_details",
        binding_collection_name: "form_buttons",
      },
      {
        binding_name: "#form_button_text",
        binding_type: "collection",
        binding_collection_name: "form_buttons",
      },
      {
        binding_type: "view",
        source_property_name: "(not (#form_button_text = ''))",
        target_property_name: "#visible",
      },
    ],
  };
}

/**
 * Painel de hover text. O `custom_button` referencia este controle quando
 * `$show_hover_text` é verdadeiro; o original citava o nome sem nunca definir
 * o controle, o que deixaria uma referência solta no arquivo.
 */
export function hoverTextPanelTemplate(): any {
  return {
    type: "panel",
    size: ["100%", "100%"],
    controls: [
      {
        hover_text: {
          type: "label",
          anchor_from: "center",
          anchor_to: "center",
          text: "#form_button_text",
          color: [1, 1, 1],
          layer: 300,
          bindings: [
            {
              binding_name: "#form_button_text",
              binding_type: "collection",
              binding_collection_name: "form_buttons",
            },
          ],
        },
      },
    ],
  };
}

/** Conteúdo padrão de um scrolling panel. */
export function basicPanelScrollingContent(): any {
  return {
    type: "panel",
    size: ["100%", "100%c"],
    anchor_from: "top_left",
    anchor_to: "top_left",
    controls: [],
  };
}

/** Quantos botões o formulário padrão de reserva consegue mostrar. */
const FALLBACK_SLOTS = 12;

/**
 * Botão do formulário padrão de reserva (visual simples do Minecraft).
 * Cada fatia é fixa numa posição da coleção e se esconde quando o formulário
 * tem menos botões que isso.
 */
function fallbackButton(index: number): any {
  return {
    [`slot_${index}@server_form.fallback_button`]: {
      collection_index: index,
      offset: [0, index * 22],
    },
  };
}

/**
 * Gera o `ui/server_form.json`.
 *
 * Este arquivo tem o nome de uma tela do jogo, então SUBSTITUI a original por
 * completo (JSON-UI.md, seção 2). Ele faz duas coisas:
 *
 * 1. Roteia: para cada tela criada no editor, mostra o painel dela quando o
 *    título do formulário contém o nome daquela tela. O teste de "contém" é a
 *    subtração de string da seção 9 do JSON-UI.md.
 * 2. Reconstrói um formulário padrão simples para quando o título não casa com
 *    tela nenhuma — sem isso, qualquer outro formulário do mundo abriria vazio.
 */
export function serverFormTemplate(routes: ScreenRoute[]): string {
  // "Não bateu com nenhuma tela": tirar todas as chaves não mudou o título.
  const noneMatch = `((#title_text${routes
    .map((r) => ` - '${r.flag}'`)
    .join("")}) = #title_text)`;

  const controls: any[] = [
    {
      "standard_form@common_dialogs.main_panel_no_buttons": {
        $title_panel: "common_dialogs.standard_title_label",
        $title_size: ["100% - 15px", 10],
        $title_max_size: ["100% - 15px", 10],
        size: [225, 200],
        $text_name: "#title_text",
        $title_text_binding_type: "none",
        $child_control: "server_form.long_form_panel",
        layer: 2,
        bindings: [
          { binding_name: "#title_text" },
          {
            binding_type: "view",
            source_property_name: noneMatch,
            target_property_name: "#visible",
          },
        ],
      },
    },
  ];

  // Uma entrada por tela do editor.
  for (const route of routes) {
    controls.push({
      [`${route.namespace}@${route.namespace}.${route.namespace}`]: {
        layer: 10,
        bindings: [
          { binding_name: "#title_text" },
          {
            binding_type: "view",
            source_property_name: `(not ((#title_text - '${route.flag}') = #title_text))`,
            target_property_name: "#visible",
          },
        ],
      },
    });
  }

  const doc = {
    namespace: "server_form",

    // Botão de reserva: o mesmo mecanismo de coleção, com visual padrão.
    // Mesmo motivo do custom_button: só um `button` aceita collection_index.
    "fallback_button@common_buttons.light_content_button": {
      size: ["100%", 20],
      anchor_from: "top_left",
      anchor_to: "top_left",
      $pressed_button_name: "button.form_button_click",
      $button_text: "#form_button_text",
      $button_text_binding_type: "collection",
      $button_text_grid_collection_name: "form_buttons",
      bindings: [
        {
          binding_type: "collection_details",
          binding_collection_name: "form_buttons",
        },
        {
          binding_name: "#form_button_text",
          binding_type: "collection",
          binding_collection_name: "form_buttons",
        },
        {
          binding_type: "view",
          source_property_name: "(not (#form_button_text = ''))",
          target_property_name: "#visible",
        },
      ],
    },

    // Corpo do formulário padrão: o texto e as fatias de botão.
    //
    // stack_panel, e não panel: este controle é injetado no `inside_header_panel`
    // do diálogo padrão, que já traz `orientation` da definição do jogo. Como
    // panel, o jogo reclamava "Unknown property [orientation]".
    long_form_panel: {
      type: "stack_panel",
      orientation: "vertical",
      size: ["100%", "100%"],
      controls: [
        {
          form_text: {
            type: "label",
            anchor_from: "top_left",
            anchor_to: "top_left",
            offset: [4, 2],
            size: ["100% - 8px", "default"],
            text: "#form_text",
            color: [0.85, 0.85, 0.85],
            bindings: [{ binding_name: "#form_text" }],
          },
        },
        {
          buttons_area: {
            // collection_panel: é quem pode declarar collection_name e abrir o
            // escopo da coleção para as fatias.
            type: "collection_panel",
            collection_name: "form_buttons",
            anchor_from: "top_left",
            anchor_to: "top_left",
            offset: [4, 26],
            size: ["100% - 8px", "100% - 30px"],
            controls: Array.from({ length: FALLBACK_SLOTS }, (_, i) =>
              fallbackButton(i),
            ),
          },
        },
      ],
    },

    long_form: {
      type: "panel",
      size: ["100%", "100%"],
      controls,
    },
  };

  return JSON.stringify(doc, null, 4) + "\n";
}
