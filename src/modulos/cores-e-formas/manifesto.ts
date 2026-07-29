import type { ManifestoDeModulo } from '../registro';
import { CoresEFormas } from './CoresEFormas';

export const manifesto: ManifestoDeModulo = {
  id: 'cores-e-formas',
  nome: 'Cores e formas',
  icone: 'formas',
  nivel: 'intermediario',
  // As duas opções ocupam metade da tela cada: o layout é a própria escolha,
  // então não há posição a variar.
  posicoesSuportadas: ['centro'],
  resumo: 'Duas opções, metade da tela cada; a instrução é falada.',
  comoUsar:
    'A voz pede uma forma de uma cor. As duas opções diferem só na cor ou só na forma, nunca nas duas. Tocar na errada não tem penalidade: a instrução é repetida com calma.',
  oQueObservar:
    'Se procura antes de tocar, se erra sempre para o mesmo lado da tela, e se acerta mais por cor ou por forma.',

  componente: CoresEFormas,
};
