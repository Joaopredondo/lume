import type { IdDeSilhueta } from '../../design/silhuetas';
import type { TokenDeCor } from '../../dados/tipos';

/**
 * Catálogo de figurinhas da rotina do culto.
 *
 * Cor e forma seguem o quadro físico que o ministério já usa — a criança que
 * reconhece a figurinha no papel precisa reconhecer a mesma na tela.
 *
 * Todas reaproveitam silhuetas de `design/silhuetas.tsx`. Nenhuma foi
 * desenhada de novo aqui: a regra do arquivo (massa sólida, sem traço fino,
 * detalhe só em recorte preto) vale igual.
 */
export type Figurinha = {
  id: string;
  nome: string;
  silhueta: IdDeSilhueta;
  cor: TokenDeCor;
};

export const FIGURINHAS: Figurinha[] = [
  { id: 'louvor', nome: 'Louvor', silhueta: 'nota', cor: 'amarelo-sinal' },
  { id: 'oracao', nome: 'Oração', silhueta: 'coracao', cor: 'magenta-sinal' },
  { id: 'historia', nome: 'História bíblica', silhueta: 'livro', cor: 'laranja-sinal' },
  { id: 'atividade', nome: 'Atividade', silhueta: 'estrela', cor: 'amarelo-sinal' },
  { id: 'desenhar', nome: 'Desenhar', silhueta: 'lapis', cor: 'verde-sinal' },
  { id: 'lanche', nome: 'Lanche', silhueta: 'maca', cor: 'verde-sinal' },
  { id: 'agua', nome: 'Água', silhueta: 'copo', cor: 'ciano-sinal' },
  { id: 'brincar', nome: 'Brincar', silhueta: 'bola', cor: 'ciano-sinal' },
  { id: 'banheiro', nome: 'Banheiro', silhueta: 'gota', cor: 'ciano-sinal' },
  { id: 'calmo', nome: 'Cantinho calmo', silhueta: 'lua', cor: 'magenta-sinal' },
  { id: 'abafador', nome: 'Abafador', silhueta: 'fone', cor: 'laranja-sinal' },
  { id: 'esperar', nome: 'Esperar', silhueta: 'ampulheta', cor: 'amarelo-sinal' },
  { id: 'casa', nome: 'Ir pra casa', silhueta: 'casa', cor: 'laranja-sinal' },
];

/** A ordem típica do culto. Ponto de partida, não regra. */
export const ROTINA_PADRAO = [
  'louvor',
  'oracao',
  'historia',
  'atividade',
  'lanche',
  'brincar',
  'casa',
];

export function figurinhaPorId(id: string): Figurinha | undefined {
  return FIGURINHAS.find((f) => f.id === id);
}
