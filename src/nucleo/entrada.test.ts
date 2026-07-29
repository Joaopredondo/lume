import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { comAbsorcaoDeRepeticao, ouvirAtivacao } from './entrada';
import { DEBOUNCE_MS, LATENCIA_MAXIMA_MS } from './seguranca';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('absorção de toque repetido', () => {
  it('dispara o PRIMEIRO toque imediatamente (regra 4.2)', () => {
    // O ponto clínico inteiro: se o feedback esperar a janela fechar, a
    // relação de causa e efeito se perde.
    const acao = vi.fn();
    const disparar = comAbsorcaoDeRepeticao(acao);

    disparar();
    expect(acao).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(LATENCIA_MAXIMA_MS);
    expect(acao).toHaveBeenCalledTimes(1);
  });

  it('descarta as repetições dentro da janela', () => {
    const acao = vi.fn();
    const disparar = comAbsorcaoDeRepeticao(acao);

    disparar();
    vi.advanceTimersByTime(100);
    disparar();
    vi.advanceTimersByTime(100);
    disparar();

    expect(acao).toHaveBeenCalledTimes(1);
  });

  it('volta a aceitar depois da janela', () => {
    const acao = vi.fn();
    const disparar = comAbsorcaoDeRepeticao(acao);

    disparar();
    vi.advanceTimersByTime(DEBOUNCE_MS);
    disparar();

    expect(acao).toHaveBeenCalledTimes(2);
  });

  it('nunca engole um toque sem nunca ter disparado', () => {
    // Um debounce comum falharia aqui: com um toque só, esperaria a janela.
    const acao = vi.fn();
    comAbsorcaoDeRepeticao(acao)();
    expect(acao).toHaveBeenCalledTimes(1);
  });

  it('reiniciar limpa a janela ao trocar de módulo', () => {
    const acao = vi.fn();
    const disparar = comAbsorcaoDeRepeticao(acao);

    disparar();
    disparar();
    expect(acao).toHaveBeenCalledTimes(1);

    disparar.reiniciar();
    disparar();
    expect(acao).toHaveBeenCalledTimes(2);
  });

  it('repassa os argumentos', () => {
    const acao = vi.fn<(x: number) => void>();
    comAbsorcaoDeRepeticao(acao)(42);
    expect(acao).toHaveBeenCalledWith(42);
  });
});

describe('ouvirAtivacao', () => {
  it('aceita dedo, Espaço e Enter — mas não exige precisão', () => {
    const alvo = document.createElement('div');
    const acao = vi.fn();
    const parar = ouvirAtivacao(alvo, acao);

    fireEvent.pointerDown(alvo);
    expect(acao).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DEBOUNCE_MS);
    fireEvent.keyDown(alvo, { key: ' ' });
    expect(acao).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(DEBOUNCE_MS);
    fireEvent.keyDown(alvo, { key: 'Enter' });
    expect(acao).toHaveBeenCalledTimes(3);

    parar();
  });

  it('usa pointerdown, não click: soltar o dedo pode demorar', () => {
    const alvo = document.createElement('div');
    const acao = vi.fn();
    const parar = ouvirAtivacao(alvo, acao);

    fireEvent.pointerDown(alvo);
    expect(acao).toHaveBeenCalledTimes(1);

    parar();
  });

  it('para de ouvir depois de cancelado', () => {
    const alvo = document.createElement('div');
    const acao = vi.fn();
    ouvirAtivacao(alvo, acao)();

    fireEvent.pointerDown(alvo);
    expect(acao).not.toHaveBeenCalled();
  });
});
