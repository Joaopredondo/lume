import { describe, expect, it } from 'vitest';
import { dimensoesReduzidas, histogramaDe, limiarDeOtsu, limiarizar } from './silhueta-de-foto';

/** Monta ImageData sem canvas: jsdom não implementa getImageData de verdade. */
function imagemDe(pixels: [number, number, number][]): ImageData {
  const dados = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b], i) => {
    dados[i * 4] = r;
    dados[i * 4 + 1] = g;
    dados[i * 4 + 2] = b;
    dados[i * 4 + 3] = 255;
  });
  return { data: dados, width: pixels.length, height: 1, colorSpace: 'srgb' } as ImageData;
}

describe('limiar de Otsu', () => {
  it('encontra o corte entre dois grupos bem separados', () => {
    // Metade escura, metade clara: o corte tem que cair no meio do vale.
    const histograma = new Array<number>(256).fill(0);
    histograma[20] = 500;
    histograma[220] = 500;

    // Otsu devolve o último nível da classe escura, então o corte fica em 20 e
    // o `limiarizar` inclui esse nível na massa (ver o `<=` lá).
    const limiar = limiarDeOtsu(histograma);
    expect(limiar).toBeGreaterThanOrEqual(20);
    expect(limiar).toBeLessThan(220);

    // O que realmente importa: o tom escuro vira massa, o claro vira vazio.
    const teste = imagemDe([
      [20, 20, 20],
      [220, 220, 220],
    ]);
    const saida = limiarizar(teste, limiar);
    expect(saida.data[3]).toBe(255);
    expect(saida.data[7]).toBe(0);
  });

  it('devolve um valor utilizável com histograma vazio', () => {
    // Escolher o limiar na mão daria certo numa foto e errado na seguinte;
    // o caso degenerado não pode explodir.
    expect(limiarDeOtsu(new Array<number>(256).fill(0))).toBe(128);
  });
});

describe('histograma', () => {
  it('conta por luminância perceptual, não por média de canais', () => {
    // Verde puro é bem mais luminoso que azul puro, e a conta tem que refletir
    // isso — senão a silhueta sai errada em foto colorida.
    const verde = histogramaDe(imagemDe([[0, 255, 0]]).data);
    const azul = histogramaDe(imagemDe([[0, 0, 255]]).data);

    const nivelVerde = verde.findIndex((n) => n > 0);
    const nivelAzul = azul.findIndex((n) => n > 0);

    expect(nivelVerde).toBeGreaterThan(nivelAzul);
  });
});

describe('limiarização', () => {
  it('o escuro vira massa opaca e o claro vira transparente', () => {
    const imagem = imagemDe([
      [0, 0, 0],
      [255, 255, 255],
    ]);

    const saida = limiarizar(imagem, 128);
    expect(saida.data[3]).toBe(255);
    expect(saida.data[7]).toBe(0);
  });

  it('a saída é branca, para ser pintada com a cor do perfil na hora de exibir', () => {
    const saida = limiarizar(imagemDe([[10, 40, 30]]), 128);
    expect([saida.data[0], saida.data[1], saida.data[2]]).toEqual([255, 255, 255]);
  });

  it('não sobra nenhum tom intermediário — silhueta não tem gradiente', () => {
    const imagem = imagemDe([
      [0, 0, 0],
      [90, 90, 90],
      [160, 160, 160],
      [255, 255, 255],
    ]);

    const saida = limiarizar(imagem, 128);
    for (let i = 3; i < saida.data.length; i += 4) {
      expect([0, 255]).toContain(saida.data[i]);
    }
  });
});

describe('redução', () => {
  it('encolhe mantendo proporção', () => {
    expect(dimensoesReduzidas(2000, 1000, 512)).toEqual({ largura: 512, altura: 256 });
  });

  it('não amplia imagem pequena', () => {
    expect(dimensoesReduzidas(100, 80, 512)).toEqual({ largura: 100, altura: 80 });
  });

  it('nunca devolve dimensão zero', () => {
    const { largura, altura } = dimensoesReduzidas(5000, 3, 512);
    expect(largura).toBeGreaterThan(0);
    expect(altura).toBeGreaterThan(0);
  });
});
