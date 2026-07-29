import type { ReactNode } from 'react';
import { useStore } from '../dados/store';
import { POSICOES, type Posicao } from '../dados/tipos';
import { definirMudo } from '../nucleo/audio';
import {
  definirMudoDaFala,
  definirVelocidade,
  VELOCIDADE_MAXIMA,
  VELOCIDADE_MINIMA,
} from '../nucleo/fala';
import { INTERVALO_MAXIMO_MS, INTERVALO_MINIMO_MS } from '../nucleo/varredura';
import { useVozes } from './useVozes';
import { Seletor } from './Seletor';

const NOME_DA_POSICAO: Record<Posicao, string> = {
  centro: 'Centro',
  esquerda: 'Esquerda',
  direita: 'Direita',
  superior: 'Acima',
  inferior: 'Abaixo',
  q1: 'Quadrante superior esquerdo',
  q2: 'Quadrante superior direito',
  q3: 'Quadrante inferior esquerdo',
  q4: 'Quadrante inferior direito',
};

/**
 * Configuração da sessão. Fica atrás de um botão que exige 3 segundos de
 * pressão (ver `BotaoSegurar`), para a criança não entrar sem querer.
 *
 * **Cada ajuste explica o que faz e por que existe.** Um controle de app
 * clínico sem explicação é um controle que ninguém mexe — ou que alguém mexe
 * sem saber a consequência, o que é pior.
 */
export function Configuracao() {
  const configuracoes = useStore((estado) => estado.configuracoes);
  const ajustar = useStore((estado) => estado.ajustar);
  const perfil = useStore((estado) => estado.perfil);
  const atualizarPerfil = useStore((estado) => estado.atualizarPerfil);

  return (
    <div className="flex flex-col gap-12">
      <Grupo
        titulo="Estímulo"
        nota={`Vale para o perfil ${perfil.nome}. Outro perfil tem os próprios ajustes.`}
      >
        <Campo
          rotulo="Posição preferencial"
          explicacao="Onde o estímulo aparece por padrão. Perda de campo visual é comum, e a posição importa tanto quanto o tamanho."
        >
          <Seletor
            rotulo="Posição preferencial"
            valor={perfil.posicaoPreferencial}
            opcoes={POSICOES.map((posicao) => ({
              valor: posicao,
              rotulo: NOME_DA_POSICAO[posicao],
            }))}
            aoMudar={(posicaoPreferencial) => void atualizarPerfil({ posicaoPreferencial })}
          />
        </Campo>

        <Chave
          rotulo="Sortear a posição"
          explicacao="A cada apresentação o estímulo aparece num lugar diferente. Serve para descobrir se há um lado do campo visual que ela não alcança — a posição sorteada entra no registro, então o histórico mostra o padrão."
          ligado={configuracoes.sortearPosicao}
          aoAlternar={() => ajustar({ sortearPosicao: !configuracoes.sortearPosicao })}
        />

        <Campo
          rotulo="Peso da letra"
          explicacao="Traço muito grosso em cor saturada sobre preto produz halação para parte das pessoas com baixa visão. Mais massa nem sempre é mais legível — se ela parecer incomodada com ExtraBold, teste Bold."
        >
          <Seletor
            rotulo="Peso da letra"
            valor={perfil.pesoFonte}
            opcoes={[
              { valor: 'extrabold', rotulo: 'ExtraBold (padrão)' },
              { valor: 'bold', rotulo: 'Bold' },
            ]}
            aoMudar={(pesoFonte) => void atualizarPerfil({ pesoFonte })}
          />
        </Campo>
      </Grupo>

      <Grupo titulo="Movimento">
        <Chave
          rotulo="Modo calmo"
          explicacao="Suprime todo movimento: as formas não atravessam a tela nem crescem, só aparecem por fade. Use quando houver agitação, cansaço ou qualquer sinal de desconforto. Não deixa as animações mais rápidas — deixa de haver animação."
          ligado={configuracoes.modoCalmo}
          aoAlternar={() => ajustar({ modoCalmo: !configuracoes.modoCalmo })}
        />
        <Chave
          rotulo="Lanterna"
          explicacao="Escurece a tela inteira exceto um círculo de luz que segue o dedo, revelando a figura por partes. É treino de rastreamento visual — o mesmo gesto da lanterna física no escuro. Sem toque na tela, as setas do teclado movem a luz."
          ligado={configuracoes.lanternaLigada}
          aoAlternar={() => ajustar({ lanternaLigada: !configuracoes.lanternaLigada })}
        />
      </Grupo>

      <Grupo titulo="Som e fala">
        <Chave
          rotulo="Mudo"
          explicacao="Corta som e fala de uma vez. Os módulos continuam funcionando — o retorno passa a ser só visual."
          ligado={configuracoes.mudo}
          aoAlternar={() => {
            const mudo = !configuracoes.mudo;
            ajustar({ mudo });
            definirMudo(mudo);
            definirMudoDaFala(mudo);
          }}
        />

        <SeletorDeVoz />

        <Deslizante
          rotulo="Velocidade da fala"
          explicacao="Mais devagar dá tempo de processar; mais rápido evita que a atenção se perca no meio da frase. O padrão de 0,8x já é mais lento que o normal."
          valor={configuracoes.velocidadeFala}
          minimo={VELOCIDADE_MINIMA}
          maximo={VELOCIDADE_MAXIMA}
          passo={0.1}
          formatar={(v) => `${v.toFixed(1)}x`}
          aoMudar={(velocidadeFala) => {
            ajustar({ velocidadeFala });
            definirVelocidade(velocidadeFala);
          }}
        />
      </Grupo>

      <Grupo titulo="Acesso por acionador">
        <Chave
          rotulo="Modo varredura"
          explicacao="Um destaque amarelo percorre as opções sozinho e qualquer toque — em qualquer lugar da tela, ou no acionador — escolhe a que estiver marcada. Para quem não consegue apontar. Vale em Cores e formas e em Círculos e setas."
          ligado={configuracoes.varreduraLigada}
          aoAlternar={() => ajustar({ varreduraLigada: !configuracoes.varreduraLigada })}
        />

        <Deslizante
          rotulo="Tempo em cada opção"
          explicacao="No modo varredura, um destaque grosso percorre as opções sozinho e qualquer toque seleciona a que estiver marcada. Este é o tempo em cada opção — quanto maior, mais folga para reagir."
          valor={configuracoes.intervaloVarreduraMs}
          minimo={INTERVALO_MINIMO_MS}
          maximo={INTERVALO_MAXIMO_MS}
          passo={500}
          formatar={(v) => `${(v / 1000).toFixed(1)} s`}
          aoMudar={(intervaloVarreduraMs) => ajustar({ intervaloVarreduraMs })}
        />
      </Grupo>

      <Grupo titulo="Círculos e setas">
        <Deslizante
          rotulo="Itens por rodada"
          explicacao="A folha impressa tem vinte itens de uma vez — denso demais para baixa visão. Aqui aparece um por vez, e isto define quantos formam uma rodada. O padrão de 5 equivale a uma coluna da folha."
          valor={configuracoes.itensPorRodada}
          minimo={1}
          maximo={10}
          passo={1}
          formatar={(v) => String(v)}
          aoMudar={(itensPorRodada) => ajustar({ itensPorRodada })}
        />

        <Chave
          rotulo="Mostrar a legenda"
          explicacao="A regra cor→direção no topo da tela, como na folha impressa. Desligue para quem já memorizou — sem ela sobra mais espaço para o círculo e as setas."
          ligado={configuracoes.mostrarLegenda}
          aoAlternar={() => ajustar({ mostrarLegenda: !configuracoes.mostrarLegenda })}
        />
      </Grupo>

      <Grupo titulo="Sessão">
        <Deslizante
          rotulo="Lembrete de pausa"
          explicacao="Aviso discreto de que já se passou um tempo. Aparece só aqui, nunca na tela da pessoa atendida: um aviso surgindo no meio do estímulo seria ruído para quem está em sessão."
          valor={configuracoes.intervaloPausaMin}
          minimo={5}
          maximo={60}
          passo={5}
          formatar={(v) => `${v} min`}
          aoMudar={(intervaloPausaMin) => ajustar({ intervaloPausaMin })}
        />
      </Grupo>
    </div>
  );
}

/** A lista de vozes chega assíncrona no navegador, então mora num componente. */
function SeletorDeVoz() {
  const { vozes, escolhida, escolher } = useVozes();
  if (vozes.length === 0) return null;

  return (
    <Bloco
      rotulo="Voz"
      explicacao="Vozes em português instaladas neste aparelho. Timbres diferentes prendem atenção de formas diferentes — vale testar qual funciona melhor."
      emLinha
      controle={
        <Seletor
          rotulo="Voz"
          valor={escolhida}
          opcoes={vozes.map((v) => ({ valor: v.name, rotulo: v.name }))}
          aoMudar={escolher}
        />
      }
    />
  );
}

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xs tracking-[0.2em] text-texto-secundario uppercase">{titulo}</h2>
      {nota && <p className="mt-1 text-sm text-texto-secundario">{nota}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Um ajuste é sempre rótulo + explicação + controle, nesta ordem. */
function Bloco({
  rotulo,
  explicacao,
  controle,
  emLinha,
}: {
  rotulo: string;
  explicacao: string;
  controle: ReactNode;
  emLinha?: boolean;
}) {
  return (
    <div className="rounded-xl bg-superficie/60 p-4 ring-1 ring-texto-secundario/20 sm:p-5">
      <div
        className={
          emLinha ? 'flex flex-wrap items-center justify-between gap-3' : 'flex flex-col gap-3'
        }
      >
        <p className="text-base font-medium">{rotulo}</p>
        {controle}
      </div>
      <p className="mt-3 max-w-prose text-sm text-texto-secundario">{explicacao}</p>
    </div>
  );
}

function Campo({
  rotulo,
  explicacao,
  children,
}: {
  rotulo: string;
  explicacao: string;
  children: ReactNode;
}) {
  return <Bloco rotulo={rotulo} explicacao={explicacao} controle={children} emLinha />;
}

function Chave({
  rotulo,
  explicacao,
  ligado,
  aoAlternar,
}: {
  rotulo: string;
  explicacao: string;
  ligado: boolean;
  aoAlternar: () => void;
}) {
  return (
    <Bloco
      rotulo={rotulo}
      explicacao={explicacao}
      emLinha
      controle={
        <button
          type="button"
          role="switch"
          aria-checked={ligado}
          aria-label={rotulo}
          onClick={aoAlternar}
          className={`min-h-14 shrink-0 rounded-lg px-6 text-base font-semibold ${
            ligado
              ? 'bg-amarelo-sinal text-tinta-preta'
              : 'bg-tinta-preta text-texto-secundario ring-2 ring-texto-secundario/40'
          }`}
        >
          {ligado ? 'ligado' : 'desligado'}
        </button>
      }
    />
  );
}

function Deslizante({
  rotulo,
  explicacao,
  valor,
  minimo,
  maximo,
  passo,
  formatar,
  aoMudar,
}: {
  rotulo: string;
  explicacao: string;
  valor: number;
  minimo: number;
  maximo: number;
  passo: number;
  formatar: (valor: number) => string;
  aoMudar: (valor: number) => void;
}) {
  return (
    <Bloco
      rotulo={rotulo}
      explicacao={explicacao}
      controle={
        <div className="w-full">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-texto-secundario">
              {formatar(minimo)} — {formatar(maximo)}
            </span>
            <span className="text-xl font-semibold tabular-nums text-amarelo-sinal">
              {formatar(valor)}
            </span>
          </div>
          <input
            type="range"
            aria-label={rotulo}
            min={minimo}
            max={maximo}
            step={passo}
            value={valor}
            onChange={(e) => aoMudar(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </div>
      }
    />
  );
}
