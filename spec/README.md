# Especificação — Power Animal Battle

Documentação de como o jogo foi construído: requisitos, decisões e armadilhas.

| Documento | Conteúdo |
|---|---|
| [01 — Visão geral](01-visao-geral.md) | Requisitos originais, decisões travadas, resultado |
| [02 — Arquitetura](02-arquitetura.md) | Stack, estrutura de pastas, princípios de desempenho |
| [03 — Armadilhas](03-armadilhas.md) | **9 bugs reais**, causa raiz e correção |
| [04 — Gameplay](04-gameplay.md) | Progressão, ataques, mobs, recursos, boosters |
| [05 — Publicação](05-publicacao.md) | AdManager, SDKs, suporte mobile, pendências |

## Leia isto primeiro

Se for mexer em **movimento, câmera, terreno ou input**, leia
[03 — Armadilhas](03-armadilhas.md) antes. São bugs que já custaram várias
tentativas cada, com a causa raiz documentada.

Destaques:
- Os eixos do movimento relativo à câmera têm **sinais diferentes**
- O auto-alinhamento da câmera **não pode perseguir um ângulo alvo** (trava em 180°)
- A cor do terreno é **acoplada à amplitude** do bioma
- `pointer-events: none` faz listeners **nunca dispararem**

## Pendência conhecida

O FPS em celular real **não foi medido de forma confiável** — ver
[05 — Publicação](05-publicacao.md#pendente-medir-fps-em-aparelho-real).
