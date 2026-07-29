import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvisarVolta } from '../../camada-estimulo/acoes';
import { FiguraPropria } from '../../camada-estimulo/FiguraPropria';
import { Silhueta, type IdDeSilhueta } from '../../design/silhuetas';
import { useStore } from '../../dados/store';
import { useConteudoProprio } from '../../dados/useConteudoProprio';
import type { TokenDeCor } from '../../dados/tipos';
import { somDeToque } from '../../nucleo/audio';
import { ouvirAtivacao } from '../../nucleo/entrada';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { estiloDePosicao } from '../../nucleo/posicao';
import { emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import type { PropsDoModulo } from '../registro';

/** Os sete dos cartões físicos, na mesma ordem em que aparecem na cartela. */
const ANIMAIS: { id: IdDeSilhueta; nome: string }[] = [
  { id: 'polvo', nome: 'polvo' },
  { id: 'peixe', nome: 'peixe' },
  { id: 'elefante', nome: 'elefante' },
  { id: 'foca', nome: 'foca' },
  { id: 'baleia', nome: 'baleia' },
  { id: 'borboleta', nome: 'borboleta' },
  { id: 'passarinho', nome: 'passarinho' },
];

/**
 * Cores dos cartões físicos: polvo laranja, peixe amarelo, elefante amarelo.
 * Quando o perfil confirmou a cor, ela é usada; se não, cai na primeira cor
 * com resposta — fidelidade ao cartão nunca passa na frente da calibração.
 */
const COR_DO_CARTAO: Record<IdDeSilhueta, TokenDeCor> = {
  polvo: 'laranja-sinal',
  peixe: 'amarelo-sinal',
  elefante: 'amarelo-sinal',
  foca: 'ciano-sinal',
  baleia: 'ciano-sinal',
  borboleta: 'magenta-sinal',
  passarinho: 'verde-sinal',
  bola: 'amarelo-sinal',
  casa: 'laranja-sinal',
  coracao: 'vermelho-sinal',
  estrela: 'amarelo-sinal',
  lua: 'amarelo-sinal',
};

/**
 * Animais — réplica digital dos cartões físicos.
 *
 * A silhueta ocupa ~70% da menor dimensão quando não há calibração; com perfil
 * calibrado, o tamanho vem do limiar como em qualquer outro módulo.
 */
export function Animais({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  const avisarVolta = useAvisarVolta();
  const proprios = useConteudoProprio();
  const perfil = useStore((estado) => estado.perfil);
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura, menorDimensao } = useDimensoes();

  /**
   * Os sete dos cartões mais o que o cuidador cadastrou. Figura do repertório
   * da própria pessoa costuma prender mais atenção que um animal genérico.
   */
  const lista = useMemo(
    () => [
      ...ANIMAIS.map((a) => ({ ...a, url: undefined as string | undefined })),
      ...proprios.map((item) => ({
        id: 'polvo' as IdDeSilhueta,
        nome: item.palavra,
        url: item.url,
      })),
    ],
    [proprios],
  );

  const animal = lista[indice] ?? lista[0];
  const cores = perfil.coresComResposta;

  // Silhueta tem massa distribuída, então precisa de mais área que um círculo
  // cheio para ler igual. Daí o piso de 70% da menor dimensão sem calibração.
  const lado = Math.min(
    Math.max(tamanho(), perfil.limiarAngular === null ? menorDimensao * 0.7 : 0),
    menorDimensao,
  );

  const cor = animal
    ? cores.includes(COR_DO_CARTAO[animal.id])
      ? COR_DO_CARTAO[animal.id]
      : (cores[0] ?? 'amarelo-sinal')
    : 'amarelo-sinal';

  const caixa = estiloDePosicao(posicao, lado, largura, altura);

  useEffect(() => {
    if (!animal) return;
    definirEstimuloVigente({
      moduloId: 'animais',
      cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [animal, cor, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  const avancar = useCallback(() => {
    somDeToque();
    const proximo = (indice + 1) % lista.length;
    // Passou por todos os sete: avisa em vez de recomeçar em silêncio.
    if (proximo === 0) avisarVolta();
    setIndice(proximo);
    const nome = lista[proximo]?.nome;
    if (nome) falar(nome);
  }, [avisarVolta, indice, lista]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    return ouvirAtivacao(elemento, avancar);
  }, [avancar]);

  if (!animal) return null;

  return (
    <div ref={container} tabIndex={-1} style={{ position: 'absolute', inset: 0 }}>
      <div
        key={animal.id}
        style={{
          position: 'absolute',
          ...caixa,
          display: 'grid',
          placeItems: 'center',
          animation: `entrar-por-fade ${emSegundos('padrao')}s ease-out both`,
        }}
      >
        {animal.url ? (
          <FiguraPropria url={animal.url} palavra={animal.nome} cor={cor} tamanho={lado} />
        ) : (
          <Silhueta id={animal.id} cor={cor} tamanho={lado} />
        )}
      </div>
    </div>
  );
}
