import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ATAQUE_MINIMO_S,
  FREQUENCIA_MAXIMA_HZ,
  definirMudo,
  estaMudo,
  reiniciarAudio,
  somDeConclusao,
  somDeToque,
  tocar,
} from './audio';

/**
 * jsdom não tem Web Audio. O dublê registra as rampas de ganho para que o
 * envelope da regra 4.5 possa ser verificado de verdade — é o único jeito de
 * provar que o ataque nunca fica curto o bastante para virar um clique.
 */
type Rampa = { valor: number; tempo: number };

const rampas: Rampa[] = [];
let osciladoresCriados: { type: string; frequencia: number }[] = [];

class GanhoFalso {
  gain = {
    setValueAtTime: (valor: number, tempo: number) => rampas.push({ valor, tempo }),
    linearRampToValueAtTime: (valor: number, tempo: number) => rampas.push({ valor, tempo }),
    exponentialRampToValueAtTime: (valor: number, tempo: number) => rampas.push({ valor, tempo }),
  };
  connect() {}
  disconnect() {}
}

class OsciladorFalso {
  type = 'sine';
  frequency = { value: 0 };
  onended: (() => void) | null = null;
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class ContextoFalso {
  currentTime = 0;
  state = 'running';
  destination = {};
  createOscillator() {
    const osc = new OsciladorFalso();
    // O registro acontece no fim de `tocar`, quando type e frequency já foram
    // definidos — por isso guardamos a referência e lemos depois.
    osciladoresCriados.push(osc as unknown as { type: string; frequencia: number });
    return osc;
  }
  createGain() {
    return new GanhoFalso();
  }
  createDynamicsCompressor() {
    return {
      threshold: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: () => {},
    };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  rampas.length = 0;
  osciladoresCriados = [];
  vi.stubGlobal('AudioContext', ContextoFalso);
});

afterEach(() => {
  reiniciarAudio();
  vi.unstubAllGlobals();
});

describe('envelope (regra 4.5)', () => {
  it('o ataque nunca é mais curto que 150ms', () => {
    tocar({ duracaoS: 1 });

    const inicio = rampas[0];
    const pico = rampas[1];
    expect(inicio?.valor).toBe(0);
    expect((pico?.tempo ?? 0) - (inicio?.tempo ?? 0)).toBeGreaterThanOrEqual(ATAQUE_MINIMO_S);
  });

  it('sobe do zero: som que começa no volume final é um clique', () => {
    tocar();
    expect(rampas[0]?.valor).toBe(0);
  });

  it('nota curta encolhe o ataque, mas nunca além da metade da nota', () => {
    // Sem isto, uma nota de 0,2s acabaria antes de chegar ao volume.
    tocar({ duracaoS: 0.2 });

    const ataque = (rampas[1]?.tempo ?? 0) - (rampas[0]?.tempo ?? 0);
    expect(ataque).toBeCloseTo(0.1, 6);
    expect(ataque).toBeLessThanOrEqual(0.2 / 2);
  });

  it('limita a frequência para não ficar estridente', () => {
    tocar({ frequenciaHz: 12000 });
    const osc = osciladoresCriados[0] as unknown as OsciladorFalso | undefined;
    expect(osc?.frequency.value).toBe(FREQUENCIA_MAXIMA_HZ);
  });

  it('limita o ganho mesmo se pedirem mais', () => {
    tocar({ ganho: 10 });
    const pico = rampas[1]?.valor ?? 0;
    expect(pico).toBeLessThanOrEqual(0.35);
  });

  it('usa só senoide e triangular', () => {
    somDeToque();
    somDeConclusao();
    const tipos = osciladoresCriados.map((o) => (o as unknown as OsciladorFalso).type);
    expect(tipos.every((t) => t === 'sine' || t === 'triangle')).toBe(true);
  });
});

describe('mudo', () => {
  it('mudo impede qualquer som e diz que não tocou', () => {
    definirMudo(true);
    expect(estaMudo()).toBe(true);
    expect(tocar()).toBe(false);
    expect(rampas.length).toBe(0);
  });

  it('sem Web Audio, devolve false em vez de fingir que tocou', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(tocar()).toBe(false);
  });
});
