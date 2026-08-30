# Armadilhas Conhecidas

Bugs reais encontrados durante o desenvolvimento, com causa raiz e correção.
**Leia antes de mexer nas áreas correspondentes.**

---

## 1. Movimento relativo à câmera — os dois eixos têm sinais DIFERENTES

**Sintoma:** setas/A/D moviam o personagem para o lado errado.

**Fórmula correta** (`entities/Player.js`):
```js
const wx = move.x * cos + move.z * sin
const wz = -move.x * sin + move.z * cos
```

Com a câmera em `target + (sin(yaw), cos(yaw)) * dist`:
- frente (W, `move.z=-1`) → `(-sin, -cos)`
- direita (D, `move.x=1`) → `( cos, -sin)`

**Errei duas vezes aqui:** primeiro não negava nada (W/S invertidos); depois
neguei AMBOS os eixos (W/S certo, mas A/D espelhado — reportado pelo usuário).

**Lição:** um teste que eu mesmo escrevi passou na versão errada porque codifiquei
a mesma suposição equivocada no teste e no código. Para validar eixos, extrair a
base REAL da câmera com `cam.matrixWorld.extractBasis(r,u,f)` e **normalizar no
plano XZ** — a câmera é inclinada, então sem normalizar o cosseno máximo é ~0.87,
não 1.0, e um limiar de 0.95 gera falso negativo.

---

## 2. Auto-alinhamento da câmera — não perseguir ângulo alvo

**Sintoma:** segurando a seta para baixo, a tela tremia e não virava.

**Causa:** andando de ré a correção é exatamente 180°. Os dois sentidos de giro
empatam, o sinal alterna a cada frame. Reproduzido offline: yaw oscilando entre
`0.0000` e `-0.1131` indefinidamente.

**Duas abordagens que FALHARAM:**
1. Alvo = `player.facing` → realimentação (facing vem do yaw da câmera):
   yaw crescia sem parar, 0 → 19 rad em 3s.
2. Alvo = direção de movimento, `atan2(-d.x,-d.z)` → resolvia a realimentação
   (é ponto fixo indo para frente), mas mantinha a singularidade dos 180°.

**Solução:** giro por **velocidade angular** no eixo lateral do input:
```js
this.yaw += strafe * this.alignRate * dt   // alignRate = 0.9 rad/s
```
Elimina o problema por construção — não existe "caminho mais curto" a escolher.
Medido: A/D giram ±0.87 rad/s, diagonal 0.6 rad/s, W e S puros giram 0.

**Lição:** perseguir QUALQUER ângulo alvo tem singularidade em 180°.

---

## 3. Cor do terreno é acoplada à amplitude

**Sintoma:** ao aumentar `biome.terrain.amplitude` de 5.5 para 9.0, 53,8% do mapa
ficou tingido de areia — a floresta virou deserto.

**Causa:** a faixa de areia usava um valor ABSOLUTO (`waterLevel + 1.1`).

**Correção:** faixa proporcional (`amp * 0.10`) e rampa de cor centrada em h=0.
Também foi preciso baixar o nível da água.

**Ao mexer em `amplitude`:** reconferir a proporção de área tingida.
Alvo: ~10% areia, <5% água.

---

## 4. Crateras precisam de piso acima da água

**Sintoma:** com o laser a 10 tiros/s, uma cicatriz AMARELA gigante aparecia.

**Causa:** as crateras cavavam abaixo do nível da água e a rampa de cor pintava
tudo como areia (ver armadilha 3).

**Correção:** `Terrain._craterFloor = water.level + 0.8`.

**Bônus de desempenho:** `computeVertexNormals()` + repintar ~9.4k vértices é caro
demais para 10x/s. `makeCrater` só marca a região suja; `flushCraters()` faz o
trabalho pesado no máximo a cada 0.25s.

---

## 5. Margem da borda do mundo

**Sintoma:** andando para trás, a tela ficava metade azul.

**Causa:** NÃO era a câmera afundando na água. O player chegava à borda do mapa
(z=88 de 100) e enxergava além dele, onde só existe o plano d'água.

**Correção:** `clampToWorld(v, margin = 26)` → limite 74, antes da "parede" de
terreno que começa em 78% de `half`. A câmera também ganhou piso acima da água.

**Ao mudar `size` do terreno:** garantir que `half - margin < 0.78 * half`.

---

## 6. Propriedade sombreando método

**Sintoma:** `g.currentAttack.fire is not a function` ao trocar para chamas.

**Causa:** `this.fire = ctx.fire` no construtor de `FlameAttack` sombreava o
método `fire()` do protótipo.

**Correção:** renomeado para `this.fireSystem`.

---

## 7. Game over só disparava para morte por mob

**Sintoma:** player com HP 0 e `dead: true`, jogo seguia rodando.

**Causa:** o game over só era acionado por `CombatSystem.mobAttackPlayer()`.
Morte por fogo, explosão do próprio laser ou dano em área deixava o jogo travado.

**Correção:** o `Game` escuta o evento `death` do próprio `Player`, cobrindo todas
as fontes. `gameOver()` é idempotente, então os dois caminhos coexistem.

---

## 8. `pointer-events: none` mata listeners

**Sintoma:** o joystick não funcionava no celular.

**Causa:** o listener estava em `#touch-layer`, que herda `pointer-events: none`
de `.hud-layer`. Listeners nesse elemento nunca disparam.

**Correção:** a zona sensível passou a ser o próprio `.joystick`, com
`pointer-events: auto` e esticado para cobrir a metade esquerda inferior.

---

## 9. `setPointerCapture` pode lançar exceção

**Causa:** se o toque é cortado (ligação, notificação, gesto do sistema), o
ponteiro some e a chamada lança `NotFoundError`, derrubando o input.

**Correção:** envolvido em `try/catch` nos três pontos de uso.
