import { act, render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CausaEEfeito } from './causa-e-efeito/CausaEEfeito';
import { EstimulacaoVisual } from './estimulacao-visual/EstimulacaoVisual';
import { MODULOS, moduloPorId, posicaoValida, sortearPosicao } from './registro';
import {
  aoMarcarResposta,
  limparEventos,
  ouvirAtalhoDeMarcacao,
  type EventoResposta,
} from '../nucleo/eventos';
import { LATENCIA_MAXIMA_MS } from '../nucleo/seguranca';

beforeAll(() => {
  vi.stubGlobal('AudioContext', undefined);
});

afterEach(() => limparEventos());

describe('registro de módulos', () => {
  it('coletou os módulos sem lista central', () => {
    expect(moduloPorId('causa-e-efeito')).toBeDefined();
    expect(moduloPorId('estimulacao-visual')).toBeDefined();
  });

  it('todo módulo declara ao menos uma posição suportada', () => {
    for (const modulo of MODULOS) {
      expect(modulo.posicoesSuportadas.length).toBeGreaterThan(0);
    }
  });

  it('posição não suportada cai numa que o módulo aceita, sem quebrar', () => {
    // Estimulação visual atravessa na horizontal: 'esquerda' não muda nada,
    // então o módulo não a declara e a preferência do perfil é acomodada.
    const modulo = moduloPorId('estimulacao-visual');
    if (!modulo) throw new Error('módulo ausente');

    const escolhida = posicaoValida(modulo, 'esquerda');
    expect(modulo.posicoesSuportadas).toContain(escolhida);
  });

  it('o sorteio só devolve posições que o módulo aceita', () => {
    const modulo = moduloPorId('estimulacao-visual');
    if (!modulo) throw new Error('módulo ausente');

    for (let i = 0; i < 30; i += 1) {
      expect(modulo.posicoesSuportadas).toContain(sortearPosicao(modulo));
    }
  });
});

describe('Causa e efeito', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('a forma aparece dentro do limite de latência (regra 4.2)', () => {
    // O ponto clínico do módulo inteiro: se o efeito não é percebido junto com
    // o toque, a pessoa não liga uma coisa à outra.
    const { container } = render(<CausaEEfeito posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    expect(area.children.length).toBe(0);

    fireEvent.pointerDown(area);
    vi.advanceTimersByTime(LATENCIA_MAXIMA_MS);

    expect(area.children.length).toBe(1);
  });

  it('não deixa toque involuntário repetido virar uma pilha de formas', () => {
    const { container } = render(<CausaEEfeito posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    fireEvent.pointerDown(area);
    fireEvent.pointerDown(area);

    expect(area.children.length).toBe(1);
  });

  it('a forma some sozinha depois da animação', () => {
    const { container } = render(<CausaEEfeito posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    expect(area.children.length).toBe(1);

    // act: a remoção é uma atualização de estado disparada por setTimeout, e
    // sem isso o React não aplica o resultado antes da asserção.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(area.children.length).toBe(0);
  });

  it('registra o estímulo, e a marcação do cuidador vira dado completo', () => {
    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    aoMarcarResposta(ouvinte);
    const pararMarcacao = ouvirAtalhoDeMarcacao();

    const { container } = render(<CausaEEfeito posicao="q3" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    fireEvent.keyDown(window, { key: 's' });

    const evento = ouvinte.mock.calls[0]?.[0];
    expect(evento?.respondeu).toBe(true);
    expect(evento?.moduloId).toBe('causa-e-efeito');
    expect(evento?.posicao).toBe('q3');
    expect(evento?.cor).toBeDefined();

    pararMarcacao();
  });
});

describe('Estimulação visual', () => {
  it('é passivo: já mostra o estímulo sem nenhum toque', () => {
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    expect(container.querySelectorAll('[aria-hidden]').length).toBe(1);
  });

  it('encadeia a próxima travessia ao terminar a animação', () => {
    // Encadear em vez de usar `infinite` mantém a lanterna como única animação
    // contínua do app — que é o que o teste da regra 4.1 verifica.
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    const forma = container.querySelector('[aria-hidden]');
    if (!forma) throw new Error('estímulo ausente');

    fireEvent.animationEnd(forma, { animationName: 'atravessar' });

    // O que não pode é o estímulo sumir e a tela ficar morta entre travessias.
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
  });

  it('o fim do fade NÃO reinicia a travessia (regra 4.1)', () => {
    // O elemento roda duas animações; `animationend` dispara para cada uma.
    // Sem filtrar pelo nome, o fade de 2s reiniciaria a travessia de 12s: a
    // forma nunca completaria o percurso e a cor trocaria a 0,5 Hz.
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    const forma = container.querySelector('[aria-hidden]');
    if (!forma) throw new Error('estímulo ausente');

    const chaveAntes = forma.getAttribute('style');
    fireEvent.animationEnd(forma, { animationName: 'entrar-por-fade' });

    const depois = container.querySelector('[aria-hidden]');
    expect(depois?.getAttribute('style')).toBe(chaveAntes);
  });

  it('a travessia percorre a tela inteira, sem sumir na metade do caminho', () => {
    // Distância simétrica deixaria a forma fora da tela metade do tempo, e o
    // cuidador olhando para o vazio por vários segundos.
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    const forma = container.querySelector('[aria-hidden]');
    const estilo = forma?.getAttribute('style') ?? '';

    const entrada = /--entrada:\s*(-?[\d.]+)px/.exec(estilo);
    const saida = /--saida:\s*(-?[\d.]+)px/.exec(estilo);

    expect(Number(entrada?.[1])).toBeLessThanOrEqual(0);
    expect(Number(saida?.[1])).toBe(window.innerWidth);
  });

  it('registra o estímulo vigente para a marcação fazer sentido', () => {
    const ouvinte = vi.fn<(evento: EventoResposta) => void>();
    aoMarcarResposta(ouvinte);
    const pararMarcacao = ouvirAtalhoDeMarcacao();

    render(<EstimulacaoVisual posicao="superior" aoSair={() => {}} />);
    fireEvent.keyDown(window, { key: 'n' });

    const evento = ouvinte.mock.calls[0]?.[0];
    expect(evento?.respondeu).toBe(false);
    expect(evento?.moduloId).toBe('estimulacao-visual');
    expect(evento?.posicao).toBe('superior');

    pararMarcacao();
  });
});
