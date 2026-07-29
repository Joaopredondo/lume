import type { Configuracoes } from '../dados/tipos';
import type { EstimuloVigente } from './eventos';

/**
 * Espelho: uma superfície mostra o estímulo, outra controla.
 *
 * Resolve um problema real — operar o app no escuro sem se colocar na frente
 * da pessoa atendida.
 *
 * O barramento é agnóstico de transporte de propósito. A modalidade padrão usa
 * `BroadcastChannel`, que funciona **100% offline** entre abas ou janelas do
 * mesmo navegador. A modalidade entre dispositivos separados precisa de um
 * servidor de sinalização e é carregada sob demanda — ver `remoto.ts` e
 * `docs/ADR-controle-remoto.md`.
 */

export type Papel = 'palco' | 'controle';

export type Mensagem =
  /** O palco anuncia o que está na tela. */
  | { tipo: 'estado'; moduloId: string | null; estimulo: EstimuloVigente | null }
  /** O controle pede para abrir um módulo. */
  | { tipo: 'abrir'; moduloId: string }
  | { tipo: 'sair' }
  /** Marcação de resposta feita nos botões grandes do controle. */
  | { tipo: 'marcar'; respondeu: boolean }
  | { tipo: 'ajustar'; mudanca: Partial<Configuracoes> }
  /** Controle recém-aberto pedindo o estado atual. */
  | { tipo: 'ola' };

export type Transporte = {
  enviar: (mensagem: Mensagem) => void;
  fechar: () => void;
};

const CANAL = 'lume';

/**
 * Transporte local. Não exige rede, servidor nem permissão — é por isso que é
 * a modalidade padrão e a única anunciada como offline.
 */
export function abrirEspelhoLocal(aoReceber: (mensagem: Mensagem) => void): Transporte {
  if (typeof BroadcastChannel === 'undefined') {
    return { enviar: () => {}, fechar: () => {} };
  }

  const canal = new BroadcastChannel(CANAL);
  canal.onmessage = (evento: MessageEvent<Mensagem>) => aoReceber(evento.data);

  return {
    enviar: (mensagem) => canal.postMessage(mensagem),
    fechar: () => canal.close(),
  };
}

/** Lê o papel da URL: `?papel=controle` abre a superfície de comando. */
export function papelDaUrl(busca: string = window.location.search): Papel {
  return new URLSearchParams(busca).get('papel') === 'controle' ? 'controle' : 'palco';
}

export function enderecoDoControle(origem: string = window.location.origin): string {
  return `${origem}/?papel=controle`;
}
