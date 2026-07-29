import { useCallback, useEffect, useRef, useState } from 'react';
import { BotaoSegurar } from './camada-cuidador/BotaoSegurar';
import { Calibracao } from './camada-cuidador/Calibracao';
import { CamadaCuidador } from './camada-cuidador/CamadaCuidador';
import { Configuracao } from './camada-cuidador/Configuracao';
import { ConteudoProprio } from './camada-cuidador/ConteudoProprio';
import { Historico } from './camada-cuidador/Historico';
import { NovoPerfil } from './camada-cuidador/NovoPerfil';
import { SelecaoDeModulo } from './camada-cuidador/SelecaoDeModulo';
import { Seletor } from './camada-cuidador/Seletor';
import { CamadaEstimulo } from './camada-estimulo/CamadaEstimulo';
import { useStore } from './dados/store';
import {
  encerrarSessao,
  iniciarSessao,
  registrarModulo,
  type ResumoDaSessao,
} from './dados/sessoes';
import { MODULOS, posicaoValida, sortearPosicao, type ManifestoDeModulo } from './modulos/registro';
import { Controle } from './camada-cuidador/Controle';
import { abrirEspelhoLocal, papelDaUrl, type Transporte } from './nucleo/espelho';
import { estimuloVigente, marcarResposta } from './nucleo/eventos';
import { useLembreteDePausa } from './nucleo/pausa';

type Tela = 'inicio' | 'calibracao' | 'configuracao' | 'historico' | 'conteudo';

export default function App() {
  // `?papel=controle` abre a superfície de comando em vez do palco. É a única
  // coisa que a URL decide: o resto do roteamento é por estado.
  if (papelDaUrl() === 'controle') {
    return (
      <CamadaCuidador titulo="Controle">
        <Controle />
      </CamadaCuidador>
    );
  }

  return <Palco />;
}

function Palco() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [ativo, setAtivo] = useState<ManifestoDeModulo | null>(null);
  const [resumo, setResumo] = useState<ResumoDaSessao | null>(null);
  const [emSessao, setEmSessao] = useState(false);
  const [criandoPerfil, setCriandoPerfil] = useState(false);

  const perfil = useStore((estado) => estado.perfil);
  const perfis = useStore((estado) => estado.perfis);
  const configuracoes = useStore((estado) => estado.configuracoes);
  const definirPerfil = useStore((estado) => estado.definirPerfil);
  const criarPerfil = useStore((estado) => estado.criarPerfil);
  const hidratar = useStore((estado) => estado.hidratar);

  const pausa = useLembreteDePausa(emSessao);

  useEffect(() => {
    void hidratar();
  }, [hidratar]);

  // Regra 4.6: o Modo calmo é independente do sistema, então mora num atributo
  // no <html> que o CSS global lê (ver index.css).
  useEffect(() => {
    document.documentElement.dataset['calmo'] = String(configuracoes.modoCalmo);
  }, [configuracoes.modoCalmo]);

  const abrirModulo = useCallback(
    (modulo: ManifestoDeModulo) => {
      void (async () => {
        await iniciarSessao(perfil.id);
        await registrarModulo(modulo.id);
        setEmSessao(true);
        setResumo(null);
        setAtivo(modulo);
      })();
    },
    [perfil.id],
  );

  const sair = useCallback(() => setAtivo(null), []);

  /**
   * Espelho: o palco anuncia o que está na tela e obedece aos comandos do
   * controle. `BroadcastChannel` não exige rede nem servidor — é por isso que
   * esta modalidade é a padrão e a única anunciada como offline.
   */
  const espelho = useRef<Transporte | null>(null);

  useEffect(() => {
    espelho.current = abrirEspelhoLocal((mensagem) => {
      if (mensagem.tipo === 'ola') {
        espelho.current?.enviar({
          tipo: 'estado',
          moduloId: null,
          estimulo: estimuloVigente(),
        });
        return;
      }
      if (mensagem.tipo === 'marcar') {
        marcarResposta(mensagem.respondeu, 'controle');
        return;
      }
      if (mensagem.tipo === 'ajustar') {
        useStore.getState().ajustar(mensagem.mudanca);
        return;
      }
      if (mensagem.tipo === 'sair') {
        setAtivo(null);
        return;
      }
      if (mensagem.tipo === 'abrir') {
        const modulo = MODULOS.find((m) => m.id === mensagem.moduloId);
        if (modulo) abrirModulo(modulo);
      }
    });

    return () => {
      espelho.current?.fechar();
      espelho.current = null;
    };
  }, [abrirModulo]);

  // Anuncia a troca de módulo para o controle acompanhar.
  useEffect(() => {
    espelho.current?.enviar({
      tipo: 'estado',
      moduloId: ativo?.id ?? null,
      estimulo: estimuloVigente(),
    });
  }, [ativo]);

  const encerrar = useCallback(() => {
    void encerrarSessao().then((r) => {
      setResumo(r);
      setEmSessao(false);
    });
  }, []);

  const voltar = useCallback(() => setTela('inicio'), []);

  if (ativo) {
    const Modulo = ativo.componente;
    const posicao = configuracoes.sortearPosicao
      ? sortearPosicao(ativo)
      : posicaoValida(ativo, perfil.posicaoPreferencial);

    return (
      <CamadaEstimulo aoSair={sair} nomeDoModulo={ativo.nome}>
        <Modulo posicao={posicao} aoSair={sair} />
      </CamadaEstimulo>
    );
  }

  if (tela !== 'inicio') {
    const titulos: Record<Exclude<Tela, 'inicio'>, string> = {
      calibracao: 'Calibração',
      configuracao: 'Configuração',
      historico: 'Histórico',
      conteudo: 'Conteúdo próprio',
    };

    return (
      <CamadaCuidador titulo={titulos[tela]}>
        {tela === 'calibracao' && <Calibracao aoConcluir={voltar} />}
        {tela === 'configuracao' && <Configuracao />}
        {tela === 'historico' && <Historico />}
        {tela === 'conteudo' && <ConteudoProprio />}
        <button
          type="button"
          onClick={voltar}
          className="mt-12 min-h-14 rounded-lg bg-superficie px-6 text-base font-medium"
        >
          Voltar
        </button>
      </CamadaCuidador>
    );
  }

  return (
    <CamadaCuidador titulo="Início">
      {/*
        O lembrete vive só aqui. Nunca interrompe a Camada Estímulo: um aviso
        surgindo no meio do estímulo seria ruído para quem está em sessão.
      */}
      {pausa.vencido && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-superficie p-4">
          <p className="text-base">
            Já se passaram {configuracoes.intervaloPausaMin} minutos. Vale uma pausa.
          </p>
          <button
            type="button"
            onClick={pausa.adiar}
            className="min-h-14 rounded-lg bg-amarelo-sinal px-5 text-base font-semibold text-tinta-preta"
          >
            Continuar
          </button>
        </div>
      )}

      {resumo && (
        <div className="mb-6 rounded-lg bg-superficie p-4">
          <p className="text-xs tracking-[0.2em] text-texto-secundario uppercase">
            Sessão encerrada
          </p>
          <p className="mt-2 text-base tabular-nums">
            {Math.round(resumo.duracaoMs / 60000)} min · {resumo.sessao.modulos.length} módulo(s) ·{' '}
            {resumo.respondeu} com resposta, {resumo.naoRespondeu} sem
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base text-texto-secundario">Perfil</span>
        <Seletor
          rotulo="Perfil ativo"
          valor={perfil.id}
          opcoes={
            perfis.length === 0
              ? [{ valor: perfil.id, rotulo: perfil.nome }]
              : perfis.map((p) => ({ valor: p.id, rotulo: p.nome }))
          }
          aoMudar={(id) => {
            const escolhido = perfis.find((p) => p.id === id);
            if (escolhido) definirPerfil(escolhido);
          }}
        />

        <button
          type="button"
          onClick={() => setCriandoPerfil(true)}
          className="min-h-14 rounded-lg bg-superficie px-5 text-base font-medium ring-2 ring-texto-secundario/40"
        >
          Novo perfil
        </button>

        {emSessao && (
          <button
            type="button"
            onClick={encerrar}
            className="min-h-14 rounded-lg bg-superficie px-5 text-base font-medium"
          >
            Encerrar sessão
          </button>
        )}
      </div>

      {perfil.limiarAngular === null && (
        <p className="mt-6 rounded-lg bg-superficie p-4 text-base">
          Este perfil ainda não foi calibrado. Até lá, o tamanho do estímulo é um padrão conservador
          — grande de propósito, porque errar para pequeno faria a pessoa parecer não responsiva.
        </p>
      )}

      <h2 className="mt-10 mb-4 text-xs tracking-[0.2em] text-texto-secundario uppercase">
        Módulos
      </h2>
      <SelecaoDeModulo aoEscolher={abrirModulo} />

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setTela('calibracao')}
          className="min-h-14 rounded-lg bg-amarelo-sinal px-6 text-base font-semibold text-tinta-preta"
        >
          Calibrar
        </button>
        <button
          type="button"
          onClick={() => setTela('historico')}
          className="min-h-14 rounded-lg bg-superficie px-6 text-base font-medium"
        >
          Histórico
        </button>
        <button
          type="button"
          onClick={() => setTela('conteudo')}
          className="min-h-14 rounded-lg bg-superficie px-6 text-base font-medium"
        >
          Conteúdo próprio
        </button>
        <BotaoSegurar rotulo="Configuração" aoCompletar={() => setTela('configuracao')} />
      </div>

      <NovoPerfil
        aberto={criandoPerfil}
        aoFechar={() => setCriandoPerfil(false)}
        aoCriar={(nome) => void criarPerfil(nome)}
      />

      <p className="mt-8 text-sm text-texto-secundario">
        Dentro de um módulo: <strong className="text-giz-branco">Esc</strong> sai,{' '}
        <strong className="text-giz-branco">S</strong> marca respondeu,{' '}
        <strong className="text-giz-branco">N</strong> marca não respondeu.
      </p>
    </CamadaCuidador>
  );
}
