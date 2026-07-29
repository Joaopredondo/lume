import { useCallback, useEffect, useMemo, useState } from 'react';
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

const NOMES_DE_COR: Record<TokenDeCor, string> = {
  'amarelo-sinal': 'amarelo',
  'laranja-sinal': 'laranja',
  'ciano-sinal': 'azul claro',
  'verde-sinal': 'verde',
  'magenta-sinal': 'rosa',
  'vermelho-sinal': 'vermelho',
  // Nunca sorteado aqui: o azul só existe em módulos cognitivos (ver tipos.ts).
  'azul-sinal': 'azul',
};

type Formato = 'circulo' | 'quadrado' | 'triangulo';

const NOMES_DE_FORMA: Record<Formato, string> = {
  circulo: 'círculo',
  quadrado: 'quadrado',
  triangulo: 'triângulo',
};

const FORMATOS: Formato[] = ['circulo', 'quadrado', 'triangulo'];

type Opcao = { cor: TokenDeCor; formato: Formato };

function nomeDe(opcao: Opcao): string {
  return `${NOMES_DE_FORMA[opcao.formato]} ${NOMES_DE_COR[opcao.cor]}`;
}

/**
 * Cores e formas.
 *
 * Modo "encontre": duas opções, cada uma ocupando metade da tela. A instrução
 * é falada e o alvo pode estar de qualquer lado.
 *
 * **Sem tempo e sem punição de erro** (regra 4.7). Tocar na opção errada não
 * produz som de erro, marca vermelha, vibração nem contagem: apenas repete a
 * instrução com calma. Não existe placar nem "tentativas". Errar aqui não é um
 * evento a registrar — é parte de estar aprendendo.
 */
export function CoresEFormas({ posicao }: PropsDoModulo) {
  const [alvo, setAlvo] = useState<Opcao | null>(null);
  const [distrator, setDistrator] = useState<Opcao | null>(null);
  const [alvoNaEsquerda, setAlvoNaEsquerda] = useState(true);

  const perfil = useStore((estado) => estado.perfil);
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const cores = perfil.coresComResposta;
  // Cada opção ocupa metade da tela, então o estímulo cabe na metade da largura.
  const lado = Math.min(tamanho(), largura / 2 - largura * 0.06, altura * 0.7);

  const sortear = useCallback(() => {
    const cor = cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal';
    const formato = FORMATOS[Math.floor(Math.random() * FORMATOS.length)] ?? 'circulo';
    const novoAlvo: Opcao = { cor, formato };

    // O distrator difere em cor OU em forma, nunca nas duas: diferença dupla
    // torna a escolha trivial e não diz o que a pessoa está discriminando.
    const trocarCor = Math.random() < 0.5 && cores.length > 1;
    const outrasCores = cores.filter((c) => c !== cor);
    const outrosFormatos = FORMATOS.filter((f) => f !== formato);

    const novoDistrator: Opcao = trocarCor
      ? { cor: outrasCores[Math.floor(Math.random() * outrasCores.length)] ?? cor, formato }
      : {
          cor,
          formato: outrosFormatos[Math.floor(Math.random() * outrosFormatos.length)] ?? formato,
        };

    setAlvo(novoAlvo);
    setDistrator(novoDistrator);
    setAlvoNaEsquerda(Math.random() < 0.5);
    falar(`Toque no ${nomeDe(novoAlvo)}`);
  }, [cores]);

  useEffect(() => {
    sortear();
    // Só na montagem: sortear de novo a cada render trocaria o alvo no meio da
    // instrução falada.
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
        window.setTimeout(sortear, DURACAO.fade);
        return;
      }

      // Nada de som de erro, marca vermelha, vibração ou contagem de tentativas.
      // Só a instrução repetida com calma (regra 4.7).
      somDeToque();
      falar(`Toque no ${nomeDe(alvoAtual)}`);
    },
    [sortear],
  );

  // Absorve toque involuntário repetido sem atrasar o primeiro (regra 4.2).
  const responderUmaVez = useMemo(() => comAbsorcaoDeRepeticao(responder), [responder]);

  // `filter` em vez de checar depois: o hook de varredura roda em toda render,
  // então não pode haver `return null` antes dele.
  const opcoes = [alvoNaEsquerda ? alvo : distrator, alvoNaEsquerda ? distrator : alvo].filter(
    (o): o is Opcao => o !== null,
  );

  // Varredura: o destaque percorre as duas opções e qualquer toque escolhe a
  // marcada. Desligada, o módulo funciona por toque direto como sempre.
  const destacado = useVarredura(opcoes.length, (indice) => {
    if (!alvo) return;
    responderUmaVez(opcoes[indice] === alvo, alvo);
  });

  if (!alvo || !distrator) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {opcoes.map((opcao, i) => (
        <button
          key={i}
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

function FormaGeometrica({
  formato,
  cor,
  lado,
}: {
  formato: Formato;
  cor: TokenDeCor;
  lado: number;
}) {
  const preenchimento = `var(--color-${cor})`;

  if (formato === 'triangulo') {
    return (
      <svg viewBox="0 0 100 100" width={lado} height={lado} aria-hidden>
        <path d="M50 6 96 92H4L50 6Z" fill={preenchimento} />
      </svg>
    );
  }

  return (
    <span
      aria-hidden
      style={{
        width: lado,
        height: lado,
        backgroundColor: preenchimento,
        borderRadius: formato === 'circulo' ? '50%' : 0,
      }}
    />
  );
}
