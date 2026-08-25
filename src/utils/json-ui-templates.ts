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

/**
 * Gera o `ui/server_form.json`.
 *
 * Este arquivo tem o nome de uma tela do jogo, então SUBSTITUI a original por
 * completo (JSON-UI.md, seção 2). Ele faz uma coisa só: rotear. Para cada tela
 * criada no editor, mostra o painel dela quando o título do formulário contém
 * o nome daquela tela — o teste de "contém" é a subtração de string da seção 9
 * do JSON-UI.md.
 * Só isso. Não há corpo de reserva: um formulário cujo título não casa com
 * nenhuma tela daqui abre vazio enquanto o pack estiver ativo. Reconstruir o
 * diálogo padrão à mão custava um erro no log a cada formulário aberto para
 * refazer pior o que o jogo já faz sozinho.
 */
export function serverFormTemplate(routes: ScreenRoute[]): string {
  // Uma entrada por tela do editor: visível quando o título do formulário
  // contém o nome dela.
  const controls = routes.map((route) => ({
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
  }));

  const doc = {
    namespace: "server_form",
    long_form: {
      type: "panel",
      size: ["100%", "100%"],
      controls,
    },
  };

  return JSON.stringify(doc, null, 4) + "\n";
}
