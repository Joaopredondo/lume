import type { ManifestoDeModulo } from '../registro';
import { Numeros } from './Numeros';

export const manifesto: ManifestoDeModulo = {
  id: 'numeros',
  nome: 'Números',
  icone: 'numeral',
  nivel: 'intermediario',
  // O numeral fica em cima e os círculos embaixo: o layout já ocupa o eixo
  // vertical inteiro, então só a variação horizontal faria diferença — e ela
  // separaria numeral de círculos. Layout fixo, como em Círculos e setas.
  posicoesSuportadas: ['centro'],
  resumo: 'O numeral e a mesma quantidade em círculos, contados em voz alta.',
  comoUsar:
    'Toque para começar a contagem. Os círculos acendem um por vez enquanto a voz conta, e permanecem acesos até o fim. Tocar de novo passa ao próximo número, até cinco.',
  oQueObservar:
    'Se acompanha a contagem, se olha para cada círculo ao ouvir o número, e até que quantidade consegue seguir.',

  componente: Numeros,
};
