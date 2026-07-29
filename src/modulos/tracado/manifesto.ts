import type { ManifestoDeModulo } from '../registro';
import { Tracado } from './Tracado';

export const manifesto: ManifestoDeModulo = {
  id: 'tracado',
  nome: 'Traçado',
  icone: 'linha',
  nivel: 'avancado',
  // O percurso ocupa a tela inteira por definição: variar a posição encolheria
  // o traçado sem ganho. Layout fixo, exceção declarada.
  posicoesSuportadas: ['centro'],
  resumo: 'Percorrer com o dedo uma linha, do ponto verde até o fim.',
  comoUsar:
    'Comece no círculo verde e leve o dedo pela linha laranja. A parte percorrida fica amarela. Soltar o dedo não reinicia — retoma de onde parou. São cinco percursos, da reta ao círculo.',
  oQueObservar:
    'Onde o dedo sai da linha, se a curva é mais difícil que a reta, e se consegue retomar depois de soltar.',

  componente: Tracado,
};
