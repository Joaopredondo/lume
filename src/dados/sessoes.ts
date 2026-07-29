import { aoMarcarResposta } from '../nucleo/eventos';
import { db, type Sessao } from './db';

/**
 * Sessão em andamento.
 *
 * O que se registra é **resposta observada**, não tempo nem número de toques.
 * Tempo de tela e contagem de cliques não dizem se a pessoa viu alguma coisa;
 * a marcação do cuidador, cruzada com cor, tamanho e posição do estímulo
 * naquele instante, diz. Ver `docs/SEGURANCA.md`.
 */

let sessaoAtual: Sessao | null = null;
let cancelarEscuta: (() => void) | null = null;

export function sessaoEmAndamento(): Sessao | null {
  return sessaoAtual;
}

/**
 * Abre a sessão e passa a persistir toda marcação de resposta.
 *
 * Uma sessão já aberta é reaproveitada: entrar e sair de módulos é normal
 * dentro de um mesmo atendimento, e fatiar isso em várias sessões picotaria o
 * histórico sem motivo.
 */
export async function iniciarSessao(perfilId: string): Promise<Sessao> {
  if (sessaoAtual && sessaoAtual.perfilId === perfilId) return sessaoAtual;
  if (sessaoAtual) await encerrarSessao();

  const sessao: Sessao = {
    id: crypto.randomUUID(),
    perfilId,
    inicio: Date.now(),
    fim: null,
    modulos: [],
  };

  sessaoAtual = sessao;
  await db.sessoes.put(sessao);

  cancelarEscuta = aoMarcarResposta((evento) => {
    if (!sessaoAtual) return;
    void db.eventos.add({ ...evento, sessaoId: sessaoAtual.id, perfilId });
  });

  return sessao;
}

export async function registrarModulo(moduloId: string): Promise<void> {
  if (!sessaoAtual) return;
  // Repetição é informação: voltar ao mesmo módulo três vezes conta três.
  sessaoAtual.modulos.push(moduloId);
  await db.sessoes.put(sessaoAtual);
}

export type ResumoDaSessao = {
  sessao: Sessao;
  respondeu: number;
  naoRespondeu: number;
  duracaoMs: number;
};

export async function encerrarSessao(): Promise<ResumoDaSessao | null> {
  const sessao = sessaoAtual;
  if (!sessao) return null;

  cancelarEscuta?.();
  cancelarEscuta = null;
  sessaoAtual = null;

  sessao.fim = Date.now();
  await db.sessoes.put(sessao);

  const eventos = await db.eventos.where('sessaoId').equals(sessao.id).toArray();

  return {
    sessao,
    respondeu: eventos.filter((e) => e.respondeu).length,
    naoRespondeu: eventos.filter((e) => !e.respondeu).length,
    duracaoMs: (sessao.fim ?? 0) - sessao.inicio,
  };
}

/** Só para os testes: o estado da sessão é global. */
export function limparSessao(): void {
  cancelarEscuta?.();
  cancelarEscuta = null;
  sessaoAtual = null;
}
