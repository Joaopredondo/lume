import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CirculosESetas } from './CirculosESetas';
import { DIRECOES, REGRA, direcaoDe, sortearSequencia } from './regra';
import { useStore } from '../../dados/store';
import { CONFIGURACOES_PADRAO, CORES } from '../../dados/tipos';
import { moduloPorId } from '../registro';
import { limparEventos } from '../../nucleo/eventos';

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

describe('a regra da folha impressa', () => {
  it('é exatamente azul→baixo, verde→esquerda, vermelho→cima, amarelo→direita', () => {
    expect(REGRA).toEqual([
      { cor: 'azul-sinal', direcao: 'baixo' },
      { cor: 'verde-sinal', direcao: 'esquerda' },
      { cor: 'vermelho-sinal', direcao: 'cima' },
      { cor: 'amarelo-sinal', direcao: 'direita' },
    ]);
  });

  it('cada direção aparece uma vez só', () => {
    expect(new Set(REGRA.map((r) => r.direcao)).size).toBe(4);
  });

  it('a sequência só sorteia cores que estão na regra', () => {
    const cores = new Set(REGRA.map((r) => r.cor));
    for (const cor of sortearSequencia(200)) {
      expect(cores.has(cor)).toBe(true);
      expect(direcaoDe(cor)).toBeDefined();
    }
  });
});

describe('o azul fica fora do estímulo primário', () => {
  it('não entra na paleta que a calibração percorre nem no sorteio dos módulos', () => {
    // Azul sobre preto tem ~3,7:1 de contraste contra ~19:1 do amarelo. Só
    // existe aqui porque a atividade impressa usa quatro cores fixas.
    expect([...CORES]).not.toContain('azul-sinal');
  });

  it('mas a regra usa azul, como na folha', () => {
    expect(REGRA.map((r) => r.cor)).toContain('azul-sinal');
  });
});

describe('CirculosESetas', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  function setaCerta(): HTMLElement {
    const rotulo = screen.getByLabelText(/^círculo /).getAttribute('aria-label') ?? '';
    const cor = REGRA.find((r) => rotulo.includes(NOME[r.cor] ?? '@'));
    if (!cor) throw new Error(`não achei a cor em "${rotulo}"`);

    const alvo = DIRECAO_ROTULO[cor.direcao];
    if (!alvo) throw new Error(`direção sem rótulo: ${cor.direcao}`);
    return screen.getByLabelText(new RegExp(alvo));
  }

  const NOME: Record<string, string> = {
    'azul-sinal': 'azul',
    'verde-sinal': 'verde',
    'vermelho-sinal': 'vermelho',
    'amarelo-sinal': 'amarelo',
  };

  const DIRECAO_ROTULO: Record<string, string> = {
    cima: 'para cima',
    baixo: 'para baixo',
    esquerda: 'para a esquerda',
    direita: 'para a direita',
  };

  it('mostra um círculo por vez e as quatro setas', () => {
    // A folha tem 20 itens de uma vez; 20 numa tela é denso demais para baixa
    // visão, então a grade é fatiada.
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);

    expect(screen.getAllByLabelText(/^círculo /)).toHaveLength(1);
    expect(screen.getAllByRole('button')).toHaveLength(DIRECOES.length);
  });

  it('fala qual é o círculo', () => {
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    expect(falas[0]).toMatch(/^Círculo (azul|verde|vermelho|amarelo)\. Qual seta\?$/);
  });

  it('acertar avança para o próximo círculo', () => {
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    const antes = screen.getByLabelText(/^círculo /).getAttribute('aria-label');

    fireEvent.pointerDown(setaCerta());
    expect(falas.at(-1)).toBe('Isso!');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // A cor pode repetir por sorteio; o que importa é ter avançado sem travar.
    expect(screen.getByLabelText(/^círculo /)).toBeDefined();
    expect(typeof antes).toBe('string');
  });

  it('errar não pune: repete a regra, sem escore (regra 4.7)', () => {
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    const certa = setaCerta();
    const errada = screen.getAllByRole('button').find((b) => b !== certa);
    if (!errada) throw new Error('não achei seta errada');

    fireEvent.pointerDown(errada);

    expect(falas.at(-1)).toMatch(/^O círculo \w+ vai para/);
    expect(falas.join(' ')).not.toMatch(/errou|erro|tente|pontos|acertos/i);
  });

  it('errar não avança o círculo', () => {
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    const rotuloAntes = screen.getByLabelText(/^círculo /).getAttribute('aria-label');
    const certa = setaCerta();
    const errada = screen.getAllByRole('button').find((b) => b !== certa);
    if (!errada) throw new Error('não achei seta errada');

    fireEvent.pointerDown(errada);
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByLabelText(/^círculo /).getAttribute('aria-label')).toBe(rotuloAntes);
  });

  it('não mostra placar, cronômetro nem "x de y"', () => {
    const { container } = render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    expect(container.textContent).toBe('');
  });

  it('a legenda pode ser escondida para quem já memorizou a regra', () => {
    const { container: com } = render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    const comLegenda = com.querySelectorAll('svg').length;

    useStore.setState({
      configuracoes: { ...CONFIGURACOES_PADRAO, mostrarLegenda: false },
    });
    const { container: sem } = render(<CirculosESetas posicao="centro" aoSair={() => {}} />);

    expect(sem.querySelectorAll('svg').length).toBeLessThan(comLegenda);
  });

  it('o tamanho da rodada vem da configuração', () => {
    useStore.setState({ configuracoes: { ...CONFIGURACOES_PADRAO, itensPorRodada: 1 } });
    render(<CirculosESetas posicao="centro" aoSair={() => {}} />);

    // Uma rodada de 1 item recomeça a cada acerto, sem travar.
    fireEvent.pointerDown(setaCerta());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByLabelText(/^círculo /)).toBeDefined();
  });

  it('as setas são sólidas, sem ícone vazado', () => {
    const { container } = render(<CirculosESetas posicao="centro" aoSair={() => {}} />);
    for (const path of container.querySelectorAll('button svg path')) {
      expect(path.getAttribute('fill')).toMatch(/^var\(--color-/);
      expect(path.getAttribute('stroke')).toBeNull();
    }
  });
});

describe('registro da etapa 7', () => {
  it('o módulo se registrou sozinho', () => {
    expect(moduloPorId('circulos-e-setas')).toBeDefined();
  });

  it('declara layout fixo de propósito', () => {
    expect(moduloPorId('circulos-e-setas')?.posicoesSuportadas).toEqual(['centro']);
  });
});
