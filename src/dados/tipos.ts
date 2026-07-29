/** Tipos compartilhados. Persistência em Dexie entra na etapa 4. */

/**
 * Paleta de estímulo primário. É esta lista que a calibração percorre e que os
 * módulos sorteiam.
 */
export const CORES = [
  'amarelo-sinal',
  'laranja-sinal',
  'ciano-sinal',
  'verde-sinal',
  'magenta-sinal',
  'vermelho-sinal',
] as const;

/**
 * Cores que existem no app mas **nunca entram no sorteio de estímulo**.
 *
 * O azul está aqui porque a atividade impressa de Círculos e setas usa
 * exatamente quatro cores — azul, verde, vermelho, amarelo — e ciano não
 * substitui sem descaracterizar o material. Mas azul sobre preto tem ~3,7:1 de
 * contraste, contra ~19:1 do amarelo: é a pior combinação possível para baixa
 * visão. Fica restrito a módulos cognitivos, onde a tarefa é de correspondência
 * e não de detecção no limiar. Ver `docs/PALETA.md`.
 */
export const CORES_COGNITIVAS = ['azul-sinal'] as const;

export type TokenDeCor = (typeof CORES)[number] | (typeof CORES_COGNITIVAS)[number];

/** Seção 3.2: onde o estímulo aparece importa tanto quanto o tamanho. */
export const POSICOES = [
  'centro',
  'esquerda',
  'direita',
  'superior',
  'inferior',
  'q1',
  'q2',
  'q3',
  'q4',
] as const;

export type Posicao = (typeof POSICOES)[number];

export type PesoFonte = 'bold' | 'extrabold';

/**
 * Seção 3.1. O limiar é guardado em graus de ângulo visual, não em pixels:
 * o app roda em tablet a 45cm e em TV a 2m, e 300px nos dois não é o mesmo
 * estímulo. Em graus, o baseline é portátil entre aparelhos e o histórico
 * fica comparável.
 */
export type Perfil = {
  id: string;
  nome: string;
  limiarAngular: number | null;
  distanciaUsoCm: number;
  coresComResposta: TokenDeCor[];
  posicaoPreferencial: Posicao;
  pesoFonte: PesoFonte;
};

/**
 * Calibração física da tela. É por aparelho, não por perfil: o navegador não
 * expõe o tamanho físico real, então isto vem do passo do cartão de banco.
 */
export type CalibracaoDeAparelho = {
  pxPorMm: number;
  calibradoEm: number;
};

export type Configuracoes = {
  modoCalmo: boolean;
  mudo: boolean;
  velocidadeFala: number;
  /**
   * Modo varredura: um destaque percorre as opções sozinho e qualquer toque
   * seleciona a marcada. Para quem não consegue apontar.
   */
  varreduraLigada: boolean;
  intervaloVarreduraMs: number;
  intervaloPausaMin: number;
  lanternaLigada: boolean;
  /** Sorteia a posição a cada apresentação, para avaliar campo visual (§3.2). */
  sortearPosicao: boolean;
  /**
   * Quantos itens por rodada em módulos de sequência.
   *
   * A folha impressa de Círculos e setas tem 20 (4 colunas × 5 linhas). Vinte
   * itens numa tela é denso demais para baixa visão, então a versão digital
   * apresenta um por vez e o cuidador escolhe o tamanho da rodada. O padrão é 5,
   * que equivale a uma coluna da folha.
   */
  itensPorRodada: number;
  /** A legenda de Círculos e setas some para quem já memorizou a regra. */
  mostrarLegenda: boolean;
};

export const CONFIGURACOES_PADRAO: Configuracoes = {
  modoCalmo: false,
  mudo: false,
  velocidadeFala: 0.8,
  varreduraLigada: false,
  intervaloVarreduraMs: 4000,
  intervaloPausaMin: 10,
  lanternaLigada: false,
  sortearPosicao: false,
  itensPorRodada: 5,
  mostrarLegenda: true,
};

export const PERFIL_PADRAO: Perfil = {
  id: 'padrao',
  nome: 'Sem perfil',
  limiarAngular: null,
  distanciaUsoCm: 45,
  coresComResposta: [...CORES],
  posicaoPreferencial: 'centro',
  pesoFonte: 'extrabold',
};
