/**
 * Regras clínicas da seção 4, em código.
 *
 * A usuária principal tem histórico de crises convulsivas. Nada aqui é
 * preferência de estilo: é o piso de segurança do produto, e tem prioridade
 * sobre qualquer escolha estética. Ver `docs/SEGURANCA.md`.
 */

/**
 * Regra 4.2 — toda duração de animação sai daqui, nenhuma é escrita à mão.
 * Centralizar é o que permite o teste automatizado provar que nenhuma animação
 * do app é rápida demais; valor solto no meio de um componente escaparia.
 */
export const DURACAO = {
  padrao: 800,
  lenta: 1200,
  fade: 2000,
  /**
   * Ciclo de pulsação. 4s, não 3s: o limite da regra 4.1 é 3s, e ficar
   * exatamente nele não deixa folga para variação de temporizador.
   */
  pulso: 4000,
  travessia: 12000,
} as const;

export type NomeDeDuracao = keyof typeof DURACAO;

/** Piso da regra 4.2. Abaixo disto a mudança começa a ser percebida como pulso. */
export const DURACAO_MINIMA_MS = 800;

/**
 * Regra 4.2, o outro lado: o feedback precisa *começar* junto com o toque.
 * Se demorar, a pessoa não liga o toque ao efeito e o módulo Causa e efeito
 * perde o sentido clínico. Começa imediato, termina devagar.
 */
export const LATENCIA_MAXIMA_MS = 100;

/** Regra 4.1 — no máximo uma mudança de luminância a cada 3s. */
export const FREQUENCIA_MAXIMA_HZ = 1 / 3;

/** Regra 6 — absorve toque involuntário repetido, sem atrasar o primeiro. */
export const DEBOUNCE_MS = 400;

/** Motion em segundos; o resto do app pensa em milissegundos. */
export function emSegundos(duracao: NomeDeDuracao): number {
  return DURACAO[duracao] / 1000;
}

/**
 * Regra 4.1. Uma animação que se repete só é segura se o ciclo completo levar
 * ao menos 3s — e, ainda assim, apenas quando não mexe em luminância.
 */
export function periodoEhSeguro(periodoMs: number): boolean {
  return periodoMs >= 1000 / FREQUENCIA_MAXIMA_HZ;
}
