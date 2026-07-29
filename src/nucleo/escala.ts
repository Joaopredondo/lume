import type { CalibracaoDeAparelho, Perfil } from '../dados/tipos';

/**
 * Conversão de tamanho de estímulo (seção 3.1).
 *
 * O app roda em tablet a ~45cm e em TV a ~2m. 300px nos dois não é o mesmo
 * estímulo — é a diferença entre enxergar e não enxergar. Por isso o limiar do
 * perfil é guardado em **graus de ângulo visual**, que é o que o olho de fato
 * mede, e convertido para pixels aqui, no momento de desenhar.
 *
 * Efeito colateral desejado: o baseline é portátil entre aparelhos e as
 * sessões do histórico ficam comparáveis entre si.
 */

/**
 * Largura de um cartão ISO/IEC 7810 ID-1 (cartão de banco), em milímetros.
 *
 * É a régua da calibração física: o navegador não expõe o tamanho real da
 * tela, e `devicePixelRatio` não resolve isso. Encostar um cartão na tela e
 * ajustar até bater é o método confiável, e todo mundo tem um.
 */
export const LARGURA_CARTAO_MM = 85.6;

/**
 * Usado enquanto o perfil não foi calibrado.
 *
 * Deliberadamente grande: errar para o lado do estímulo grande demais custa
 * uma sessão pouco informativa; errar para o pequeno demais faz a pessoa
 * parecer não responsiva quando o problema é do app.
 */
export const LIMIAR_PADRAO_GRAUS = 12;

/**
 * Faixa de sanidade da calibração do cartão, para descartar arrasto acidental.
 *
 * 2 px/mm é ~50 dpi: abaixo disso não existe tela de verdade, então o valor só
 * pode ser engano. 40 px/mm é ~1000 dpi, bem acima de qualquer aparelho atual.
 */
const PX_POR_MM_MINIMO = 2;
const PX_POR_MM_MAXIMO = 40;

/** Converte a largura medida do cartão na tela em px/mm daquele aparelho. */
export function pxPorMmDoCartao(larguraMedidaPx: number): number {
  return larguraMedidaPx / LARGURA_CARTAO_MM;
}

export function calibracaoEhPlausivel(pxPorMm: number): boolean {
  return Number.isFinite(pxPorMm) && pxPorMm >= PX_POR_MM_MINIMO && pxPorMm <= PX_POR_MM_MAXIMO;
}

/**
 * Tamanho em pixels que ocupa `graus` de ângulo visual, à distância informada.
 *
 * Trigonometria direta: o estímulo é a base de um triângulo isósceles cujo
 * ápice é o olho. `tan(θ/2) · distância` dá metade da base.
 */
export function grausParaPx(graus: number, distanciaCm: number, pxPorMm: number): number {
  const distanciaMm = distanciaCm * 10;
  const metadeEmRadianos = (graus / 2) * (Math.PI / 180);
  return 2 * distanciaMm * Math.tan(metadeEmRadianos) * pxPorMm;
}

/** Volta de pixels para graus. Usado ao gravar o limiar durante a calibração. */
export function pxParaGraus(px: number, distanciaCm: number, pxPorMm: number): number {
  const distanciaMm = distanciaCm * 10;
  const metade = px / 2 / pxPorMm;
  return 2 * Math.atan(metade / distanciaMm) * (180 / Math.PI);
}

/**
 * O tamanho que um módulo deve usar, dado o perfil e o aparelho.
 *
 * `multiplo` existe porque nem todo elemento é o estímulo principal: um
 * marcador auxiliar pode ser 0.5, uma figura de destaque 1.5. O que nunca
 * acontece é alguém escrever o número em pixels no componente.
 */
export function tamanhoDoEstimulo(
  perfil: Perfil,
  aparelho: CalibracaoDeAparelho | null,
  menorDimensao: number,
  multiplo = 1,
): number {
  const graus = (perfil.limiarAngular ?? LIMIAR_PADRAO_GRAUS) * multiplo;

  // Sem calibração de aparelho não há como converter para tamanho físico.
  // Cair para uma fração da tela é menos exato, mas mantém o app utilizável.
  if (!aparelho || !calibracaoEhPlausivel(aparelho.pxPorMm)) {
    return fracaoDaTela(graus, menorDimensao);
  }

  const px = grausParaPx(graus, perfil.distanciaUsoCm, aparelho.pxPorMm);
  return Math.min(px, menorDimensao);
}

/**
 * Fallback sem calibração: trata o limiar em graus como fração da menor
 * dimensão da tela, ancorado no padrão de 12° ≈ 40% da tela.
 */
function fracaoDaTela(graus: number, menorDimensao: number): number {
  const fracao = (graus / LIMIAR_PADRAO_GRAUS) * 0.4;
  // Um estímulo maior que a tela deixa de ser uma forma e vira um fundo.
  return Math.min(menorDimensao * fracao, menorDimensao);
}
