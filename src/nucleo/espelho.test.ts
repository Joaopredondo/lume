import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirEspelhoLocal, enderecoDoControle, papelDaUrl, type Mensagem } from './espelho';
import { temRede } from './remoto';

/**
 * jsdom não implementa BroadcastChannel entre contextos. O dublê liga todos os
 * canais abertos no mesmo processo, que é exatamente a semântica que interessa:
 * uma superfície fala, a outra escuta.
 */
const canais = new Set<{ nome: string; ouvir: (m: Mensagem) => void }>();

class CanalFalso {
  onmessage: ((evento: { data: Mensagem }) => void) | null = null;
  private registro: { nome: string; ouvir: (m: Mensagem) => void };

  constructor(nome: string) {
    this.registro = { nome, ouvir: (m) => this.onmessage?.({ data: m }) };
    canais.add(this.registro);
  }

  postMessage(mensagem: Mensagem) {
    for (const canal of canais) {
      // O próprio emissor não recebe de volta, como no BroadcastChannel real.
      if (canal !== this.registro) canal.ouvir(mensagem);
    }
  }

  close() {
    canais.delete(this.registro);
  }
}

beforeEach(() => {
  canais.clear();
  vi.stubGlobal('BroadcastChannel', CanalFalso);
});

afterEach(() => vi.unstubAllGlobals());

describe('papel na URL', () => {
  it('sem parâmetro, é o palco', () => {
    expect(papelDaUrl('')).toBe('palco');
    expect(papelDaUrl('?outra=coisa')).toBe('palco');
  });

  it('com ?papel=controle, é a superfície de comando', () => {
    expect(papelDaUrl('?papel=controle')).toBe('controle');
  });

  it('o endereço do controle aponta para a mesma origem', () => {
    expect(enderecoDoControle('https://exemplo.app')).toBe('https://exemplo.app/?papel=controle');
  });
});

describe('espelho local', () => {
  it('entrega a mensagem da outra superfície', () => {
    const recebidas: Mensagem[] = [];
    const palco = abrirEspelhoLocal((m) => recebidas.push(m));
    const controle = abrirEspelhoLocal(() => {});

    controle.enviar({ tipo: 'marcar', respondeu: true });

    expect(recebidas).toEqual([{ tipo: 'marcar', respondeu: true }]);
    palco.fechar();
    controle.fechar();
  });

  it('quem envia não recebe a própria mensagem', () => {
    const recebidas: Mensagem[] = [];
    const canal = abrirEspelhoLocal((m) => recebidas.push(m));

    canal.enviar({ tipo: 'sair' });

    expect(recebidas).toEqual([]);
    canal.fechar();
  });

  it('para de entregar depois de fechado', () => {
    const recebidas: Mensagem[] = [];
    const palco = abrirEspelhoLocal((m) => recebidas.push(m));
    const controle = abrirEspelhoLocal(() => {});

    palco.fechar();
    controle.enviar({ tipo: 'sair' });

    expect(recebidas).toEqual([]);
    controle.fechar();
  });

  it('funciona sem BroadcastChannel, sem quebrar o app', () => {
    // Navegador antigo: o espelho vira no-op em vez de derrubar a sessão.
    vi.stubGlobal('BroadcastChannel', undefined);
    const canal = abrirEspelhoLocal(() => {});

    expect(() => canal.enviar({ tipo: 'sair' })).not.toThrow();
    expect(() => canal.fechar()).not.toThrow();
  });

  it('não exige rede nem servidor — é o que a torna a modalidade padrão', () => {
    vi.stubGlobal('navigator', { onLine: false });

    const recebidas: Mensagem[] = [];
    const palco = abrirEspelhoLocal((m) => recebidas.push(m));
    const controle = abrirEspelhoLocal(() => {});

    controle.enviar({ tipo: 'abrir', moduloId: 'alfabeto' });

    expect(recebidas).toHaveLength(1);
    palco.fechar();
    controle.fechar();
  });
});

describe('modalidade remota', () => {
  it('reconhece a ausência de rede', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(temRede()).toBe(false);
  });

  it('considera que há rede quando o navegador não informa', () => {
    // `onLine` ausente não é o mesmo que offline; assumir offline esconderia a
    // funcionalidade sem motivo.
    vi.stubGlobal('navigator', {});
    expect(temRede()).toBe(true);
  });
});
