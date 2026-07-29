import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VELOCIDADE_MAXIMA,
  VELOCIDADE_MINIMA,
  VELOCIDADE_PADRAO,
  definirMudoDaFala,
  definirVelocidade,
  falar,
  limitarVelocidade,
  pararFala,
  reiniciarFala,
  tamanhoDaFila,
  velocidadeAtual,
} from './fala';

/** jsdom não tem SpeechSynthesis. O dublê deixa a fila ser observada. */
type Enunciado = { text: string; lang: string; rate: number; onend: (() => void) | null };

let ditos: Enunciado[] = [];
let cancelamentos = 0;

class EnunciadoFalso {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  text: string;

  constructor(texto: string) {
    this.text = texto;
  }
}

beforeEach(() => {
  ditos = [];
  cancelamentos = 0;

  vi.stubGlobal('SpeechSynthesisUtterance', EnunciadoFalso);
  vi.stubGlobal('speechSynthesis', {
    speak: (e: Enunciado) => ditos.push(e),
    cancel: () => {
      cancelamentos += 1;
    },
    getVoices: () => [],
  });
});

afterEach(() => {
  reiniciarFala();
  vi.unstubAllGlobals();
});

describe('velocidade', () => {
  it('fica entre 0.6x e 1.2x', () => {
    expect(limitarVelocidade(0.1)).toBe(VELOCIDADE_MINIMA);
    expect(limitarVelocidade(5)).toBe(VELOCIDADE_MAXIMA);
    expect(limitarVelocidade(0.9)).toBe(0.9);
  });

  it('o padrão é 0.8x', () => {
    expect(velocidadeAtual()).toBe(VELOCIDADE_PADRAO);
  });

  it('aplica a velocidade no que é falado', () => {
    definirVelocidade(1.1);
    falar('olá');
    expect(ditos[0]?.rate).toBe(1.1);
  });
});

describe('fila', () => {
  it('fala em pt-BR', () => {
    falar('vermelho');
    expect(ditos[0]?.lang).toBe('pt-BR');
    expect(ditos[0]?.text).toBe('vermelho');
  });

  it('não sobrepõe: a segunda espera a primeira terminar', () => {
    // Duas falas ao mesmo tempo viram ruído ininteligível.
    falar('primeira');
    falar('segunda');
    expect(ditos.length).toBe(1);

    ditos[0]?.onend?.();
    expect(ditos.length).toBe(2);
    expect(ditos[1]?.text).toBe('segunda');
  });

  it('erro de síntese não trava a fila', () => {
    // Sem voz pt-BR instalada o `end` pode nunca vir; o `error` destrava.
    falar('primeira');
    falar('segunda');

    const primeira = ditos[0] as unknown as EnunciadoFalso;
    primeira.onerror?.();

    expect(ditos.length).toBe(2);
  });

  it('parar esvazia a fila e cancela o que está saindo', () => {
    falar('a');
    falar('b');
    falar('c');
    pararFala();

    expect(tamanhoDaFila()).toBe(0);
    expect(cancelamentos).toBeGreaterThan(0);
  });

  it('ignora texto vazio', () => {
    expect(falar('   ')).toBe(false);
    expect(ditos.length).toBe(0);
  });
});

describe('mudo', () => {
  it('mudo interrompe e impede novas falas', () => {
    falar('antes');
    definirMudoDaFala(true);

    expect(cancelamentos).toBeGreaterThan(0);
    expect(falar('depois')).toBe(false);
  });

  it('sem suporte no navegador, devolve false em vez de fingir', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(falar('olá')).toBe(false);
  });
});
