import type { Posicao } from '../dados/tipos';

/**
 * Posicionamento do estímulo na tela (seção 3.2).
 *
 * Perda de campo visual é comum, e onde o estímulo aparece importa tanto quanto
 * o tamanho. Um estímulo sempre no centro esconde que a pessoa não enxerga
 * nada à esquerda.
 *
 * Invariante que não pode ser quebrado: **o que se desloca é o estímulo, não a
 * área de toque**. "Tocar em qualquer lugar" continua valendo em todos os
 * módulos, independente de onde a figura esteja.
 */

/** Fração da tela, de 0 (borda inicial) a 1 (borda final). */
export type Ancoragem = { x: number; y: number };

const ANCORAGENS: Record<Posicao, Ancoragem> = {
  centro: { x: 0.5, y: 0.5 },
  esquerda: { x: 0.25, y: 0.5 },
  direita: { x: 0.75, y: 0.5 },
  superior: { x: 0.5, y: 0.25 },
  inferior: { x: 0.5, y: 0.75 },
  q1: { x: 0.25, y: 0.25 },
  q2: { x: 0.75, y: 0.25 },
  q3: { x: 0.25, y: 0.75 },
  q4: { x: 0.75, y: 0.75 },
};

export function ancoragemDe(posicao: Posicao): Ancoragem {
  return ANCORAGENS[posicao];
}

/**
 * Estilo de posicionamento para o estímulo, já garantindo que ele caiba
 * inteiro na tela.
 *
 * Sem o ajuste de borda, um estímulo grande num quadrante ficaria metade fora —
 * e a pessoa pareceria não ter respondido a algo que nunca foi mostrado por
 * inteiro. Aqui ele encosta na borda em vez de vazar.
 */
export function estiloDePosicao(
  posicao: Posicao,
  tamanho: number,
  largura: number,
  altura: number,
): { left: number; top: number; width: number; height: number } {
  const { x, y } = ancoragemDe(posicao);
  const metade = tamanho / 2;

  const centroX = Math.min(Math.max(largura * x, metade), largura - metade);
  const centroY = Math.min(Math.max(altura * y, metade), altura - metade);

  return {
    left: centroX - metade,
    top: centroY - metade,
    width: tamanho,
    height: tamanho,
  };
}
