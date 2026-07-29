import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvisarVolta, useRegistrarAcao } from '../../camada-estimulo/acoes';
import { FiguraPropria } from '../../camada-estimulo/FiguraPropria';
import { Silhueta } from '../../design/silhuetas';
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
import { ALFABETO } from './palavras';

/**
 * Alfabeto — uma letra gigante por vez, cor sorteada entre as que o perfil
 * confirmou.
 *
 * O toque fala a letra e depois a palavra, revelando a silhueta. Letra sem
 * silhueta continua funcionando: a palavra é falada e a letra segue sendo o
 * estímulo. Faltar figura é normal, não é caso de erro.
 */
export function Alfabeto({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [minuscula, setMinuscula] = useState(false);

  const avisarVolta = useAvisarVolta();
  const proprios = useConteudoProprio();
  const perfil = useStore((estado) => estado.perfil);
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const cores = perfil.coresComResposta;

  /**
   * O alfabeto padrão mais o que o cuidador cadastrou. A letra da palavra
   * própria vem da primeira letra dela — "mamãe" entra no M.
   */
  const lista = useMemo(
    () => [
      ...ALFABETO,
      ...proprios.map((item) => ({
        letra: (item.palavra[0] ?? '?').toUpperCase(),
        palavra: item.palavra,
        proprio: item.url,
      })),
    ],
    [proprios],
  );

  const entrada = lista[indice] ?? lista[0];
  const [cor, setCor] = useState<TokenDeCor>(() => cores[0] ?? 'amarelo-sinal');

  const lado = tamanho();
  const caixa = estiloDePosicao(posicao, lado, largura, altura);

  useEffect(() => {
    if (!entrada) return;
    definirEstimuloVigente({
      moduloId: 'alfabeto',
      cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [cor, entrada, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  /**
   * Primeiro toque revela; o segundo avança. Duas etapas por toque seriam
   * rápidas demais para acompanhar, e avançar direto perderia a associação
   * entre a letra e a palavra.
   */
  const avancar = useCallback(() => {
    somDeToque();

    if (!revelado) {
      setRevelado(true);
      if (entrada) falar(`${entrada.letra}. ${entrada.palavra}`);
      return;
    }

    setRevelado(false);
    setIndice((i) => {
      const proximo = (i + 1) % lista.length;
      // Deu a volta no alfabeto inteiro: avisa em vez de recomeçar em silêncio.
      if (proximo === 0) avisarVolta();
      return proximo;
    });
    setCor(cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal');
  }, [avisarVolta, cores, entrada, lista.length, revelado]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    return ouvirAtivacao(elemento, avancar);
  }, [avancar]);

  const alternarCaixa = useCallback(() => setMinuscula((v) => !v), []);

  // No celular não há teclado, então a mesma ação aparece no painel do
  // cuidador — atrás do gesto de segurar, para a pessoa atendida não alcançar.
  useRegistrarAcao(
    'alfabeto-caixa',
    minuscula ? 'Mostrar em MAIÚSCULA' : 'Mostrar em minúscula',
    alternarCaixa,
  );

  // Alternar maiúscula/minúscula fica no teclado do cuidador: um controle solto
  // na tela seria tocado sem querer pela pessoa atendida.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() === 'm') alternarCaixa();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [alternarCaixa]);

  if (!entrada) return null;

  const mostrarSilhueta = revelado && 'silhueta' in entrada && entrada.silhueta !== undefined;

  return (
    <div ref={container} tabIndex={-1} style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          ...caixa,
          display: 'grid',
          placeItems: 'center',
          // Só fade, sem escala: a letra não se move nem no modo normal, então
          // não há nada para o Modo calmo suprimir aqui.
          animation: `entrar-por-fade ${emSegundos('padrao')}s ease-out both`,
        }}
      >
        {revelado && 'proprio' in entrada && entrada.proprio ? (
          <FiguraPropria url={entrada.proprio} palavra={entrada.palavra} cor={cor} tamanho={lado} />
        ) : mostrarSilhueta && entrada.silhueta ? (
          <Silhueta id={entrada.silhueta} cor={cor} tamanho={lado} />
        ) : (
          <span
            aria-label={entrada.letra}
            style={{
              color: `var(--color-${cor})`,
              fontSize: lado,
              lineHeight: 1,
              fontWeight: perfil.pesoFonte === 'bold' ? 700 : 800,
            }}
          >
            {minuscula ? entrada.letra.toLowerCase() : entrada.letra}
          </span>
        )}
      </div>
    </div>
  );
}
