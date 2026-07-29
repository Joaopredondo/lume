import type { ManifestoDeModulo } from '../registro';
import { EstimulacaoVisual } from './EstimulacaoVisual';

export const manifesto: ManifestoDeModulo = {
  id: 'estimulacao-visual',
  nome: 'Estimulação visual',
  icone: 'faixa',
  nivel: 'inicial',
  // A travessia é horizontal, então só o eixo vertical da posição tem efeito.
  // Declarar só o que muda algo evita prometer variação que não existe.
  posicoesSuportadas: ['centro', 'superior', 'inferior'],
  resumo: 'Uma forma atravessa a tela devagar, trocando de cor.',
  comoUsar:
    'Módulo passivo: a pessoa não precisa fazer nada. Uma forma sólida cruza a tela em cerca de doze segundos e troca de cor a cada travessia. Ligue a lanterna na configuração para treinar rastreamento.',
  oQueObservar:
    'Se o olhar segue a forma de um lado ao outro, em que ponto do percurso perde, e se alguma cor prende mais a atenção.',

  componente: EstimulacaoVisual,
};
