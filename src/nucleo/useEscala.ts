import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../dados/store';
import { tamanhoDoEstimulo } from './escala';
import { aoRedimensionar, medirTela, type Dimensoes } from './viewport';

/**
 * Dimensões da tela como estado do React, para o layout reagir a giro de
 * tablet e a redimensionamento de janela.
 */
export function useDimensoes(): Dimensoes {
  const [dimensoes, setDimensoes] = useState(medirTela);
  useEffect(() => aoRedimensionar(setDimensoes), []);
  return dimensoes;
}

/**
 * O tamanho do estímulo, já derivado do perfil e do aparelho, recalculado
 * quando a tela muda.
 *
 * É a única porta pela qual um componente da Camada Estímulo obtém tamanho —
 * a regra 4.8 proíbe literal de `px` lá dentro justamente para forçar isto.
 */
export function useTamanhoDoEstimulo(): (multiplo?: number) => number {
  const perfil = useStore((estado) => estado.perfil);
  const aparelho = useStore((estado) => estado.calibracaoAparelho);
  const multiploSessao = useStore((estado) => estado.configuracoes.multiploTamanho);
  const { menorDimensao } = useDimensoes();

  return useCallback(
    (multiplo = 1) =>
      tamanhoDoEstimulo(perfil, aparelho, menorDimensao, multiplo * (multiploSessao || 1)),
    [perfil, aparelho, menorDimensao, multiploSessao],
  );
}
