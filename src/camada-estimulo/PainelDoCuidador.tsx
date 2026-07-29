import { useCallback, useEffect, useRef, useState } from 'react';
import { marcarResposta } from '../nucleo/eventos';
import { useAcoesDoModulo } from './acoes';

/**
 * Segurar por este tempo para abrir o painel.
 *
 * Menor que os 3s da configuração: nada aqui é destrutivo, e no escuro o
 * cuidador precisa conseguir interromper rápido se houver qualquer sinal de
 * desconforto (ver `docs/AVISO.md`).
 */
const TEMPO_PARA_ABRIR_MS = 1000;

type Props = {
  aoSair: () => void;
};

/**
 * Painel do cuidador dentro da Camada Estímulo.
 *
 * **Por que existe.** No teclado, sair é `Esc` e marcar resposta é `S`/`N`. No
 * celular não há teclado: sem isto, entrar num módulo era um beco sem saída, e
 * — pior — o cuidador não conseguia registrar nada, o que esvazia o histórico
 * inteiro. A seção 6 já previa saída por "botão fixo ou tecla `Esc`".
 *
 * **Por que é um só gesto.** Botões grandes soltos na tela seriam tocados pela
 * própria pessoa atendida, contaminando exatamente o dado que se quer coletar —
 * é a mesma razão pela qual RESPONDEU/NÃO RESPONDEU vivem na superfície de
 * controle. Aqui tudo fica atrás de um alvo pequeno, num canto, que exige
 * **segurar**. Um toque de relance não faz nada.
 *
 * Os atalhos de teclado continuam funcionando em paralelo, sem exclusividade.
 */
export function PainelDoCuidador({ aoSair }: Props) {
  const [aberto, setAberto] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const inicio = useRef<number | null>(null);
  const quadro = useRef<number | null>(null);
  const acoes = useAcoesDoModulo();

  const soltar = useCallback(() => {
    inicio.current = null;
    if (quadro.current !== null) cancelAnimationFrame(quadro.current);
    quadro.current = null;
    setProgresso(0);
  }, []);

  const segurar = useCallback(() => {
    if (inicio.current !== null) return;
    inicio.current = Date.now();

    const passo = () => {
      if (inicio.current === null) return;
      const fracao = Math.min(1, (Date.now() - inicio.current) / TEMPO_PARA_ABRIR_MS);
      setProgresso(fracao);

      if (fracao >= 1) {
        soltar();
        setAberto(true);
        return;
      }
      quadro.current = requestAnimationFrame(passo);
    };

    quadro.current = requestAnimationFrame(passo);
  }, [soltar]);

  useEffect(() => soltar, [soltar]);

  if (aberto) {
    return (
      <div
        role="dialog"
        aria-label="Painel do cuidador"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          // Fundo sólido, não translúcido: o estímulo não pode continuar
          // visível por baixo competindo com os controles.
          background: 'var(--color-tinta-preta)',
          fontFamily: 'var(--font-interface)',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <BotaoGrande
            rotulo="RESPONDEU"
            aoTocar={() => {
              marcarResposta(true, 'controle');
              setAberto(false);
            }}
            destaque
          />
          <BotaoGrande
            rotulo="NÃO RESPONDEU"
            aoTocar={() => {
              marcarResposta(false, 'controle');
              setAberto(false);
            }}
          />
        </div>

        {acoes.map((acao) => (
          <BotaoLinha
            key={acao.id}
            rotulo={acao.rotulo}
            aoTocar={() => {
              acao.executar();
              setAberto(false);
            }}
          />
        ))}

        <BotaoLinha rotulo="Sair da atividade" aoTocar={aoSair} />
        <BotaoLinha rotulo="Voltar ao estímulo" aoTocar={() => setAberto(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Painel do cuidador — segure para abrir"
      onPointerDown={(evento) => {
        // Não deixa o toque virar também a ação principal do módulo, que
        // costuma ser "tocar em qualquer lugar".
        evento.stopPropagation();
        segurar();
      }}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        width: '3.5rem',
        height: '3.5rem',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        // Discreto em repouso, sólido enquanto segura: sem esse retorno o botão
        // pareceria quebrado para quem deu um toque rápido.
        opacity: 0.3 + progresso * 0.7,
        zIndex: 10,
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="var(--color-tinta-preta)"
          stroke="var(--color-giz-branco)"
          strokeWidth="6"
        />
        {/* Arco de progresso: fecha a volta ao completar o tempo. */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="var(--color-amarelo-sinal)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 44}
          strokeDashoffset={2 * Math.PI * 44 * (1 - progresso)}
          transform="rotate(-90 50 50)"
        />
        <circle cx="30" cy="50" r="7" fill="var(--color-giz-branco)" />
        <circle cx="50" cy="50" r="7" fill="var(--color-giz-branco)" />
        <circle cx="70" cy="50" r="7" fill="var(--color-giz-branco)" />
      </svg>
    </button>
  );
}

function BotaoGrande({
  rotulo,
  aoTocar,
  destaque,
}: {
  rotulo: string;
  aoTocar: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      style={{
        flex: 1,
        minHeight: '8rem',
        borderRadius: '1rem',
        border: destaque ? 'none' : '4px solid var(--color-texto-secundario)',
        background: destaque ? 'var(--color-verde-sinal)' : 'var(--color-tinta-preta)',
        color: destaque ? 'var(--color-tinta-preta)' : 'var(--color-giz-branco)',
        fontSize: '1.25rem',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {rotulo}
    </button>
  );
}

function BotaoLinha({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      style={{
        minHeight: '3.5rem',
        borderRadius: '0.5rem',
        border: '2px solid var(--color-texto-secundario)',
        background: 'var(--color-tinta-preta)',
        color: 'var(--color-giz-branco)',
        fontSize: '1rem',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {rotulo}
    </button>
  );
}
