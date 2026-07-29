import type { IdDeSilhueta } from '../../design/silhuetas';

/**
 * Uma palavra por letra, em pt-BR.
 *
 * Critério: palavra concreta e familiar, e sempre com a letra na posição
 * inicial de som — não só de grafia. Letra sem silhueta não é problema: a
 * palavra continua sendo falada, e a letra gigante segue sendo o estímulo.
 */
export type EntradaDoAlfabeto = {
  letra: string;
  palavra: string;
  silhueta?: IdDeSilhueta;
};

export const ALFABETO: EntradaDoAlfabeto[] = [
  { letra: 'A', palavra: 'abelha' },
  { letra: 'B', palavra: 'bola', silhueta: 'bola' },
  { letra: 'C', palavra: 'casa', silhueta: 'casa' },
  { letra: 'D', palavra: 'dado' },
  { letra: 'E', palavra: 'elefante', silhueta: 'elefante' },
  { letra: 'F', palavra: 'foca', silhueta: 'foca' },
  { letra: 'G', palavra: 'gato' },
  { letra: 'H', palavra: 'hipopótamo' },
  { letra: 'I', palavra: 'ilha' },
  { letra: 'J', palavra: 'janela' },
  { letra: 'K', palavra: 'kiwi' },
  { letra: 'L', palavra: 'lua', silhueta: 'lua' },
  { letra: 'M', palavra: 'mão' },
  { letra: 'N', palavra: 'nuvem' },
  { letra: 'O', palavra: 'ovo' },
  { letra: 'P', palavra: 'peixe', silhueta: 'peixe' },
  { letra: 'Q', palavra: 'queijo' },
  { letra: 'R', palavra: 'rato' },
  { letra: 'S', palavra: 'sapo' },
  { letra: 'T', palavra: 'tartaruga' },
  { letra: 'U', palavra: 'uva' },
  { letra: 'V', palavra: 'vaca' },
  { letra: 'W', palavra: 'wafer' },
  { letra: 'X', palavra: 'xícara' },
  { letra: 'Y', palavra: 'iogurte' },
  { letra: 'Z', palavra: 'zebra' },
];
