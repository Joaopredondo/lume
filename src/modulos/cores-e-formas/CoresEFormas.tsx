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

/**
 * Quantidade inicial — o pedido da sessão da Livinha: três formas na tela,
 * não duas. Sobe para 4 e 5 quando ela acerta em sequência.
 */
const QUANTIDADE_INICIAL = 3;
const QUANTIDADE_MINIMA = 2;
const QUANTIDADE_MAXIMA = 5;
const ACERTOS_PARA_SUBIR = 2;

type Opcao = { cor: TokenDeCor; formato: Formato };

function nomeDe(opcao: Opcao): string {
  return `${NOMES_DE_FORMA[opcao.formato]} ${NOMES_DE_COR[opcao.cor]}`;
}

function chaveDe(opcao: Opcao): string {
  return `${opcao.formato}-${opcao.cor}`;
}

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

/**
 * Monta o alvo e os distratores.
 *
 * Cada distrator difere do alvo em **uma** dimensão só (cor ou forma).
 * Diferença dupla torna a escolha trivial e não diz o que ela está
 * discriminando. Os extras alternam cor e forma para a quantidade > 3.
 */
function montarOpcoes(quantidade: number, cores: TokenDeCor[]): { alvo: Opcao; opcoes: Opcao[] } {
  const cor = cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal';
  const formato = FORMATOS[Math.floor(Math.random() * FORMATOS.length)] ?? 'circulo';
  const alvo: Opcao = { cor, formato };

  const outrasCores = embaralhar(cores.filter((c) => c !== cor));
  const outrosFormatos = embaralhar(FORMATOS.filter((f) => f !== formato));

  const opcoes: Opcao[] = [alvo];
  const usados = new Set<string>([chaveDe(alvo)]);

  let indiceCor = 0;
  let indiceForma = 0;
  let querCor = true;

  while (opcoes.length < quantidade) {
    const candidata: Opcao | null = querCor
      ? outrasCores[indiceCor]
        ? { cor: outrasCores[indiceCor] ?? cor, formato }
        : outrosFormatos[indiceForma]
          ? { cor, formato: outrosFormatos[indiceForma] ?? formato }
          : null
      : outrosFormatos[indiceForma]
        ? { cor, formato: outrosFormatos[indiceForma] ?? formato }
        : outrasCores[indiceCor]
          ? { cor: outrasCores[indiceCor] ?? cor, formato }
          : null;

    if (!candidata) break;

    if (querCor) indiceCor += 1;
    else indiceForma += 1;
    querCor = !querCor;

    if (usados.has(chaveDe(candidata))) continue;
    usados.add(chaveDe(candidata));
    opcoes.push(candidata);
  }

  return { alvo, opcoes: embaralhar(opcoes) };
}

/**
 * Cores e formas.
 *
 * Três formas geométricas (círculo, quadrado, triângulo) de cores distintas.
 * A instrução é falada. Sem tempo e sem punição de erro (regra 4.7).
 *
 * Conforme ela acerta em sequência, entram mais formas e o tamanho encolhe
 * um pouco — o inverso quando o toque erra o alvo, para ela alcançar.
 */
export function CoresEFormas({ posicao }: PropsDoModulo) {
  const perfil = useStore((estado) => estado.perfil);
  const ajustar = useStore((estado) => estado.ajustar);
  const formasIniciais = useStore((estado) => estado.configuracoes.formasIniciais);
  const progressaoQuantidade = useStore((estado) => estado.configuracoes.progressaoQuantidade);
  const progressaoTamanho = useStore((estado) => estado.configuracoes.progressaoTamanho);

  const [alvo, setAlvo] = useState<Opcao | null>(null);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [quantidade, setQuantidade] = useState(() =>
    Math.min(QUANTIDADE_MAXIMA, Math.max(QUANTIDADE_MINIMA, formasIniciais || QUANTIDADE_INICIAL)),
  );
  const [acertosSeguidos, setAcertosSeguidos] = useState(0);
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const cores = perfil.coresComResposta;
  const lado = Math.min(
    tamanho(),
    largura / Math.max(opcoes.length, 1) - largura * 0.04,
    altura * 0.55,
  );

  const sortear = useCallback(() => {
    const montagem = montarOpcoes(quantidade, cores);
    setAlvo(montagem.alvo);
    setOpcoes(montagem.opcoes);
    falar(`Toque no ${nomeDe(montagem.alvo)}`);
  }, [cores, quantidade]);

  useEffect(() => {
    sortear();
  }, [sortear]);

  useEffect(() => {
    if (!alvo) return;
    definirEstimuloVigente({
      moduloId: 'cores-e-formas',
      cor: alvo.cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [alvo, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  const responder = useCallback(
    (acertou: boolean, alvoAtual: Opcao) => {
      if (acertou) {
        somDeConclusao();
        falar('Isso!');
        const proximos = acertosSeguidos + 1;
        setAcertosSeguidos(proximos);

        if (proximos > 0 && proximos % ACERTOS_PARA_SUBIR === 0) {
          if (progressaoTamanho) {
            const atual = useStore.getState().configuracoes.multiploTamanho || 1;
            ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 0.85) });
          }
          if (progressaoQuantidade && quantidade < QUANTIDADE_MAXIMA) {
            window.setTimeout(() => setQuantidade((q) => Math.min(QUANTIDADE_MAXIMA, q + 1)), DURACAO.fade);
            return;
          }
        }

        window.setTimeout(sortear, DURACAO.fade);
        return;
      }

      // Nada de som de erro, marca vermelha, vibração ou contagem de tentativas.
      // Só a instrução repetida com calma (regra 4.7). O tamanho cresce um
      // pouco para ela alcançar — não é punição, é ajuste.
      setAcertosSeguidos(0);
      if (progressaoTamanho) {
        const atual = useStore.getState().configuracoes.multiploTamanho || 1;
        ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 1.12) });
      }
      somDeToque();
      falar(`Toque no ${nomeDe(alvoAtual)}`);
    },
    [acertosSeguidos, ajustar, progressaoQuantidade, progressaoTamanho, quantidade, sortear],
  );

  const responderUmaVez = useMemo(() => comAbsorcaoDeRepeticao(responder), [responder]);

  const destacado = useVarredura(opcoes.length, (indice) => {
    if (!alvo) return;
    responderUmaVez(opcoes[indice] === alvo, alvo);
  });

  useRegistrarAcao('mais-formas', 'Mais formas', () =>
    setQuantidade((q) => Math.min(QUANTIDADE_MAXIMA, q + 1)),
  );
  useRegistrarAcao('menos-formas', 'Menos formas', () =>
    setQuantidade((q) => Math.max(QUANTIDADE_MINIMA, q - 1)),
  );
  useRegistrarAcao('maior', 'Maior', () => {
    const atual = useStore.getState().configuracoes.multiploTamanho || 1;
    ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 1.15) });
  });
  useRegistrarAcao('menor', 'Menor', () => {
    const atual = useStore.getState().configuracoes.multiploTamanho || 1;
    ajustar({ multiploTamanho: ajustarMultiploDeTamanho(atual, 0.85) });
  });

  if (!alvo || opcoes.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {opcoes.map((opcao, i) => (
        <button
          key={chaveDe(opcao) + String(i)}
          type="button"
          aria-label={nomeDe(opcao)}
          onPointerDown={() => responderUmaVez(opcao === alvo, alvo)}
          onKeyDown={(evento) => {
            if (evento.key !== ' ' && evento.key !== 'Enter') return;
            evento.preventDefault();
            responderUmaVez(opcao === alvo, alvo);
          }}
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            animation: `entrar-por-fade ${emSegundos('padrao')}s ease-out both`,
            ...estiloDeDestaque(destacado === i),
          }}
        >
          <FormaGeometrica formato={opcao.formato} cor={opcao.cor} lado={lado} />
        </button>
      ))}
    </div>
  );
}
