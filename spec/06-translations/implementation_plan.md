# Sistema de Tradução Leve (i18n) com Sintaxe Inline `t('key')` no HTML

Implementação de um sistema de internacionalização nativo, ultra-rápido (< 2 KB, zero dependências) que suporta Português (`pt-BR`) e Inglês (`en`), com detecção automática do navegador e a sintaxe declarativa solicitada diretamente no corpo do HTML: `<p class="tagline">t('start.tagline')</p>`.

## Resumo das Decisões de Arquitetura

1. **Sintaxe no HTML**: Ao invés de atributos `data-*`, o HTML conterá marcações inline como `t('start.tagline')`. O motor de i18n percorre os nós de texto (usando `TreeWalker` nativo) e atributos (`title`, `aria-label`), armazenando o modelo bruto do nó e substituindo-o pela tradução ativa.
2. **Zero Dependências & Performance**: Sem `i18next` ou bibliotecas externas. Todo o mecanismo de tradução e os dicionários somam menos de 2 KB, executam em < 0.1 ms e não impactam o carregamento nem o framerate do Three.js.
3. **Detecção Automática do Navegador**:
   - `navigator.language` começando com `pt` -> `pt` (Português).
   - Qualquer outro idioma -> `en` (Inglês padrão).
   - Preferência do usuário salva no `localStorage` (`animal_battle_lang`) com precedência sobre o navegador.
4. **Seletor de Idioma no Menu**: Adição de um botão interativo no Menu de Pausa (`Idioma: PT / EN`) para permitir que o jogador troque a qualquer momento sem recarregar o jogo.
5. **Traduções Dinâmicas em JS**: Suporte a interpolação (ex: `Continuando no nível {level}`) para mensagens de loading, confirmação de exclusão de save, telas de evolução, HUD e nomes de espécies/biomas.

---

## Proposed Changes

### Módulo de Internacionalização (i18n)

#### [NEW] [locales.js](../../src/i18n/locales.js)
- Dicionário completo de strings em `pt` e `en`:
  - Telas iniciais (título, tagline, botões, instruções de controles desktop e mobile).
  - Menu de pausa (Som, Qualidade, Idioma, Continuar, Reiniciar, Resetar com confirmação).
  - Tela de Game Over e estatísticas.
  - Tela de Evolução (títulos, você agora é, próxima evolução, poder máximo).
  - Biomas (Floresta, Savana, Montanhas Rochosas, Floresta Ancestral).
  - Espécies (Calango, Raposa, Lobo, Pantera, Urso, Big Kong, Super Calango).
  - Armas e Boosters (Laser, Chamas, Laser Duplo, Atk Booster, Evo Mining, Danos máximos).
  - Textos de progresso e barra de carregamento.

#### [NEW] [index.js](../../src/i18n/index.js)
- Motor central de tradução:
  - `initI18n()`: Detecta idioma (`localStorage` ou `navigator.language`), executa tradução inicial do DOM.
  - `t(key, params)`: Função de lookup com interpolação de variáveis.
  - `translateDOM(root)`: Usa `document.createTreeWalker` para localizar nós com padrão `t('...')` e atualiza atributos/textos sem destruir nós filhos.
  - `setLanguage(lang)`: Atualiza idioma ativo, salva no `localStorage`, reexecuta `translateDOM()` e emite evento para atualizar HUD/telas ativas.
  - `getLanguage()`: Retorna o idioma atual (`'pt'` ou `'en'`).

---

### Interface e Estrutura HTML

#### [MODIFY] [index.html](../../index.html)
- Substituição dos textos estáticos pelas tags `t('...')`, por exemplo:
  - `<p class="tagline">t('start.tagline')</p>`
  - `<button class="primary-btn ready-btn hidden" id="btn-play">t('start.play')</button>`
  - `<h2 class="gameover-title">t('gameover.title')</h2>`
  - `<button class="primary-btn" id="btn-retry">t('gameover.retry')</button>`
  - `<h2 class="evo-title">t('evolution.title')</h2>`
  - `<button class="menu-row" id="btn-lang">t('menu.language') <b id="lang-state">PT</b></button>`
  - Atualização dos hints de controles para usar `t('controls.desktop')` e `t('controls.mobile')`.

---

### Camada de UI e Lógica do Jogo

#### [MODIFY] [src/ui/Overlays.js](../../src/ui/Overlays.js)
- Uso de `t()` para as etapas de carregamento (`loading.step1`, etc.).
- Uso de `t()` para o aviso de progresso (`start.progressHint`).
- Uso de `t()` para o texto de confirmação de reset (`menu.resetConfirm`).
- Listener no botão `btn-lang` para alternar entre PT e EN dinamicamente.
- Tradução do estado de qualidade (`menu.qualityHigh` / `menu.qualityLow`).

#### [MODIFY] [src/ui/HUD.js](../../src/ui/HUD.js)
- Exibição do nome localizado da espécie do jogador (`t('species.' + player.species.id)`).
- Atualização dinâmica ao trocar idioma.

#### [MODIFY] [src/ui/EvolutionScreen.js](../../src/ui/EvolutionScreen.js)
- Exibição do nome traduzido das espécies (`t('species.' + current.id)` e `t('species.' + next.id)`).
- Rótulo `t('evolution.levelPrefix', { level: next.minLevel })`.

#### [MODIFY] [src/ui/BoosterPanel.js](../../src/ui/BoosterPanel.js)
- Rótulos traduzidos ao atingir o estado MAX permanente (`boosters.maxDmg` e `boosters.maxShort`).

#### [MODIFY] [src/world/biomes/index.js](../../src/world/biomes/index.js)
- Tradução dos nomes e descrições dos biomas exibidos no card de transição através de `t('biomes.' + biome.id + '.name')` e `desc`.

#### [MODIFY] [src/main.js](../../src/main.js)
- Inicialização do `initI18n()` antes de montar o jogo, garantindo que todo o DOM esteja traduzido antes do primeiro quadro.

---

## Plano de Verificação

### Testes Manuais no Navegador
1. **Detecção Padrão**:
   - Abrir o jogo com navegador em PT-BR -> verificar se textos aparecem em Português.
   - Simular navegador em EN -> verificar se textos aparecem em Inglês.
2. **Sintaxe Inline no HTML**:
   - Confirmar que elementos como `<p class="tagline">t('start.tagline')</p>` são substituídos limpa e instantaneamente pelo texto traduzido sem flash visual.
3. **Alternância pelo Menu**:
   - Abrir o menu de pausa, clicar no botão de idioma e verificar se todos os elementos da tela mudam instantaneamente (HUD, Overlays, Menu, botões).
   - Recarregar a página e garantir que a preferência escolhida foi persistida via `localStorage`.
4. **Telas Dinâmicas**:
   - Testar tela de Game Over (derrota).
   - Testar tela de Evolução (usando atalhos de debug `?debug`).
   - Testar transição de bioma.
5. **Impacto de Performance**:
   - Medir tempo de carregamento e verificar ausência de jank no loop de animação a 60fps.
