import type { ManifestoDeModulo } from '../registro';
import { CirculosESetas } from './CirculosESetas';

export const manifesto: ManifestoDeModulo = {
  id: 'circulos-e-setas',
  nome: 'Círculos e setas',
  icone: 'seta',
  nivel: 'avancado',
  // Legenda em cima, círculo no meio, quatro setas embaixo: o layout ocupa a
  // tela inteira por definição. Exceção declarada, não esquecimento.
  posicoesSuportadas: ['centro'],
  resumo: 'Escolher a seta que corresponde à cor do círculo.',
  comoUsar:
    'A regra fica na legenda do topo: azul vai para baixo, verde para a esquerda, vermelho para cima, amarelo para a direita. Toque na seta certa para o círculo mostrado. Errar só repete a regra em voz alta.',
  oQueObservar:
    'Se consulta a legenda ou já memorizou, se confunde sempre o mesmo par, e se a direção atrapalha mais que a cor.',

  componente: CirculosESetas,
};
