import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAvisarVolta } from '../../camada-estimulo/acoes';
import { useStore } from '../../dados/store';
import type { TokenDeCor } from '../../dados/tipos';
import { somDeConclusao, somDeToque } from '../../nucleo/audio';
import { comAbsorcaoDeRepeticao } from '../../nucleo/entrada';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { DURACAO, emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import { estiloDeDestaque, useVarredura } from '../../nucleo/useVarredura';
import type { PropsDoModulo } from '../registro';
import {
  DIRECOES,
  NOMES_DE_COR,
  NOMES_DE_DIRECAO,
  REGRA,
  ROTACAO,
  direcaoDe,
  sortearSequencia,
  type Direcao,
} from './regra';

/**
 * Círculos e setas — versão digital da atividade impressa.
 *
 * **A folha real não é o que o prompt descrevia.** Ela tem uma legenda no topo,
 * uma grade de 4×5 círculos coloridos e, abaixo, uma grade de quadrados vazios
 * que a pessoa preenche com a seta correspondente à cor do círculo acima dele.
 * É transcrição por correspondência, coluna a coluna — não seleção de par.
 *
 * A adaptação necessária: **20 itens numa tela é denso demais para baixa
 * visão**. Aqui a grade é fatiada — um círculo por vez, quatro setas gigantes —
 * e o tamanho da rodada vem da configuração. Escolher a seta certa aqui é o
 * equivalente a preencher um quadrado da folha.
 *
 * Sem tempo e sem punição de erro (regra 4.7).
 */
export function CirculosESetas({ posicao }: PropsDoModulo) {
  const avisarVolta = useAvisarVolta();
  const perfil = useStore((estado) => estado.perfil);
  const itensPorRodada = useStore((estado) => estado.configuracoes.itensPorRodada);
  const mostrarLegenda = useStore((estado) => estado.configuracoes.mostrarLegenda);
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const [sequencia, setSequencia] = useState<TokenDeCor[]>(() => sortearSequencia(itensPorRodada));
  const [indice, setIndice] = useState(0);

  const corAtual = sequencia[indice] ?? 'azul-sinal';
  const direcaoCerta = direcaoDe(corAtual) ?? 'cima';

  // Legenda em cima, círculo no meio, quatro setas embaixo: o layout ocupa a
  // tela toda, então cada peça é limitada pelo espaço e não só pelo limiar.
  const ladoDaSeta = Math.min(tamanho(), largura / 4 - largura * 0.04, altura * 0.3);
  const ladoDoCirculo = Math.min(tamanho(), altura * 0.26);

  useEffect(() => {
    definirEstimuloVigente({
      moduloId: 'circulos-e-setas',
      cor: corAtual,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [corAtual, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  useEffect(() => {
    falar(`Círculo ${NOMES_DE_COR[corAtual] ?? ''}. Qual seta?`);
  }, [corAtual]);

  const responder = useCallback(
    (escolhida: Direcao) => {
      if (escolhida !== direcaoCerta) {
        // Nada de som de erro, marca vermelha ou contagem de tentativas.
        // Só a regra dita de novo, com calma.
        somDeToque();
        falar(`O círculo ${NOMES_DE_COR[corAtual] ?? ''} vai ${NOMES_DE_DIRECAO[direcaoCerta]}`);
        return;
      }

      somDeConclusao();
      falar('Isso!');

      window.setTimeout(() => {
        setIndice((atual) => {
          const proximo = atual + 1;
          if (proximo < sequencia.length) return proximo;

          // Rodada completa: avisa e prepara a próxima sequência. Sem placar,
          // sem "nível", sem "você acertou 4 de 5" — a regra 4.7 não admite
          // escore; o aviso é só de que a rodada terminou.
          avisarVolta();
          setSequencia(sortearSequencia(itensPorRodada));
          return 0;
        });
      }, DURACAO.fade);
    },
    [avisarVolta, corAtual, direcaoCerta, itensPorRodada, sequencia.length],
  );

  const responderUmaVez = useMemo(() => comAbsorcaoDeRepeticao(responder), [responder]);

  // Varredura sobre as quatro setas, para quem não consegue apontar.
  const destacado = useVarredura(DIRECOES.length, (indice) => {
    const direcao = DIRECOES[indice];
    if (direcao) responderUmaVez(direcao);
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      {mostrarLegenda && <Legenda lado={ladoDaSeta / 3} />}

      <div
        key={`${indice}-${corAtual}`}
        aria-label={`círculo ${NOMES_DE_COR[corAtual] ?? ''}`}
        style={{
          width: ladoDoCirculo,
          height: ladoDoCirculo,
          borderRadius: '50%',
          backgroundColor: `var(--color-${corAtual})`,
          animation: `entrar-por-fade ${emSegundos('padrao')}s ease-out both`,
        }}
      />

      <div style={{ display: 'flex', gap: ladoDaSeta / 6 }}>
        {DIRECOES.map((direcao, i) => (
          <button
            key={direcao}
            type="button"
            aria-label={`seta ${NOMES_DE_DIRECAO[direcao]}`}
            onPointerDown={() => responderUmaVez(direcao)}
            onKeyDown={(evento) => {
              if (evento.key !== ' ' && evento.key !== 'Enter') return;
              evento.preventDefault();
              responderUmaVez(direcao);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              lineHeight: 0,
              ...estiloDeDestaque(destacado === i),
            }}
          >
            <Seta direcao={direcao} lado={ladoDaSeta} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** A legenda do topo da folha: o par cor→direção que define a regra. */
function Legenda({ lado }: { lado: number }) {
  return (
    <div aria-hidden style={{ display: 'flex', gap: lado, alignItems: 'center', opacity: 0.85 }}>
      {REGRA.map(({ cor, direcao }) => (
        <div key={cor} style={{ display: 'flex', alignItems: 'center', gap: lado / 4 }}>
          <span
            style={{
              width: lado,
              height: lado,
              borderRadius: '50%',
              backgroundColor: `var(--color-${cor})`,
              display: 'block',
            }}
          />
          <Seta direcao={direcao} lado={lado} />
        </div>
      ))}
    </div>
  );
}

function Seta({ direcao, lado }: { direcao: Direcao; lado: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={lado}
      height={lado}
      aria-hidden
      style={{ transform: `rotate(${ROTACAO[direcao]}deg)`, display: 'block' }}
    >
      {/* Seta sólida e espessa — nada de ícone vazado nem de traço fino. */}
      <path d="M50 6 88 46H66v48H34V46H12L50 6Z" fill="var(--color-giz-branco)" />
    </svg>
  );
}
