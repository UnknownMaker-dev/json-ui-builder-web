# Avisos de terceiros e situação de direitos

> 🇬🇧 [Read in English](NOTICE.md)

Este arquivo existe para ser honesto sobre o que neste repositório **não é
original** e qual é a situação de cada parte. Não é parecer jurídico.

---

## 1. Projeto de origem — pendência real

Este editor é uma reescrita de **[SebTheSigma/JSON-UI-Maker](https://github.com/SebTheSigma/JSON-UI-Maker)**.
Foram portados dali: o algoritmo de conversão de coordenadas, os "números
mágicos" de calibração (`UI_SCALAR`, offsets de fonte) e os templates de JSON UI
que viraram `src/utils/json-ui-templates.ts`.

**Aquele repositório não declara licença nenhuma** — não há arquivo `LICENSE` e
o GitHub reporta `license: null`.

Pela lei de direito autoral, ausência de licença significa **todos os direitos
reservados**. Publicar um repositório no GitHub concede a quem vê o direito de
visualizar e de dar fork *dentro do GitHub* (Termos de Serviço do GitHub, seção
D.5), mas **não** concede licença para copiar, modificar ou redistribuir o
código fora dali.

Consequência prática: as partes derivadas deste repositório estão numa zona sem
permissão explícita, e nenhuma licença colocada aqui resolve isso — não se pode
sublicenciar o que não se tem direito de licenciar.

**O que efetivamente resolve**, em ordem de eficácia:

1. Pedir permissão por escrito ao autor original (uma issue ou e-mail pedindo
   que ele adicione uma licença ao repositório dele já basta, e beneficia todo
   mundo). Guarde a resposta.
2. Reescrever as partes derivadas a partir do comportamento observado, sem
   consultar o código dele, e registrar isso no histórico do git.
3. Manter a atribuição visível — não elimina o problema, mas afasta a acusação
   de tentar passar o trabalho como próprio, que é o agravante.

## 2. Texturas em `public/presets/`

Os cinco conjuntos de textura em `public/presets/textures/` entraram no
repositório no commit inicial e **a origem não está registrada**. Não são do
projeto de origem (verificado: os arquivos não existem lá).

Se você não as produziu, verifique a procedência antes de manter o repositório
público. Se não conseguir determinar, o caminho seguro é substituí-las por arte
própria — o editor não depende de nenhuma textura específica, elas são só o
catálogo inicial do seletor.

## 3. Minecraft, Mojang e Microsoft

Este é um projeto **não oficial**, sem qualquer vínculo, patrocínio ou aprovação
da Mojang Studios ou da Microsoft.

"Minecraft" é marca registrada da Mojang Synergies AB. O formato JSON UI é do
Minecraft Bedrock Edition; este projeto apenas gera arquivos nesse formato e não
distribui nenhum código, asset ou binário do jogo.

O uso segue o espírito das [Diretrizes de Uso Comercial da
Mojang](https://www.minecraft.net/usage-guidelines): ferramenta gratuita, que
não cobra por acesso ao conteúdo do jogo e não se apresenta como produto
oficial.

## 4. Dependências

`vue`, `pinia`, `vite`, `jszip` e `lucide-vue-next` — todas MIT, compatíveis com
uso e redistribuição. Veja `package.json`.

## 5. Sem garantia

O software é fornecido "como está". Os pacotes gerados modificam a interface do
Minecraft substituindo `ui/server_form.json`; usar em servidor de produção é
responsabilidade de quem publica. Faça backup dos mundos antes de testar.
