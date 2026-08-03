import { useCallback, useEffect, useMemo, useState } from 'react';
import { BotaoSegurar } from '../../camada-cuidador/BotaoSegurar';
import { useRegistrarAcao } from '../../camada-estimulo/acoes';
import { Silhueta } from '../../design/silhuetas';
import { lerRotina, salvarRotina } from '../../dados/fichas';
import { useStore } from '../../dados/store';
import { useConteudoProprio } from '../../dados/useConteudoProprio';
import { somDeConclusao, somDeToque } from '../../nucleo/audio';
import { useArraste } from '../../nucleo/arraste';
import { definirEstimuloVigente, marcarResposta } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import { estiloDeDestaque, useVarredura } from '../../nucleo/useVarredura';
import type { PropsDoModulo } from '../registro';
import { FIGURINHAS, figurinhaPorId, type Figurinha } from './figurinhas';
import {
  agora as passoAtual,
  avancar,
  colocar,
  depois as passoSeguinte,
  estaNoFim,
  progresso,
  rotinaInicial,
  voltar,
  type EstadoDaRotina,
} from './rotina';

type Modo = 'crianca' | 'voluntario';
type FigurinhaComUrl = Figurinha & { url?: string };

/**
 * Agora e depois — apoio de transição entre atividades.
 *
 * É o pedido central do ministério, e a lacuna que o app tinha: ele estimulava
 * e media, mas não ajudava na **troca** de atividade — que é onde a crise
 * acontece.
 *
 * O quadro físico é verde e vermelho sobre branco. Aqui o fundo continua preto
 * absoluto, porque a usuária principal tem histórico de crises; verde e
 * vermelho entram só como moldura e faixa de rótulo. Tema claro para crianças
 * sem risco convulsivo é mudança de escopo clínico — pendência registrada no
 * README, não improvisada aqui.
 *
 * Só o tamanho da figura vem de número calculado: ele deriva do limiar do
 * perfil (`useEscala`). Todo o resto é classe do Tailwind com os tokens — a
 * regra 4.8 proíbe medida escrita à mão nesta camada.
 */
export function AgoraEDepois({ posicao }: PropsDoModulo) {
  const perfil = useStore((estado) => estado.perfil);
  const proprios = useConteudoProprio('figurinha');
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const [modo, setModo] = useState<Modo>('voluntario');
  const [estado, setEstado] = useState<EstadoDaRotina>(() => rotinaInicial());
  const [selecionada, setSelecionada] = useState<string | null>(null);

  /** As padrão mais as que o voluntário cadastrou com foto. */
  const bandeja = useMemo<FigurinhaComUrl[]>(
    () => [
      ...FIGURINHAS,
      ...proprios.map((item) => ({
        id: `proprio:${item.id}`,
        nome: item.palavra,
        // A silhueta é só reserva: havendo `url`, a foto limiarizada é que
        // desenha. Ver `FiguraDaBandeja`.
        silhueta: 'estrela' as const,
        cor: 'amarelo-sinal' as const,
        url: item.url,
      })),
    ],
    [proprios],
  );

  // A rotina do culto é a mesma toda semana; redigitar a cada vez inviabiliza.
  useEffect(() => {
    void lerRotina(perfil.id).then((passos) => {
      if (passos && passos.length > 0) setEstado(rotinaInicial(passos));
    });
  }, [perfil.id]);

  const persistir = useCallback(
    (proximo: EstadoDaRotina) => {
      setEstado(proximo);
      void salvarRotina(perfil.id, proximo.rotina);
    },
    [perfil.id],
  );

  useEffect(() => {
    definirEstimuloVigente({
      moduloId: 'agora-e-depois',
      cor: 'verde-sinal',
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [perfil.limiarAngular, perfil.pesoFonte, posicao]);

  const concluirPasso = useCallback(() => {
    if (estaNoFim(estado)) {
      somDeConclusao();
      falar('Terminou. Muito bem!');
      return;
    }

    const proximo = avancar(estado);
    setEstado(proximo);
    somDeConclusao();

    const nome = figurinhaPorId(passoAtual(proximo) ?? '')?.nome;
    if (nome) falar(`Agora: ${nome}`);

    // Cada passo cumprido vira evento: é o que preenche "Passos da rotina" na
    // ficha do culto.
    marcarResposta(true, 'controle');
  }, [estado]);

  const encaixar = useCallback(
    (id: string, espaco: string) => {
      if (espaco !== 'agora' && espaco !== 'depois') return;
      persistir(colocar(estado, id, espaco));
      setSelecionada(null);
      somDeToque();

      const nome = figurinhaPorId(id)?.nome ?? bandeja.find((f) => f.id === id)?.nome;
      if (nome) falar(`${espaco === 'agora' ? 'Agora' : 'Depois'}: ${nome}`);
    },
    [bandeja, estado, persistir],
  );

  const arraste = useArraste({ aoSoltar: encaixar });

  // Tocar-e-tocar: toca a figurinha, toca o espaço. Precisa existir — arrastar
  // é difícil para parte das crianças.
  const tocarEspaco = useCallback(
    (espaco: 'agora' | 'depois') => {
      if (!selecionada) return;
      encaixar(selecionada, espaco);
    },
    [encaixar, selecionada],
  );

  const destacado = useVarredura(modo === 'crianca' ? 1 : 0, () => concluirPasso());

  useRegistrarAcao(
    'agora-e-depois-modo',
    modo === 'crianca' ? 'Voltar ao modo voluntário' : 'Entrar no modo criança',
    useCallback(() => setModo((m) => (m === 'crianca' ? 'voluntario' : 'crianca')), []),
  );

  const lado = Math.min(tamanho(), largura / 3, altura * 0.3);
  const [cumpridos, total] = progresso(estado);

  return (
    // A folga à esquerda no topo abre espaço para o gatilho do painel do
    // cuidador, que mora no canto: no celular a faixa quebrava em duas linhas e
    // passava por baixo dele, e o painel é a única saída no toque.
    <div className="absolute inset-0 flex touch-none flex-col gap-4 py-4 pr-4 pl-24">
      <FaixaDaRotina rotina={estado.rotina} indice={estado.indice} />

      <div className="flex min-h-0 flex-1 gap-4">
        <Espaco
          titulo="AGORA"
          moldura="ring-verde-sinal"
          faixa="bg-verde-sinal"
          figurinha={passoAtual(estado)}
          bandeja={bandeja}
          lado={lado}
          refAlvo={arraste.registrarAlvo('agora')}
          sobre={arraste.sobre === 'agora'}
          destacado={destacado === 1}
          aoTocar={() => tocarEspaco('agora')}
        />
        <Espaco
          titulo="DEPOIS"
          moldura="ring-vermelho-sinal"
          faixa="bg-vermelho-sinal"
          figurinha={passoSeguinte(estado)}
          bandeja={bandeja}
          lado={lado}
          refAlvo={arraste.registrarAlvo('depois')}
          sobre={arraste.sobre === 'depois'}
          destacado={destacado === 2}
          aoTocar={() => tocarEspaco('depois')}
        />
      </div>

      <button
        type="button"
        onClick={concluirPasso}
        className="min-h-20 rounded-2xl bg-amarelo-sinal text-2xl font-extrabold text-tinta-preta"
        style={estiloDeDestaque(destacado === 0)}
      >
        TERMINEI · PRÓXIMO
      </button>

      <p className="text-center tabular-nums text-texto-secundario">
        {cumpridos} de {total}
      </p>

      {/* A bandeja não existe no modo criança: figurinha ao alcance vira
          brinquedo e a rotina se desmonta sozinha. */}
      {modo === 'voluntario' && (
        <Bandeja
          figurinhas={bandeja}
          selecionada={selecionada}
          aoSelecionar={(id) => {
            setSelecionada(id === selecionada ? null : id);
            const nome = bandeja.find((f) => f.id === id)?.nome;
            if (nome) falar(nome);
          }}
          aoArrastar={arraste.comecar}
        />
      )}

      <div className="flex justify-center gap-3">
        {modo === 'voluntario' ? (
          <>
            <BotaoSecundario rotulo="Passo anterior" aoTocar={() => setEstado(voltar(estado))} />
            <BotaoSecundario rotulo="Modo criança" aoTocar={() => setModo('crianca')} />
          </>
        ) : (
          // Sair do modo criança exige segurar, o mesmo mecanismo da
          // Configuração: a criança não pode devolver a bandeja sozinha.
          <BotaoSegurar rotulo="Modo voluntário" aoCompletar={() => setModo('voluntario')} />
        )}
      </div>

      {/* Fantasma que segue o dedo enquanto arrasta. */}
      {arraste.arrastando && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{ left: arraste.x, top: arraste.y }}
        >
          <FiguraDaBandeja
            figurinha={bandeja.find((f) => f.id === arraste.arrastando)}
            lado={lado / 2}
          />
        </div>
      )}
    </div>
  );
}

function FaixaDaRotina({ rotina, indice }: { rotina: string[]; indice: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {rotina.map((id, i) => (
        <span
          key={`${id}-${i}`}
          className={`rounded-full px-4 py-1 text-sm ${
            i === indice
              ? 'bg-giz-branco font-bold text-tinta-preta'
              : 'text-texto-secundario ring-2 ring-texto-secundario/40'
          } ${i < indice ? 'line-through' : ''}`}
        >
          {figurinhaPorId(id)?.nome ?? id}
        </span>
      ))}
    </div>
  );
}

function Espaco({
  titulo,
  moldura,
  faixa,
  figurinha,
  bandeja,
  lado,
  refAlvo,
  sobre,
  destacado,
  aoTocar,
}: {
  titulo: string;
  moldura: string;
  faixa: string;
  figurinha: string | undefined;
  bandeja: FigurinhaComUrl[];
  lado: number;
  refAlvo: (elemento: HTMLElement | null) => void;
  sobre: boolean;
  destacado: boolean;
  aoTocar: () => void;
}) {
  const item = bandeja.find((f) => f.id === figurinha);

  return (
    <button
      type="button"
      ref={refAlvo}
      onClick={aoTocar}
      aria-label={`${titulo}${item ? `: ${item.nome}` : ', vazio'}`}
      // Moldura colorida em vez de fundo colorido: o quadro físico é verde e
      // vermelho, mas fundo claro não é opção com risco convulsivo.
      className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-tinta-preta ring-8 ring-inset ${moldura} ${
        sobre ? 'opacity-75' : ''
      }`}
      style={estiloDeDestaque(destacado)}
    >
      <span
        className={`rounded-full px-5 py-1 font-extrabold tracking-[0.1em] text-tinta-preta ${faixa}`}
      >
        {titulo}
      </span>

      {item ? (
        <>
          <FiguraDaBandeja figurinha={item} lado={lado} />
          <span className="text-xl text-giz-branco">{item.nome}</span>
        </>
      ) : (
        <span className="text-texto-secundario">vazio</span>
      )}
    </button>
  );
}

function FiguraDaBandeja({
  figurinha,
  lado,
}: {
  figurinha: FigurinhaComUrl | undefined;
  lado: number;
}) {
  if (!figurinha) return null;

  if (figurinha.url) {
    return (
      <div
        role="img"
        aria-label={figurinha.nome}
        className="bg-giz-branco"
        style={{
          width: lado,
          height: lado,
          maskImage: `url(${figurinha.url})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${figurinha.url})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return <Silhueta id={figurinha.silhueta} cor={figurinha.cor} tamanho={lado} />;
}

/** Miniatura da bandeja: interface do voluntário, não estímulo calibrado. */
const LADO_NA_BANDEJA = 48;

function Bandeja({
  figurinhas,
  selecionada,
  aoSelecionar,
  aoArrastar,
}: {
  figurinhas: FigurinhaComUrl[];
  selecionada: string | null;
  aoSelecionar: (id: string) => void;
  aoArrastar: (id: string, evento: { clientX: number; clientY: number }) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto border-t-2 border-texto-secundario/30 p-2">
      {figurinhas.map((figurinha) => (
        <button
          key={figurinha.id}
          type="button"
          onPointerDown={(evento) => aoArrastar(figurinha.id, evento)}
          onClick={() => aoSelecionar(figurinha.id)}
          aria-pressed={selecionada === figurinha.id}
          aria-label={figurinha.nome}
          className={`flex min-h-14 shrink-0 touch-none flex-col items-center gap-1 rounded-xl bg-tinta-preta p-2 ring-inset ${
            selecionada === figurinha.id
              ? 'ring-4 ring-amarelo-sinal'
              : 'ring-2 ring-texto-secundario/40'
          }`}
        >
          <FiguraDaBandeja figurinha={figurinha} lado={LADO_NA_BANDEJA} />
          <span className="text-xs text-giz-branco">{figurinha.nome}</span>
        </button>
      ))}
    </div>
  );
}

function BotaoSecundario({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      className="min-h-14 rounded-lg bg-tinta-preta px-6 text-base text-giz-branco ring-2 ring-texto-secundario"
    >
      {rotulo}
    </button>
  );
}
