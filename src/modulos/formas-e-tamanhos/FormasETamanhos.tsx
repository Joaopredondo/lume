import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRegistrarAcao } from '../../camada-estimulo/acoes';
import { useStore } from '../../dados/store';
import type { TokenDeCor } from '../../dados/tipos';
import { somDeConclusao, somDeToque } from '../../nucleo/audio';
import { comAbsorcaoDeRepeticao } from '../../nucleo/entrada';
import { ajustarMultiploDeTamanho } from '../../nucleo/escala';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { DURACAO, emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import { estiloDeDestaque, useVarredura } from '../../nucleo/useVarredura';
import type { PropsDoModulo } from '../registro';
import {
  FORMATOS,
  FormaGeometrica,
  NOMES_DE_COR,
  NOMES_DE_FORMA,
  type Formato,
} from '../formas-comuns';

type NomeTamanho = 'pequeno' | 'medio' | 'grande';

const TAMANHOS: NomeTamanho[] = ['pequeno', 'medio', 'grande'];

const NOMES_DE_TAMANHO: Record<NomeTamanho, string> = {
  pequeno: 'pequeno',
  medio: 'médio',
  grande: 'grande',
};

/**
 * Contraste entre os três tamanhos. Começa fácil (bem diferentes) e fecha
 * quando ela acerta em sequência — o "diminuindo de tamanho" do pedido.
 * O cuidador também sobe/desce o tamanho global pelo painel.
 */
const CONTRASTE: Record<NomeTamanho, number>[] = [
  { pequeno: 0.45, medio: 0.8, grande: 1.25 },
  { pequeno: 0.58, medio: 0.88, grande: 1.18 },
  { pequeno: 0.7, medio: 0.95, grande: 1.12 },
];

type Opcao = { cor: TokenDeCor; formato: Formato; tamanho: NomeTamanho };

type Criterio = 'tamanho' | 'cor' | 'formato';

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copia[i];
    const b = copia[j];
    if (a !== undefined && b !== undefined) {
      copia[i] = b;
      copia[j] = a;
    }
  }
  return copia;
}

function instrucaoDe(alvo: Opcao, criterio: Criterio): string {
  if (criterio === 'tamanho') return `Toque no ${NOMES_DE_TAMANHO[alvo.tamanho]}`;
  if (criterio === 'cor') return `Toque no ${NOMES_DE_COR[alvo.cor]}`;
  return `Toque no ${NOMES_DE_FORMA[alvo.formato]}`;
}

function nomeDe(opcao: Opcao): string {
  return `${NOMES_DE_FORMA[opcao.formato]} ${NOMES_DE_COR[opcao.cor]} ${NOMES_DE_TAMANHO[opcao.tamanho]}`;
}

function montar(cores: TokenDeCor[]): { alvo: Opcao; opcoes: Opcao[]; criterio: Criterio } {
  const coresSorteadas = embaralhar(cores).slice(0, 3);
  while (coresSorteadas.length < 3) {
    coresSorteadas.push(cores[0] ?? 'amarelo-sinal');
  }
  const formatos = embaralhar(FORMATOS);
  const tamanhos = embaralhar(TAMANHOS);

  const opcoes: Opcao[] = TAMANHOS.map((_, i) => ({
    cor: coresSorteadas[i] ?? 'amarelo-sinal',
    formato: formatos[i] ?? 'circulo',
    tamanho: tamanhos[i] ?? 'medio',
  }));

  const criterios: Criterio[] = ['tamanho', 'cor', 'formato'];
  const criterio = criterios[Math.floor(Math.random() * criterios.length)] ?? 'tamanho';
  const alvo = opcoes[Math.floor(Math.random() * opcoes.length)] ?? opcoes[0];

  if (!alvo) {
    const fallback: Opcao = { cor: 'amarelo-sinal', formato: 'circulo', tamanho: 'grande' };
    return { alvo: fallback, opcoes: [fallback], criterio: 'tamanho' };
  }

  return { alvo, opcoes: embaralhar(opcoes), criterio };
}

/**
 * Formas e tamanhos — três formas, cada uma de um tamanho e de uma cor.
 *
 * A voz pede pelo tamanho, pela cor ou pela forma. Sem punição de erro.
 * O contraste entre pequeno/médio/grande fecha quando ela acerta em sequência;
 * o painel do cuidador também tem Maior e Menor.
 */
export function FormasETamanhos({ posicao }: PropsDoModulo) {
  const [alvo, setAlvo] = useState<Opcao | null>(null);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [criterio, setCriterio] = useState<Criterio>('tamanho');
  const [nivelContraste, setNivelContraste] = useState(0);
  const [acertosSeguidos, setAcertosSeguidos] = useState(0);

  const perfil = useStore((estado) => estado.perfil);
  const ajustar = useStore((estado) => estado.ajustar);
  const progressaoTamanho = useStore((estado) => estado.configuracoes.progressaoTamanho);
  const tamanhoBase = useTamanhoDoEstimulo();
  const { altura } = useDimensoes();

  const cores = perfil.coresComResposta;
  const contraste = CONTRASTE[Math.min(nivelContraste, CONTRASTE.length - 1)] ?? CONTRASTE[0];

  const sortear = useCallback(() => {
    const montagem = montar(cores);
    setAlvo(montagem.alvo);
    setOpcoes(montagem.opcoes);
    setCriterio(montagem.criterio);
    falar(instrucaoDe(montagem.alvo, montagem.criterio));
  }, [cores]);

  useEffect(() => {
    sortear();
  }, [sortear]);

  useEffect(() => {
    if (!alvo) return;
    definirEstimuloVigente({
      moduloId: 'formas-e-tamanhos',
      cor: alvo.cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [alvo, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  const bate = useCallback(
    (opcao: Opcao, alvoAtual: Opcao, criterioAtual: Criterio): boolean => {
      if (criterioAtual === 'tamanho') return opcao.tamanho === alvoAtual.tamanho;
      if (criterioAtual === 'cor') return opcao.cor === alvoAtual.cor;
      return opcao.formato === alvoAtual.formato;
    },
    [],
  );

  const responder = useCallback(
    (acertou: boolean, alvoAtual: Opcao, criterioAtual: Criterio) => {
      if (acertou) {
        somDeConclusao();
        falar('Isso!');
        const proximos = acertosSeguidos + 1;
        setAcertosSeguidos(proximos);
        if (proximos > 0 && proximos % 2 === 0) {
          setNivelContraste((n) => Math.min(n + 1, CONTRASTE.length - 1));
          if (progressaoTamanho) {
            const atual = useStore.getState().configuracoes.multiploTamanho || 1;
            ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 0.9) });
          }
        }
        window.setTimeout(sortear, DURACAO.fade);
        return;
      }

      setAcertosSeguidos(0);
      setNivelContraste((n) => Math.max(n - 1, 0));
      if (progressaoTamanho) {
        const atual = useStore.getState().configuracoes.multiploTamanho || 1;
        ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 1.12) });
      }
      somDeToque();
      falar(instrucaoDe(alvoAtual, criterioAtual));
    },
    [acertosSeguidos, ajustar, progressaoTamanho, sortear],
  );

  const responderUmaVez = useMemo(() => comAbsorcaoDeRepeticao(responder), [responder]);

  const destacado = useVarredura(opcoes.length, (indice) => {
    const opcao = opcoes[indice];
    if (!alvo || !opcao) return;
    responderUmaVez(bate(opcao, alvo, criterio), alvo, criterio);
  });

  useRegistrarAcao('maior', 'Maior', () => {
    const atual = useStore.getState().configuracoes.multiploTamanho || 1;
    ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 1.15) });
  });
  useRegistrarAcao('menor', 'Menor', () => {
    const atual = useStore.getState().configuracoes.multiploTamanho || 1;
    ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 0.85) });
  });
  useRegistrarAcao('contraste', 'Mais diferença de tamanho', () => setNivelContraste(0));

  if (!alvo || opcoes.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
      }}
    >
      {opcoes.map((opcao, i) => {
        const lado = Math.min(tamanhoBase(contraste[opcao.tamanho]), altura * 0.7);
        return (
          <button
            key={`${opcao.formato}-${opcao.cor}-${opcao.tamanho}`}
            type="button"
            aria-label={nomeDe(opcao)}
            onPointerDown={() => responderUmaVez(bate(opcao, alvo, criterio), alvo, criterio)}
            onKeyDown={(evento) => {
              if (evento.key !== ' ' && evento.key !== 'Enter') return;
              evento.preventDefault();
              responderUmaVez(bate(opcao, alvo, criterio), alvo, criterio);
            }}
            style={{
              display: 'grid',
              placeItems: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              flex: 1,
              height: '100%',
              animation: `entrar-por-fade ${emSegundos('padrao')}s ease-out both`,
              ...estiloDeDestaque(destacado === i),
            }}
          >
            <FormaGeometrica formato={opcao.formato} cor={opcao.cor} lado={lado} />
          </button>
        );
      })}
    </div>
  );
}
