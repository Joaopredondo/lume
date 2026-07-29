import { POSICOES } from '../../dados/tipos';
import type { ManifestoDeModulo } from '../registro';
import { CausaEEfeito } from './CausaEEfeito';

export const manifesto: ManifestoDeModulo = {
  id: 'causa-e-efeito',
  nome: 'Causa e efeito',
  icone: 'circulo',
  nivel: 'inicial',
  resumo: 'Toque em qualquer lugar faz surgir uma forma colorida com som.',
  comoUsar:
    'Qualquer toque na tela, em qualquer ponto, faz aparecer uma forma grande que cresce e some. Não há certo nem errado — o objetivo é a pessoa perceber que o toque dela causou alguma coisa.',
  oQueObservar:
    'Se repete o toque por conta própria, se acompanha a forma com o olhar, se aquieta ou se anima quando ela aparece.',

  componente: CausaEEfeito,
  posicoesSuportadas: [...POSICOES],
};
