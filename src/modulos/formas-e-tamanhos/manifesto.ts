import type { ManifestoDeModulo } from '../registro';
import { FormasETamanhos } from './FormasETamanhos';

export const manifesto: ManifestoDeModulo = {
  id: 'formas-e-tamanhos',
  nome: 'Formas e tamanhos',
  icone: 'tamanhos',
  nivel: 'intermediario',
  posicoesSuportadas: ['centro'],
  resumo: 'Três formas, cada uma de um tamanho e de uma cor. A voz pede uma.',
  comoUsar:
    'A voz pede pelo tamanho (pequeno, médio, grande), pela cor ou pela forma. As três ficam na tela ao mesmo tempo. Tocar na errada não tem penalidade: a instrução é repetida. Conforme ela acerta, a diferença de tamanho diminui. No painel: Maior, Menor, Mais diferença de tamanho.',
  oQueObservar:
    'Se discrimina tamanho, cor ou forma com mais facilidade, e se a diferença menor ainda produz resposta.',

  componente: FormasETamanhos,
};
