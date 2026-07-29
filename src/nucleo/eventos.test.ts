import { fireEvent } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aoMarcarResposta,
  definirEstimuloVigente,
  limparEventos,
  marcarResposta,
  ouvirAtalhoDeMarcacao,
  type EstimuloVigente,
  type EventoResposta,
} from './eventos';

const ESTIMULO: EstimuloVigente = {
  moduloId: 'causa-e-efeito',
  cor: 'amarelo-sinal',
  tamanhoAngular: 6,
  posicao: 'q2',
  pesoFonte: 'extrabold',
};

afterEach(() => limparEventos());

describe('marcação de resposta', () => {
  it('grava junto o estímulo vigente, que é o que torna o dado utilizável', () => {
    definirEstimuloVigente(ESTIMULO);
    const evento = marcarResposta(true, 'teclado');

    expect(evento).toMatchObject({
      respondeu: true,
      origem: 'teclado',
      moduloId: 'causa-e-efeito',
      cor: 'amarelo-sinal',
      tamanhoAngular: 6,
      posicao: 'q2',
    });
  });

  it('não grava nada sem estímulo na tela', () => {
    // Marcar no vazio não é dado, é ruído no histórico.
    expect(marcarResposta(true, 'controle')).toBeNull();
  });

  it('avisa os ouvintes e para de avisar depois de cancelado', () => {
    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    const cancelar = aoMarcarResposta(ouvinte);
    definirEstimuloVigente(ESTIMULO);

    marcarResposta(false, 'controle');
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(ouvinte.mock.calls[0]?.[0]?.respondeu).toBe(false);

    cancelar();
    marcarResposta(true, 'controle');
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });
});

describe('atalho de teclado', () => {
  it('S marca respondeu e N marca não respondeu', () => {
    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    aoMarcarResposta(ouvinte);
    const parar = ouvirAtalhoDeMarcacao();
    definirEstimuloVigente(ESTIMULO);

    fireEvent.keyDown(window, { key: 's' });
    fireEvent.keyDown(window, { key: 'N' }); // maiúscula também vale

    expect(ouvinte.mock.calls.map((c) => c[0].respondeu)).toEqual([true, false]);
    expect(ouvinte.mock.calls.every((c) => c[0].origem === 'teclado')).toBe(true);

    parar();
  });

  it('ignora outras teclas', () => {
    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    aoMarcarResposta(ouvinte);
    const parar = ouvirAtalhoDeMarcacao();
    definirEstimuloVigente(ESTIMULO);

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'a' });

    expect(ouvinte).not.toHaveBeenCalled();
    parar();
  });

  it('não sequestra a tecla enquanto o cuidador digita', () => {
    const campo = document.createElement('input');
    document.body.append(campo);
    campo.focus();

    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    aoMarcarResposta(ouvinte);
    const parar = ouvirAtalhoDeMarcacao();
    definirEstimuloVigente(ESTIMULO);

    fireEvent.keyDown(window, { key: 's' });
    expect(ouvinte).not.toHaveBeenCalled();

    parar();
    campo.remove();
  });
});
