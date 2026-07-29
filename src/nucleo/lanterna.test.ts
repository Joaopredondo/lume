import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarLanterna } from './lanterna';

/**
 * O rAF é controlado à mão para poder observar a suavização quadro a quadro —
 * é o que separa a lanterna de um salto de luz, que a regra 4.1 proíbe.
 */
let quadros: (() => void)[] = [];

function avancarQuadros(quantos: number) {
  for (let i = 0; i < quantos; i += 1) {
    const pendentes = quadros;
    quadros = [];
    for (const quadro of pendentes) quadro();
  }
}

function criarAlvo(): HTMLElement {
  const alvo = document.createElement('div');
  // jsdom devolve 0 para clientWidth/Height; fixamos para ter geometria.
  Object.defineProperty(alvo, 'clientWidth', { value: 1000, configurable: true });
  Object.defineProperty(alvo, 'clientHeight', { value: 800, configurable: true });
  alvo.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
  document.body.append(alvo);
  return alvo;
}

function xDaMascara(alvo: HTMLElement): number {
  const achado = /at ([\d.-]+)px/.exec(alvo.style.maskImage);
  return Number(achado?.[1] ?? Number.NaN);
}

beforeEach(() => {
  quadros = [];
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    quadros.push(cb);
    return quadros.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('lanterna', () => {
  it('começa no centro, sem primeiro quadro com a luz no canto', () => {
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    expect(xDaMascara(alvo)).toBe(500);
    lanterna.parar();
  });

  it('move de forma amortecida, nunca em salto', () => {
    // Passo abrupto de luz é exatamente o que a regra 4.1 proíbe.
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    lanterna.moverPara(900, 400);
    avancarQuadros(1);

    const depoisDeUmQuadro = xDaMascara(alvo);
    expect(depoisDeUmQuadro).toBeGreaterThan(500);
    expect(depoisDeUmQuadro).toBeLessThan(900);

    lanterna.parar();
  });

  it('converge para o destino em vez de parar no meio', () => {
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    lanterna.moverPara(900, 400);
    avancarQuadros(80);

    expect(xDaMascara(alvo)).toBeCloseTo(900, 0);
    lanterna.parar();
  });

  it('segue o ponteiro', () => {
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    fireEvent.pointerMove(alvo, { clientX: 800, clientY: 200 });
    avancarQuadros(80);

    expect(xDaMascara(alvo)).toBeCloseTo(800, 0);
    lanterna.parar();
  });

  it('anda pelas setas quando não há ponteiro (TV)', () => {
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    avancarQuadros(80);

    // Um passo de 4% da largura a partir do centro.
    expect(xDaMascara(alvo)).toBeCloseTo(540, 0);
    lanterna.parar();
  });

  it('dorme depois de ocioso, mas só após alcançar o destino', () => {
    const alvo = criarAlvo();
    const lanterna = criarLanterna(alvo, { raio: 120 });

    lanterna.moverPara(900, 400);
    avancarQuadros(80);

    // Ainda desenhando enquanto a luz não chegou; agora chegou e o tempo passou.
    vi.setSystemTime(Date.now() + 5000);
    avancarQuadros(2);
    quadros = [];
    avancarQuadros(1);

    expect(quadros.length).toBe(0);
    lanterna.parar();
  });

  it('limpa a máscara e os listeners ao parar', () => {
    const alvo = criarAlvo();
    criarLanterna(alvo, { raio: 120 }).parar();

    expect(alvo.style.maskImage).toBe('');

    // Depois de parada, mexer o ponteiro não pode reativar nada.
    fireEvent.pointerMove(alvo, { clientX: 10, clientY: 10 });
    avancarQuadros(5);
    expect(alvo.style.maskImage).toBe('');
  });
});
