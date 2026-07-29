import type { TokenDeCor } from '../../dados/tipos';

export type Direcao = 'cima' | 'baixo' | 'esquerda' | 'direita';

/**
 * A regra da folha impressa, na mesma ordem em que aparece no topo dela:
 * azul→baixo, verde→esquerda, vermelho→cima, amarelo→direita.
 *
 * O azul só existe no app por causa desta atividade. Ver `docs/PALETA.md`.
 */
export const REGRA: { cor: TokenDeCor; direcao: Direcao }[] = [
  { cor: 'azul-sinal', direcao: 'baixo' },
  { cor: 'verde-sinal', direcao: 'esquerda' },
  { cor: 'vermelho-sinal', direcao: 'cima' },
  { cor: 'amarelo-sinal', direcao: 'direita' },
];

export const NOMES_DE_DIRECAO: Record<Direcao, string> = {
  cima: 'para cima',
  baixo: 'para baixo',
  esquerda: 'para a esquerda',
  direita: 'para a direita',
};

export const NOMES_DE_COR: Partial<Record<TokenDeCor, string>> = {
  'azul-sinal': 'azul',
  'verde-sinal': 'verde',
  'vermelho-sinal': 'vermelho',
  'amarelo-sinal': 'amarelo',
};

export const ROTACAO: Record<Direcao, number> = {
  cima: 0,
  direita: 90,
  baixo: 180,
  esquerda: 270,
};

export const DIRECOES: Direcao[] = ['cima', 'baixo', 'esquerda', 'direita'];

export function sortearSequencia(quantos: number): TokenDeCor[] {
  return Array.from(
    { length: Math.max(1, quantos) },
    () => REGRA[Math.floor(Math.random() * REGRA.length)]?.cor ?? 'azul-sinal',
  );
}

export function direcaoDe(cor: TokenDeCor): Direcao | undefined {
  return REGRA.find((r) => r.cor === cor)?.direcao;
}
