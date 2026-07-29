import type { PesoFonte, Posicao, TokenDeCor } from '../dados/tipos';

/**
 * Marcador de resposta (seção 8.1).
 *
 * Tempo de sessão e número de toques não dizem quase nada: a pessoa atendida
 * pode encostar na tela sem ter visto nada. O dado que a terapeuta usa é **se
 * houve resposta, e a quê** — por isso todo evento carrega junto a cor, o
 * tamanho e a posição do estímulo naquele instante. Cruzando esses eixos ao
 * longo de semanas, o padrão de preferência aparece sozinho.
 *
 * Sem escore, sem interpretação automática. Só o dado.
 */

export type OrigemDaMarcacao = 'teclado' | 'controle';

export type EstimuloVigente = {
  moduloId: string;
  cor: TokenDeCor;
  tamanhoAngular: number;
  posicao: Posicao;
  pesoFonte: PesoFonte;
};

export type EventoResposta = EstimuloVigente & {
  respondeu: boolean;
  origem: OrigemDaMarcacao;
  em: number;
};

type Ouvinte = (evento: EventoResposta) => void;

/**
 * Barramento em memória. A persistência em Dexie entra na etapa 8 — o que
 * importa agora é que os módulos já nasçam emitindo, senão cada um teria que
 * ser reaberto depois para ser instrumentado.
 */
const ouvintes = new Set<Ouvinte>();

/** O estímulo que está na tela agora. Sem isto, a marcação não vira dado. */
let vigente: EstimuloVigente | null = null;

export function definirEstimuloVigente(estimulo: EstimuloVigente | null): void {
  vigente = estimulo;
}

export function estimuloVigente(): EstimuloVigente | null {
  return vigente;
}

export function aoMarcarResposta(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/**
 * Registra a observação do cuidador. Devolve o evento gravado, ou `null` se
 * não havia estímulo na tela — marcar no vazio não é dado, é ruído.
 */
export function marcarResposta(
  respondeu: boolean,
  origem: OrigemDaMarcacao,
): EventoResposta | null {
  if (!vigente) return null;

  const evento: EventoResposta = { ...vigente, respondeu, origem, em: Date.now() };
  for (const ouvinte of ouvintes) ouvinte(evento);
  return evento;
}

/** Só para os testes: o barramento é global e vaza entre casos. */
export function limparEventos(): void {
  ouvintes.clear();
  vigente = null;
}

/**
 * Atalho de marcação por tecla física.
 *
 * A Camada Estímulo é tela cheia sem chrome, e botão visível ali seria tocado
 * sem querer pela própria pessoa atendida — contaminando exatamente o dado que
 * se quer coletar. Então a marcação com uma tela só é sempre por tecla, o que
 * também funciona com acionador (switch) mapeado para teclado.
 *
 * Os botões grandes existem apenas na superfície de controle do modo espelho.
 */
export function ouvirAtalhoDeMarcacao(alvo: Window | HTMLElement = window): () => void {
  const aoTeclar = (evento: Event) => {
    const tecla = (evento as KeyboardEvent).key?.toLowerCase();
    if (tecla !== 's' && tecla !== 'n') return;

    // Não sequestra a tecla enquanto o cuidador digita em algum campo.
    const foco = document.activeElement;
    if (foco instanceof HTMLInputElement || foco instanceof HTMLTextAreaElement) return;

    marcarResposta(tecla === 's', 'teclado');
  };

  alvo.addEventListener('keydown', aoTeclar);
  return () => alvo.removeEventListener('keydown', aoTeclar);
}
