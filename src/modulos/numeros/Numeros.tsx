import { useCallback, useEffect, useRef, useState } from 'react';
import { useAvisarVolta } from '../../camada-estimulo/acoes';
import { useStore } from '../../dados/store';
import type { TokenDeCor } from '../../dados/tipos';
import { somDeToque } from '../../nucleo/audio';
import { ouvirAtivacao } from '../../nucleo/entrada';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import type { PropsDoModulo } from '../registro';

/** Contar até 5 já é bastante; acima disso os círculos ficam pequenos demais. */
const MAIOR_NUMERO = 5;

/**
 * Intervalo entre acender um círculo e o próximo.
 *
 * Acompanha o ritmo da contagem falada. Não precisa respeitar o teto de
 * 0,33 Hz da regra 4.1 porque **nada apaga**: cada círculo acende uma vez e
 * permanece aceso até o fim da rodada. A luminância só sobe, em degraus, e
 * cada degrau é uma fração pequena da tela — não há alternância, que é o que
 * a regra proíbe.
 */
const PASSO_DA_CONTAGEM_MS = 1100;

/**
 * Números — o numeral gigante e a mesma quantidade em círculos grandes,
 * acendendo um por vez durante a contagem falada.
 */
export function Numeros({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const temporizadores = useRef<number[]>([]);

  const [numero, setNumero] = useState(1);
  const [acesos, setAcesos] = useState(0);

  const avisarVolta = useAvisarVolta();
  const perfil = useStore((estado) => estado.perfil);
  const tamanho = useTamanhoDoEstimulo();
  const { largura } = useDimensoes();

  const cores = perfil.coresComResposta;
  const [cor, setCor] = useState<TokenDeCor>(() => cores[0] ?? 'amarelo-sinal');

  const ladoNumeral = tamanho();
  // Os círculos dividem a largura disponível: quanto maior a contagem, menores
  // eles ficam, mas nunca abaixo de um terço do numeral.
  const ladoCirculo = Math.max(
    Math.min(ladoNumeral / 2, (largura * 0.8) / MAIOR_NUMERO),
    ladoNumeral / 3,
  );

  const limparTemporizadores = useCallback(() => {
    for (const t of temporizadores.current) window.clearTimeout(t);
    temporizadores.current = [];
  }, []);

  useEffect(() => {
    definirEstimuloVigente({
      moduloId: 'numeros',
      cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [cor, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  useEffect(() => limparTemporizadores, [limparTemporizadores]);

  const contar = useCallback(
    (quantos: number) => {
      limparTemporizadores();
      setAcesos(0);

      for (let i = 1; i <= quantos; i += 1) {
        const t = window.setTimeout(
          () => {
            // Monotônico de propósito: só cresce, nunca volta. Um círculo que
            // apagasse e reacendesse seria piscar (regra 4.1).
            setAcesos((atual) => Math.max(atual, i));
            falar(String(i));
          },
          PASSO_DA_CONTAGEM_MS * (i - 1),
        );
        temporizadores.current.push(t);
      }
    },
    [limparTemporizadores],
  );

  const avancar = useCallback(() => {
    somDeToque();

    if (acesos < numero) {
      // Contagem em andamento: o toque só recomeça a mesma, sem pular adiante.
      contar(numero);
      return;
    }

    const proximo = (numero % MAIOR_NUMERO) + 1;
    // Contou até cinco e voltaria ao um: avisa antes de recomeçar.
    if (proximo === 1) avisarVolta();
    setNumero(proximo);
    setCor(cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal');
    contar(proximo);
  }, [acesos, avisarVolta, contar, cores, numero]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    return ouvirAtivacao(elemento, avancar);
  }, [avancar]);

  return (
    // Coluna centrada, não duas faixas ancoradas no topo e no rodapé.
    // Posicionar por fração da altura abria um vazio enorme entre o numeral e
    // os círculos, e jogava os círculos rente à borda de baixo — a quantidade
    // precisa ser lida *junto* com o numeral, não do outro lado da tela.
    <div
      ref={container}
      tabIndex={-1}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ladoCirculo / 2,
      }}
    >
      <span
        aria-label={String(numero)}
        style={{
          color: `var(--color-${cor})`,
          fontSize: ladoNumeral,
          lineHeight: 1,
          fontWeight: perfil.pesoFonte === 'bold' ? 700 : 800,
        }}
      >
        {numero}
      </span>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: ladoCirculo / 3,
        }}
      >
        {Array.from({ length: numero }, (_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              width: ladoCirculo,
              height: ladoCirculo,
              borderRadius: '50%',
              backgroundColor: i < acesos ? `var(--color-${cor})` : 'transparent',
              // Um anel marca onde o círculo vai acender, para a aparição não
              // vir do nada. A espessura é fração do próprio círculo, então
              // acompanha a calibração em vez de ser fixa.
              //
              // O anel usa `texto-secundario` e o elemento fica sempre opaco.
              // A versão anterior somava `opacity: 0.25` a um anel em
              // `superficie` (#1A1A1A) — sobre preto, isso é invisível, e um
              // marcador que não se vê é pior que nenhum.
              outline: `${ladoCirculo / 24}px solid var(--color-texto-secundario)`,
              outlineOffset: -(ladoCirculo / 24),
              transitionProperty: 'background-color',
              transitionDuration: `${emSegundos('padrao')}s`,
              transitionTimingFunction: 'ease-out',
            }}
          />
        ))}
      </div>
    </div>
  );
}
