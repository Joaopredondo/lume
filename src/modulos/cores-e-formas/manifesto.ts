import type { ManifestoDeModulo } from '../registro';
import { CoresEFormas } from './CoresEFormas';

export const manifesto: ManifestoDeModulo = {
  id: 'cores-e-formas',
  nome: 'Cores e formas',
  icone: 'formas',
  nivel: 'intermediario',
  posicoesSuportadas: ['centro'],
  resumo: 'Três formas na tela; a instrução é falada. Mais formas quando ela acerta.',
  comoUsar:
    'A voz pede uma forma de uma cor. Começa com três opções. Cada distrator difere só na cor ou só na forma, nunca nas duas. Tocar na errada não tem penalidade: a instrução é repetida com calma. Dois acertos seguidos entram mais uma forma (até cinco) e o tamanho encolhe um pouco. No painel: Mais formas, Menos formas, Maior, Menor.',
  oQueObservar:
    'Se procura antes de tocar, se erra sempre para o mesmo lado da tela, se acerta mais por cor ou por forma, e a partir de quantas opções a resposta cai.',

  componente: CoresEFormas,
};
