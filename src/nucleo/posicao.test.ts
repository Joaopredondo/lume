import { describe, expect, it } from 'vitest';
import { POSICOES } from '../dados/tipos';
import { ancoragemDe, estiloDePosicao } from './posicao';

const LARGURA = 1000;
const ALTURA = 800;

describe('ancoragem', () => {
  it('cobre todas as posições declaradas', () => {
    // Se alguém adicionar uma posição em tipos.ts e esquecer aqui, o estímulo
    // iria parar no canto sem ninguém notar.
    for (const posicao of POSICOES) {
      const ancoragem = ancoragemDe(posicao);
      expect(ancoragem.x).toBeGreaterThan(0);
      expect(ancoragem.x).toBeLessThan(1);
      expect(ancoragem.y).toBeGreaterThan(0);
      expect(ancoragem.y).toBeLessThan(1);
    }
  });

  it('os quatro quadrantes são distintos entre si', () => {
    const chaves = (['q1', 'q2', 'q3', 'q4'] as const).map((q) => {
      const a = ancoragemDe(q);
      return `${a.x},${a.y}`;
    });
    expect(new Set(chaves).size).toBe(4);
  });
});

describe('estiloDePosicao', () => {
  it('centraliza no centro', () => {
    const estilo = estiloDePosicao('centro', 200, LARGURA, ALTURA);
    expect(estilo.left).toBe(LARGURA / 2 - 100);
    expect(estilo.top).toBe(ALTURA / 2 - 100);
  });

  it('coloca cada quadrante no seu lado', () => {
    const q1 = estiloDePosicao('q1', 100, LARGURA, ALTURA);
    const q4 = estiloDePosicao('q4', 100, LARGURA, ALTURA);

    expect(q1.left).toBeLessThan(LARGURA / 2);
    expect(q1.top).toBeLessThan(ALTURA / 2);
    expect(q4.left).toBeGreaterThan(LARGURA / 2);
    expect(q4.top).toBeGreaterThan(ALTURA / 2);
  });

  it('nunca deixa o estímulo vazar da tela', () => {
    // Metade fora da tela faria a pessoa parecer não responsiva a algo que
    // nunca foi mostrado inteiro.
    for (const posicao of POSICOES) {
      const estilo = estiloDePosicao(posicao, 700, LARGURA, ALTURA);
      expect(estilo.left).toBeGreaterThanOrEqual(0);
      expect(estilo.top).toBeGreaterThanOrEqual(0);
      expect(estilo.left + estilo.width).toBeLessThanOrEqual(LARGURA);
      expect(estilo.top + estilo.height).toBeLessThanOrEqual(ALTURA);
    }
  });

  it('em tela estreita de celular, ainda cabe', () => {
    const estilo = estiloDePosicao('q2', 300, 360, 640);
    expect(estilo.left).toBeGreaterThanOrEqual(0);
    expect(estilo.left + estilo.width).toBeLessThanOrEqual(360);
  });
});
