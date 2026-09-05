# Especificação — Internacionalização (i18n)

Documentação do sistema de tradução nativo e leve do **Animals Power Battle**.

## Documentos

| Documento | Descrição |
|---|---|
| [Plano de Implementação](implementation_plan.md) | Arquitetura do motor, decisões de design e planejamento detalhado |
| [Walkthrough e Validações](walkthrough.md) | Resumo do que foi construído, capturas de tela e gravação da validação |

## Resumo Técnico

- **Stack**: Vanilla JavaScript + DOM Nativo (`TreeWalker`).
- **Tamanho**: < 1.5 KB somando motor e dicionários (`pt` e `en`).
- **Sintaxe no HTML**: `<tag>t('chave')</tag>` (sem necessidade de atributos `data-*`).
- **Dicionários**: [`src/i18n/locales.js`](../../src/i18n/locales.js)
- **Motor**: [`src/i18n/index.js`](../../src/i18n/index.js)
- **Persistência**: `localStorage` (`animal_battle_lang`).
