/**
 * Liga/desliga os modais de propaganda (rewarded e interstitial).
 *
 * Durante a fase de teste na Poki e no YouTube os anúncios ficam
 * DESLIGADOS: o rewarded concede a recompensa direto (os boosters
 * continuam testáveis) e os interstitials são pulados. Os SDKs das
 * plataformas continuam sendo inicializados normalmente — só a exibição
 * é suprimida. Para reativar, basta voltar para `true`.
 */
export const ADS_ENABLED = false
