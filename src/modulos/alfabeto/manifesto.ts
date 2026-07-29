import { POSICOES } from '../../dados/tipos';
import type { ManifestoDeModulo } from '../registro';
import { Alfabeto } from './Alfabeto';

export const manifesto: ManifestoDeModulo = {
  id: 'alfabeto',
  nome: 'Alfabeto',
  icone: 'letra',
  nivel: 'intermediario',
  resumo: 'Uma letra gigante por vez; o toque fala a letra e a palavra.',
  comoUsar:
    'Toque uma vez para ouvir a letra e a palavra e ver a figura. Toque de novo para passar à próxima letra. A tecla M alterna entre maiúscula e minúscula.',
  oQueObservar:
    'Se localiza a letra na tela, se antecipa a palavra antes da fala, se reage mais a alguma letra ou cor.',

  componente: Alfabeto,
  posicoesSuportadas: [...POSICOES],
};
