import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Animais } from './animais/Animais';
import { Tracado } from './tracado/Tracado';
import { moduloPorId } from './registro';
import { useStore } from '../dados/store';
import { CONFIGURACOES_PADRAO } from '../dados/tipos';
import { aoMarcarResposta, limparEventos, ouvirAtalhoDeMarcacao } from '../nucleo/eventos';
import { escalarPercurso, gerarPercurso, pontoEm } from '../nucleo/tracado';

const falas: string[] = [];

beforeAll(() => vi.stubGlobal('AudioContext', undefined));

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
      e.onend?.();
    },
    cancel: () => {},
    getVoices: () => [],
  });
});

afterEach(() => {
  limparEventos();
  useStore.setState({ configuracoes: { ...CONFIGURACOES_PADRAO } });
  vi.unstubAllGlobals();
});

describe('Animais', () => {
  it('mostra os sete dos cartões físicos, em silhueta SVG', () => {
    const { container } = render(<Animais posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    const vistos = new Set<string>();
    for (let i = 0; i < 7; i += 1) {
      const svg = container.querySelector('svg[role="img"]');
      vistos.add(svg?.getAttribute('aria-label') ?? '');
      vi.setSystemTime(Date.now() + 1000);
      fireEvent.pointerDown(area);
    }

    expect(vistos).toEqual(
      new Set(['polvo', 'peixe', 'elefante', 'foca', 'baleia', 'borboleta', 'passarinho']),
    );
  });

  it('a silhueta usa cor sólida única, sem contorno de outline', () => {
    // Traço fino de cor sobre cor é o que está proibido; detalhe interno em
    // preto é recorte e faz parte da identidade dos cartões.
    const { container } = render(<Animais posicao="centro" aoSair={() => {}} />);
    const corpo = container.querySelector('svg[role="img"] path');

    expect(corpo?.getAttribute('fill')).toMatch(/^var\(--color-/);
    expect(corpo?.getAttribute('stroke')).toBeNull();
  });

  it('sem calibração, a silhueta ocupa boa parte da tela', () => {
    const { container } = render(<Animais posicao="centro" aoSair={() => {}} />);
    const svg = container.querySelector('svg[role="img"]');
    const menor = Math.min(window.innerWidth, window.innerHeight);

    expect(Number(svg?.getAttribute('width'))).toBeGreaterThanOrEqual(menor * 0.7);
  });

  it('fala o nome do animal ao avançar', () => {
    const { container } = render(<Animais posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);
    expect(falas[0]).toBe('peixe');
  });
});

describe('Traçado', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  function areaDe(container: HTMLElement) {
    const area = container.firstElementChild as HTMLElement | null;
    if (!area) throw new Error('container ausente');
    area.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
    return area;
  }

  function offsetDoPercorrido(container: HTMLElement): number {
    const caminhos = container.querySelectorAll('path');
    return Number(caminhos[1]?.getAttribute('stroke-dashoffset') ?? Number.NaN);
  }

  it('começa com nada percorrido e o ponto de partida visível', () => {
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const total = Number(container.querySelectorAll('path')[1]?.getAttribute('stroke-dasharray'));

    expect(offsetDoPercorrido(container)).toBeCloseTo(total, 5);
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('o dedo sobre a linha preenche em amarelo', () => {
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const area = areaDe(container);
    const antes = offsetDoPercorrido(container);

    const pontos = escalarPercurso(
      gerarPercurso('reta-horizontal'),
      window.innerWidth,
      window.innerHeight,
    );
    const alvo = pontoEm(pontos, 0.08);
    fireEvent.pointerMove(area, { clientX: alvo.x, clientY: alvo.y });

    expect(offsetDoPercorrido(container)).toBeLessThan(antes);
  });

  it('soltar o dedo não reinicia: o progresso não volta', () => {
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const area = areaDe(container);
    const pontos = escalarPercurso(
      gerarPercurso('reta-horizontal'),
      window.innerWidth,
      window.innerHeight,
    );

    const meio = pontoEm(pontos, 0.08);
    fireEvent.pointerMove(area, { clientX: meio.x, clientY: meio.y });
    const depoisDeAndar = offsetDoPercorrido(container);

    // Dedo bem longe da linha — equivale a soltar.
    fireEvent.pointerMove(area, { clientX: 10, clientY: window.innerHeight - 10 });
    expect(offsetDoPercorrido(container)).toBe(depoisDeAndar);

    // E volta a andar de onde parou.
    const adiante = pontoEm(pontos, 0.16);
    fireEvent.pointerMove(area, { clientX: adiante.x, clientY: adiante.y });
    expect(offsetDoPercorrido(container)).toBeLessThan(depoisDeAndar);
  });

  it('ao concluir, comemora e acende a linha inteira', () => {
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const area = areaDe(container);
    const pontos = escalarPercurso(
      gerarPercurso('reta-horizontal'),
      window.innerWidth,
      window.innerHeight,
    );

    for (let i = 0; i <= 100; i += 1) {
      const p = pontoEm(pontos, i / 100);
      fireEvent.pointerMove(area, { clientX: p.x, clientY: p.y });
    }

    expect(falas.at(-1)).toBe('Muito bem!');
    expect(offsetDoPercorrido(container)).toBe(0);
  });

  it('avança pelo teclado, para quem não aponta', () => {
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const antes = offsetDoPercorrido(container);

    fireEvent.keyDown(window, { key: ' ' });
    expect(offsetDoPercorrido(container)).toBeLessThan(antes);
  });

  it('o ponto de partida pulsa só com transform, em ciclo de 4s', () => {
    // É a única animação repetida do app. A regra 4.1 só a permite porque não
    // mexe em luminância — ver a verificação em seguranca.test.ts.
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const estilo = container.querySelector('circle')?.getAttribute('style') ?? '';

    expect(estilo).toContain('pulsar-partida');
    expect(estilo).toContain('4s');
  });

  it('com Modo calmo, o ponto de partida não pulsa', () => {
    useStore.setState({ configuracoes: { ...CONFIGURACOES_PADRAO, modoCalmo: true } });
    const { container } = render(<Tracado posicao="centro" aoSair={() => {}} />);
    const estilo = container.querySelector('circle')?.getAttribute('style') ?? '';

    expect(estilo).not.toContain('pulsar-partida');
  });

  it('registra o estímulo para a marcação do cuidador', () => {
    const ouvinte = vi.fn();
    aoMarcarResposta(ouvinte);
    const parar = ouvirAtalhoDeMarcacao();

    render(<Tracado posicao="centro" aoSair={() => {}} />);
    fireEvent.keyDown(window, { key: 's' });

    expect(ouvinte).toHaveBeenCalledTimes(1);
    parar();
  });
});

describe('registro da etapa 6', () => {
  it('os dois módulos se registraram sozinhos', () => {
    expect(moduloPorId('animais')).toBeDefined();
    expect(moduloPorId('tracado')).toBeDefined();
  });

  it('Traçado declara layout fixo de propósito', () => {
    expect(moduloPorId('tracado')?.posicoesSuportadas).toEqual(['centro']);
  });
});

describe('acessibilidade das silhuetas', () => {
  it('a silhueta tem rótulo, para leitor de tela e para o histórico', () => {
    render(<Animais posicao="centro" aoSair={() => {}} />);
    expect(screen.getByRole('img')).toBeDefined();
  });
});
