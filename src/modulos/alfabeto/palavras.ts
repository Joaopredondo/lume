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
  { letra: 'A', palavra: 'abelha', silhueta: 'abelha' },
  { letra: 'B', palavra: 'bola', silhueta: 'bola' },
  { letra: 'C', palavra: 'casa', silhueta: 'casa' },
  { letra: 'D', palavra: 'dado', silhueta: 'dado' },
  { letra: 'E', palavra: 'elefante', silhueta: 'elefante' },
  { letra: 'F', palavra: 'foca', silhueta: 'foca' },
  { letra: 'G', palavra: 'gato', silhueta: 'gato' },
  { letra: 'H', palavra: 'hipopótamo', silhueta: 'hipopotamo' },
  { letra: 'I', palavra: 'ilha', silhueta: 'ilha' },
  { letra: 'J', palavra: 'janela', silhueta: 'janela' },
  { letra: 'K', palavra: 'kiwi', silhueta: 'kiwi' },
  { letra: 'L', palavra: 'lua', silhueta: 'lua' },
  { letra: 'M', palavra: 'mão', silhueta: 'mao' },
  { letra: 'N', palavra: 'nuvem', silhueta: 'nuvem' },
  { letra: 'O', palavra: 'ovo', silhueta: 'ovo' },
  { letra: 'P', palavra: 'peixe', silhueta: 'peixe' },
  { letra: 'Q', palavra: 'queijo', silhueta: 'queijo' },
  { letra: 'R', palavra: 'rato', silhueta: 'rato' },
  { letra: 'S', palavra: 'sapo', silhueta: 'sapo' },
  { letra: 'T', palavra: 'tartaruga', silhueta: 'tartaruga' },
  { letra: 'U', palavra: 'uva', silhueta: 'uva' },
  { letra: 'V', palavra: 'vaca', silhueta: 'vaca' },
  { letra: 'W', palavra: 'wafer', silhueta: 'wafer' },
  { letra: 'X', palavra: 'xícara', silhueta: 'xicara' },
  { letra: 'Y', palavra: 'iogurte', silhueta: 'iogurte' },
  { letra: 'Z', palavra: 'zebra', silhueta: 'zebra' },
];
