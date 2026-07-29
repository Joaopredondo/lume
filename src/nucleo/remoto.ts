import type { Mensagem, Transporte } from './espelho';

/**
 * Modalidade B: dois dispositivos separados.
 *
 * **Esta é a única parte do app que não funciona offline, e isso é uma
 * limitação do navegador, não uma escolha.** Não existe forma de dois
 * navegadores em aparelhos diferentes se acharem sem um servidor de
 * sinalização — WebRTC puro não resolve, ele precisa de alguém para trocar as
 * ofertas iniciais. O PeerJS usa um servidor público na nuvem para isso.
 *
 * Consequências assumidas:
 * - fica atrás de uma flag desligada por padrão;
 * - é rotulada "requer internet" em qualquer lugar que apareça;
 * - degrada para o espelho local quando não há rede, sem quebrar nada;
 * - o carregamento é **dinâmico**, então o pacote não entra no bundle principal
 *   nem no precache do service worker: a promessa de funcionar offline continua
 *   verdadeira para todo o resto do app.
 *
 * Ver `docs/ADR-controle-remoto.md`.
 */

export type EstadoDoRemoto = 'desligado' | 'conectando' | 'conectado' | 'sem-rede' | 'erro';

export type Remoto = Transporte & {
  /** Código curto que o outro aparelho digita para parear. */
  codigo: string | null;
  estado: EstadoDoRemoto;
};

type ConexaoPeer = {
  on: (evento: string, ouvinte: (dado: unknown) => void) => void;
  send: (dado: unknown) => void;
  close: () => void;
};

type Peer = {
  on: (evento: string, ouvinte: (dado: unknown) => void) => void;
  connect: (id: string) => ConexaoPeer;
  destroy: () => void;
};

export function temRede(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/**
 * Abre a conexão entre aparelhos. `codigoRemoto` vazio significa "sou eu quem
 * publica o código"; preenchido significa "vou me conectar a ele".
 */
export async function abrirRemoto(
  aoReceber: (mensagem: Mensagem) => void,
  aoMudarEstado: (estado: EstadoDoRemoto, codigo: string | null) => void,
  codigoRemoto?: string,
): Promise<Transporte> {
  if (!temRede()) {
    aoMudarEstado('sem-rede', null);
    return { enviar: () => {}, fechar: () => {} };
  }

  aoMudarEstado('conectando', null);

  try {
    // Import dinâmico: mantém o pacote fora do bundle principal e do precache.
    const modulo = (await import('peerjs')) as unknown as {
      default: new (id?: string) => Peer;
      Peer?: new (id?: string) => Peer;
    };
    const Construtor = modulo.Peer ?? modulo.default;
    const peer = new Construtor();

    let conexao: ConexaoPeer | null = null;

    const ligarConexao = (nova: ConexaoPeer) => {
      conexao = nova;
      nova.on('data', (dado) => aoReceber(dado as Mensagem));
      nova.on('open', () => aoMudarEstado('conectado', null));
      nova.on('close', () => aoMudarEstado('desligado', null));
      nova.on('error', () => aoMudarEstado('erro', null));
    };

    peer.on('open', (id) => {
      if (codigoRemoto) {
        ligarConexao(peer.connect(codigoRemoto));
      } else {
        aoMudarEstado('conectando', String(id));
      }
    });

    peer.on('connection', (nova) => ligarConexao(nova as ConexaoPeer));
    peer.on('error', () => aoMudarEstado('erro', null));

    return {
      enviar: (mensagem) => conexao?.send(mensagem),
      fechar: () => {
        conexao?.close();
        peer.destroy();
        aoMudarEstado('desligado', null);
      },
    };
  } catch {
    // Sem o pacote, sem rede ou com o servidor fora: cai para o espelho local.
    aoMudarEstado('erro', null);
    return { enviar: () => {}, fechar: () => {} };
  }
}
