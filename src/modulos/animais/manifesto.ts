import { POSICOES } from '../../dados/tipos';
import type { ManifestoDeModulo } from '../registro';
import { Animais } from './Animais';

export const manifesto: ManifestoDeModulo = {
  id: 'animais',
  nome: 'Animais',
  icone: 'silhueta',
  nivel: 'inicial',
  resumo: 'As silhuetas dos cartões físicos, uma por vez.',
  comoUsar:
    'Toque para passar ao próximo animal, que é nomeado em voz alta. São os mesmos sete dos cartões impressos, nas mesmas cores.',
  oQueObservar:
    'Se reconhece algum animal, se reage mais a alguma silhueta ou cor, e se o nome falado ajuda no reconhecimento.',

  componente: Animais,
  posicoesSuportadas: [...POSICOES],
};
