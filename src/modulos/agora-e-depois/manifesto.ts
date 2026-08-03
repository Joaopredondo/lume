import type { ManifestoDeModulo } from '../registro';
import { AgoraEDepois } from './AgoraEDepois';

export const manifesto: ManifestoDeModulo = {
  id: 'agora-e-depois',
  nome: 'Agora e depois',
  icone: 'quadro',
  nivel: 'inicial',
  resumo: 'O que está acontecendo agora e o que vem logo depois.',
  comoUsar:
    'No modo voluntário, arraste as figurinhas da bandeja para os dois espaços — ou toque na figurinha e depois no espaço. O botão TERMINEI avança a rotina e anuncia o próximo passo em voz alta. O modo criança esconde a bandeja; sair dele exige segurar o botão por 3 segundos.',
  oQueObservar:
    'Se olha para o espaço DEPOIS antes da troca, se a transição fica mais fácil quando ela mesma toca TERMINEI, e em qual passo a agitação costuma aparecer.',
  // O quadro ocupa a tela inteira por definição: dois espaços, faixa e bandeja.
  posicoesSuportadas: ['centro'],
  componente: AgoraEDepois,
};
