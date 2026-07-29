import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INTERVALO_MAXIMO_MS,
  INTERVALO_MINIMO_MS,
  criarVarredura,
  limitarIntervalo,
} from './varredura';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('limitarIntervalo', () => {
  it('nunca fica abaixo de 2s — não dá tempo de reagir', () => {
    expect(limitarIntervalo(100)).toBe(INTERVALO_MINIMO_MS);
  });

  it('nunca passa de 8s', () => {
    expect(limitarIntervalo(60000)).toBe(INTERVALO_MAXIMO_MS);
  });

  it('respeita o que está dentro da faixa', () => {
    expect(limitarIntervalo(4000)).toBe(4000);
  });
});

describe('varredura', () => {
  it('destaca o primeiro item imediatamente ao iniciar', () => {
    // Começar com nada destacado por 4s deixaria a tela morta.
    const aoDestacar = vi.fn();
    criarVarredura({
      totalDeItens: 3,
      intervaloMs: 4000,
      aoDestacar,
      aoSelecionar: vi.fn(),
    }).iniciar();

    expect(aoDestacar).toHaveBeenCalledWith(0);
  });

  it('avança e dá a volta', () => {
    const aoDestacar = vi.fn();
    const varredura = criarVarredura({
      totalDeItens: 3,
      intervaloMs: 2000,
      aoDestacar,
      aoSelecionar: vi.fn(),
    });

    varredura.iniciar();
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(2000);

    expect(aoDestacar.mock.calls.map((c) => c[0])).toEqual([0, 1, 2, 0]);
    varredura.parar();
  });

  it('seleciona o item destacado no momento', () => {
    const aoSelecionar = vi.fn();
    const varredura = criarVarredura({
      totalDeItens: 4,
      intervaloMs: 2000,
      aoDestacar: vi.fn(),
      aoSelecionar,
    });

    varredura.iniciar();
    vi.advanceTimersByTime(2000);
    varredura.selecionar();

    expect(aoSelecionar).toHaveBeenCalledWith(1);
  });

  it('para ao selecionar, para não rodar por baixo da tela seguinte', () => {
    const aoDestacar = vi.fn();
    const varredura = criarVarredura({
      totalDeItens: 3,
      intervaloMs: 2000,
      aoDestacar,
      aoSelecionar: vi.fn(),
    });

    varredura.iniciar();
    varredura.selecionar();
    const chamadasAteAqui = aoDestacar.mock.calls.length;

    vi.advanceTimersByTime(10000);
    expect(aoDestacar.mock.calls.length).toBe(chamadasAteAqui);
  });

  it('iniciar duas vezes não cria dois timers', () => {
    const aoDestacar = vi.fn();
    const varredura = criarVarredura({
      totalDeItens: 3,
      intervaloMs: 2000,
      aoDestacar,
      aoSelecionar: vi.fn(),
    });

    varredura.iniciar();
    varredura.iniciar();
    aoDestacar.mockClear();

    vi.advanceTimersByTime(2000);
    expect(aoDestacar).toHaveBeenCalledTimes(1);

    varredura.parar();
  });

  it('lida com lista vazia sem quebrar', () => {
    const aoSelecionar = vi.fn();
    const varredura = criarVarredura({
      totalDeItens: 0,
      intervaloMs: 2000,
      aoDestacar: vi.fn(),
      aoSelecionar,
    });

    varredura.iniciar();
    varredura.selecionar();
    expect(aoSelecionar).not.toHaveBeenCalled();
  });
});
