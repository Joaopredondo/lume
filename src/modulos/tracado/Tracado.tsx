import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvisarVolta } from '../../camada-estimulo/acoes';
import { useStore } from '../../dados/store';
import { somDeConclusao } from '../../nucleo/audio';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { falar } from '../../nucleo/fala';
import { useMovimentoReduzido } from '../../nucleo/movimento';
import { DURACAO, emSegundos } from '../../nucleo/seguranca';
import {
  FATOR_DE_TOLERANCIA,
  TIPOS_DE_PERCURSO,
  avancarNoPercurso,
  escalarPercurso,
  estaConcluido,
  gerarPercurso,
  medirPercurso,
  pontoEm,
  type Ponto,
} from '../../nucleo/tracado';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import type { PropsDoModulo } from '../registro';

/** A linha é uma fração do estímulo calibrado — nunca uma espessura fixa. */
const FRACAO_DA_ESPESSURA = 0.22;

/**
 * Traçado — o dedo percorre uma linha laranja e a parte percorrida se preenche
 * em amarelo.
 *
 * O que sustenta o módulo é a tolerância generosa e o fato de o progresso
 * **nunca retroceder**: soltar o dedo não reinicia, e voltar com a mão não
 * desfaz nada. Refazer trabalho já feito seria punição, e a regra 4.7 não
 * admite punição. Ver `nucleo/tracado.ts`.
 */
export function Tracado({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [concluido, setConcluido] = useState(false);

  const avisarVolta = useAvisarVolta();
  const perfil = useStore((estado) => estado.perfil);
  const reduzido = useMovimentoReduzido();
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const tipo = TIPOS_DE_PERCURSO[indice] ?? 'reta-horizontal';
  const espessura = Math.max(tamanho() * FRACAO_DA_ESPESSURA, 1);
  const tolerancia = espessura * FATOR_DE_TOLERANCIA;

  const pontos = useMemo(
    () => escalarPercurso(gerarPercurso(tipo), largura, altura),
    [tipo, largura, altura],
  );

  const { total } = useMemo(() => medirPercurso(pontos), [pontos]);
  const partida = pontos[0] ?? { x: 0, y: 0 };
  const d = useMemo(() => paraSvg(pontos), [pontos]);

  useEffect(() => {
    definirEstimuloVigente({
      moduloId: 'tracado',
      cor: 'laranja-sinal',
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [perfil.limiarAngular, perfil.pesoFonte, posicao]);

  const mover = useCallback(
    (dedo: Ponto) => {
      if (concluido) return;

      setProgresso((atual) => {
        const { progresso: novo } = avancarNoPercurso(pontos, dedo, atual, tolerancia);

        if (estaConcluido(novo) && !estaConcluido(atual)) {
          setConcluido(true);
          somDeConclusao();
          falar('Muito bem!');
          // A linha acende inteira e o próximo percurso entra depois do fade.
          window.setTimeout(() => {
            setIndice((i) => {
              const proximo = (i + 1) % TIPOS_DE_PERCURSO.length;
              // Percorreu os cinco traçados: avisa antes de recomeçar.
              if (proximo === 0) avisarVolta();
              return proximo;
            });
            setProgresso(0);
            setConcluido(false);
          }, DURACAO.fade);
        }

        return novo;
      });
    },
    [avisarVolta, concluido, pontos, tolerancia],
  );

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;

    const aoApontar = (evento: Event) => {
      const ponteiro = evento as PointerEvent;
      // Sem exigir botão pressionado: arrastar obrigatório é proibido (seção 6),
      // então o dedo apenas encostado já conta.
      const area = elemento.getBoundingClientRect();
      mover({ x: ponteiro.clientX - area.left, y: ponteiro.clientY - area.top });
    };

    elemento.addEventListener('pointermove', aoApontar);
    elemento.addEventListener('pointerdown', aoApontar);
    return () => {
      elemento.removeEventListener('pointermove', aoApontar);
      elemento.removeEventListener('pointerdown', aoApontar);
    };
  }, [mover]);

  // Teclado e acionador: avançar em passos, para quem não aponta.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== ' ' && evento.key !== 'Enter' && evento.key !== 'ArrowRight') return;
      evento.preventDefault();
      const alvo = pontoEm(pontos, Math.min(1, progresso + 0.1));
      mover(alvo);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [mover, pontos, progresso]);

  const percorrido = total * progresso;

  return (
    <div
      ref={container}
      tabIndex={-1}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <svg width={largura} height={altura} style={{ display: 'block' }} aria-hidden>
        {/* A linha inteira, sempre visível: o percurso não é um mistério. */}
        <path
          d={d}
          fill="none"
          stroke="var(--color-laranja-sinal)"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* A parte percorrida, em amarelo. Ao concluir, acende inteira. */}
        <path
          d={d}
          fill="none"
          stroke="var(--color-amarelo-sinal)"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={total}
          strokeDashoffset={concluido ? 0 : total - percorrido}
          style={
            concluido
              ? { transition: `stroke-dashoffset ${emSegundos('padrao')}s ease-out` }
              : undefined
          }
        />

        {/*
          Ponto de partida. Pulsa em ciclo de 4s alterando SÓ `transform: scale`
          — a luminância fica constante, que é a condição da regra 4.1 para uma
          animação poder se repetir. Com movimento reduzido, fica parado.
        */}
        {progresso === 0 && (
          <circle
            cx={partida.x}
            cy={partida.y}
            r={espessura}
            fill="var(--color-verde-sinal)"
            style={{
              transformOrigin: `${partida.x}px ${partida.y}px`,
              animation: reduzido
                ? undefined
                : `pulsar-partida ${emSegundos('pulso')}s ease-in-out infinite`,
            }}
          />
        )}
      </svg>
    </div>
  );
}

function paraSvg(pontos: Ponto[]): string {
  return pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}
