import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Alfabeto } from './alfabeto/Alfabeto';
import { ALFABETO } from './alfabeto/palavras';
import { CoresEFormas } from './cores-e-formas/CoresEFormas';
import { Numeros } from './numeros/Numeros';
import { moduloPorId } from './registro';
import { limparEventos } from '../nucleo/eventos';

const falas: string[] = [];

beforeAll(() => {
  vi.stubGlobal('AudioContext', undefined);
});

beforeEach(() => {
  falas.length = 0;
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      text: string;
      constructor(texto: string) {
        this.text = texto;
      }
    },
  );
  vi.stubGlobal('speechSynthesis', {
    speak: (e: { text: string; onend?: (() => void) | null }) => {
      falas.push(e.text);
      // Encerra na hora para a fila não travar entre asserções.
      e.onend?.();
    },
    cancel: () => {},
    getVoices: () => [],
  });
});

afterEach(() => {
  limparEventos();
  vi.unstubAllGlobals();
});

describe('registro da etapa 5', () => {
  it('os três módulos se registraram sozinhos', () => {
    expect(moduloPorId('alfabeto')).toBeDefined();
    expect(moduloPorId('numeros')).toBeDefined();
    expect(moduloPorId('cores-e-formas')).toBeDefined();
  });
});

describe('Alfabeto', () => {
  it('mostra a letra e só revela a palavra ao toque', () => {
    const { container } = render(<Alfabeto posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    expect(screen.getByLabelText('A')).toBeDefined();
    expect(falas).toEqual([]);

    fireEvent.pointerDown(area);
    expect(falas[0]).toBe('A. abelha');
  });

  it('o segundo toque avança para a próxima letra', () => {
    const { container } = render(<Alfabeto posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    // Fora da janela de absorção de repetição, senão o toque é descartado.
    vi.setSystemTime(Date.now() + 1000);
    fireEvent.pointerDown(area);

    expect(screen.getByLabelText('B')).toBeDefined();
  });

  it('a tecla M alterna maiúscula e minúscula', () => {
    render(<Alfabeto posicao="centro" aoSair={() => {}} />);
    expect(screen.getByLabelText('A').textContent).toBe('A');

    fireEvent.keyDown(window, { key: 'm' });
    expect(screen.getByLabelText('A').textContent).toBe('a');
  });

  it('toda letra tem palavra, e letra sem silhueta não é caso de erro', () => {
    expect(ALFABETO).toHaveLength(26);
    for (const entrada of ALFABETO) {
      expect(entrada.palavra.length).toBeGreaterThan(1);
    }
    // Nem toda letra precisa de figura: a palavra falada já é o conteúdo.
    expect(ALFABETO.some((e) => e.silhueta === undefined)).toBe(true);
  });
});

describe('Números', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('círculo aceso NUNCA apaga durante a contagem (regra 4.1)', () => {
    // É o ponto de segurança do módulo: apagar e reacender seria piscar.
    // A contagem só pode crescer.
    const { container } = render(<Numeros posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);

    let maximoVisto = 0;
    for (let passo = 0; passo < 12; passo += 1) {
      act(() => {
        vi.advanceTimersByTime(600);
      });
      const acesos = container.querySelectorAll('[aria-hidden]');
      const ligados = [...acesos].filter(
        (n) => !(n as HTMLElement).style.backgroundColor.includes('transparent'),
      ).length;

      expect(ligados).toBeGreaterThanOrEqual(maximoVisto);
      maximoVisto = Math.max(maximoVisto, ligados);
    }
  });

  it('a quantidade de círculos bate com o numeral', () => {
    const { container } = render(<Numeros posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    const numeral = Number(screen.getByLabelText(/^\d$/).textContent);
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(numeral);
  });

  it('não acumula temporizadores ao desmontar', () => {
    const { container, unmount } = render(<Numeros posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    unmount();

    // Sem limpeza, os setTimeout pendentes tentariam falar depois de fechado.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(10000);
      });
    }).not.toThrow();
  });
});

describe('Cores e formas', () => {
  it('mostra duas opções e fala a instrução', () => {
    render(<CoresEFormas posicao="centro" aoSair={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(falas[0]).toMatch(/^Toque no /);
  });

  it('o distrator difere em cor OU em forma, nunca nas duas', () => {
    // Diferença dupla torna a escolha trivial e não diz o que a pessoa está
    // discriminando.
    for (let rodada = 0; rodada < 20; rodada += 1) {
      const { unmount, container } = render(<CoresEFormas posicao="centro" aoSair={() => {}} />);
      const rotulos = [...container.querySelectorAll('button')].map(
        (b) => b.getAttribute('aria-label') ?? '',
      );
      const [a, b] = rotulos;
      expect(a).not.toBe(b);

      const [formaA, ...corA] = (a ?? '').split(' ');
      const [formaB, ...corB] = (b ?? '').split(' ');
      const formaMudou = formaA !== formaB;
      const corMudou = corA.join(' ') !== corB.join(' ');

      expect(formaMudou !== corMudou).toBe(true);
      unmount();
    }
  });

  it('errar não produz punição — só repete a instrução (regra 4.7)', () => {
    render(<CoresEFormas posicao="centro" aoSair={() => {}} />);
    const instrucao = falas[0] ?? '';
    const errado = screen
      .getAllByRole('button')
      .find((b) => !instrucao.includes(b.getAttribute('aria-label') ?? ''));
    if (!errado) throw new Error('não achei a opção errada');

    fireEvent.pointerDown(errado);

    // A última fala é a mesma instrução, sem "errou", sem placar.
    expect(falas.at(-1)).toBe(instrucao);
    expect(falas.join(' ')).not.toMatch(/errou|erro|tente de novo|pontos/i);
  });

  it('não mostra placar, cronômetro nem contagem de tentativas', () => {
    const { container } = render(<CoresEFormas posicao="centro" aoSair={() => {}} />);
    expect(container.textContent).toBe('');
  });
});
