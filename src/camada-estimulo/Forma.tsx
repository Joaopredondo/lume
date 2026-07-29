import type { CSSProperties } from 'react';
import type { Posicao, TokenDeCor } from '../dados/tipos';
import { estiloDePosicao } from '../nucleo/posicao';

export type TipoDeForma = 'circulo' | 'quadrado';

type Props = {
  cor: TokenDeCor;
  tamanho: number;
  posicao: Posicao;
  largura: number;
  altura: number;
  tipo?: TipoDeForma;
  estilo?: CSSProperties;
};

/**
 * O primitivo da Camada Estímulo: uma silhueta maciça de cor chapada sobre
 * preto. Cor sólida, sem contorno, sem gradiente, sem sombra — cartaz
 * serigrafado, não ilustração.
 *
 * Tamanho e posição vêm de fora, sempre calculados (`escala.ts` e `posicao.ts`).
 * Nenhum componente desta camada tem permissão de escrever um número em pixels:
 * é o que a regra 4.8 verifica, e o que faz o estímulo respeitar o limiar do
 * perfil em vez de um chute do editor.
 */
export function Forma({ cor, tamanho, posicao, largura, altura, tipo = 'circulo', estilo }: Props) {
  const caixa = estiloDePosicao(posicao, tamanho, largura, altura);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        ...caixa,
        backgroundColor: `var(--color-${cor})`,
        borderRadius: tipo === 'circulo' ? '50%' : 0,
        ...estilo,
      }}
    />
  );
}
