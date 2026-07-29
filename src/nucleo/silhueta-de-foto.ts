/**
 * Converte uma foto em silhueta de cor única.
 *
 * Foto crua não serve na Camada Estímulo: detalhe fino, textura e gradiente são
 * exatamente o que a baixa visão extrema não resolve. A limiarização joga fora
 * tudo isso e devolve massa sólida sobre transparente — a mesma linguagem dos
 * cartões físicos.
 */

/** Lado máximo do resultado. Silhueta não ganha nada com resolução alta. */
const LADO_MAXIMO = 512;

/** Luminância relativa perceptual (ITU-R BT.709). */
function luminancia(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Limiar automático pelo método de Otsu: separa a imagem em dois grupos
 * maximizando a variância entre eles. Escolher o limiar na mão daria certo numa
 * foto e errado na seguinte, e quem vai cadastrar é o cuidador, não um editor.
 */
export function limiarDeOtsu(histograma: number[]): number {
  const total = histograma.reduce((soma, n) => soma + n, 0);
  if (total === 0) return 128;

  let somaTotal = 0;
  for (let i = 0; i < 256; i += 1) somaTotal += i * (histograma[i] ?? 0);

  let somaFundo = 0;
  let pesoFundo = 0;
  let melhorVariancia = -1;
  let melhorLimiar = 128;

  for (let i = 0; i < 256; i += 1) {
    pesoFundo += histograma[i] ?? 0;
    if (pesoFundo === 0) continue;

    const pesoFrente = total - pesoFundo;
    if (pesoFrente === 0) break;

    somaFundo += i * (histograma[i] ?? 0);
    const mediaFundo = somaFundo / pesoFundo;
    const mediaFrente = (somaTotal - somaFundo) / pesoFrente;
    const variancia = pesoFundo * pesoFrente * (mediaFundo - mediaFrente) ** 2;

    if (variancia > melhorVariancia) {
      melhorVariancia = variancia;
      melhorLimiar = i;
    }
  }

  return melhorLimiar;
}

export function histogramaDe(dados: Uint8ClampedArray): number[] {
  const histograma = new Array<number>(256).fill(0);

  for (let i = 0; i < dados.length; i += 4) {
    const nivel = Math.round(luminancia(dados[i] ?? 0, dados[i + 1] ?? 0, dados[i + 2] ?? 0) * 255);
    histograma[nivel] = (histograma[nivel] ?? 0) + 1;
  }

  return histograma;
}

/**
 * Aplica o limiar no lugar: o que for mais escuro que o corte vira massa opaca,
 * o resto vira transparente.
 *
 * A cor sai branca porque quem escolhe a cor é o momento de exibir — a mesma
 * silhueta é pintada com a cor que o perfil confirmou.
 */
export function limiarizar(imagem: ImageData, limiar: number): ImageData {
  const dados = imagem.data;

  for (let i = 0; i < dados.length; i += 4) {
    const nivel = luminancia(dados[i] ?? 0, dados[i + 1] ?? 0, dados[i + 2] ?? 0) * 255;
    // `<=`, não `<`: Otsu devolve o **último nível da classe escura**, então
    // esse nível pertence à massa. Com `<`, uma foto de dois tons bem separados
    // — justamente o caso ideal — produziria uma silhueta vazia.
    const solido = nivel <= limiar;

    dados[i] = 255;
    dados[i + 1] = 255;
    dados[i + 2] = 255;
    dados[i + 3] = solido ? 255 : 0;
  }

  return imagem;
}

export function dimensoesReduzidas(
  largura: number,
  altura: number,
  maximo = LADO_MAXIMO,
): { largura: number; altura: number } {
  const maior = Math.max(largura, altura);
  if (maior <= maximo) return { largura, altura };

  const fator = maximo / maior;
  return {
    largura: Math.max(1, Math.round(largura * fator)),
    altura: Math.max(1, Math.round(altura * fator)),
  };
}

/** Pipeline completo: arquivo de foto → blob PNG com a silhueta. */
export async function fotoParaSilhueta(arquivo: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const { largura, altura } = dimensoesReduzidas(bitmap.width, bitmap.height);

  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;

  const contexto = tela.getContext('2d');
  if (!contexto) throw new Error('canvas indisponível');

  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const imagem = contexto.getImageData(0, 0, largura, altura);
  const limiar = limiarDeOtsu(histogramaDe(imagem.data));
  contexto.putImageData(limiarizar(imagem, limiar), 0, 0);

  return new Promise((resolver, rejeitar) => {
    tela.toBlob((blob) => {
      if (blob) resolver(blob);
      else rejeitar(new Error('não consegui gerar a silhueta'));
    }, 'image/png');
  });
}
