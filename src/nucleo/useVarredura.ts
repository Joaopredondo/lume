import { useEffect, useRef, useState } from 'react';
import { useStore } from '../dados/store';
import { criarVarredura, type Varredura } from './varredura';

/**
 * Modo varredura ligado a um módulo (seção 6).
 *
 * Para quem não consegue apontar: um destaque grosso percorre as opções sozinho
 * e **qualquer** toque — em qualquer lugar da tela, ou no acionador — seleciona
 * a que estiver marcada.
 *
 * O motor já existia em `varredura.ts` desde a etapa 2, com teste, mas nenhum
 * módulo o usava: era um recurso que existia só no código. Este hook é a ponte.
 *
 * Devolve o índice destacado, ou `null` quando a varredura está desligada — aí
 * o módulo se comporta normalmente, por toque direto.
 */
export function useVarredura(
  totalDeItens: number,
  aoSelecionar: (indice: number) => void,
): number | null {
  const ligada = useStore((estado) => estado.configuracoes.varreduraLigada);
  const intervaloMs = useStore((estado) => estado.configuracoes.intervaloVarreduraMs);

  const [destacado, setDestacado] = useState<number | null>(null);
  const motor = useRef<Varredura | null>(null);

  // A seleção vem de um timer; sem ref, o callback congelaria no primeiro valor.
  const selecionar = useRef(aoSelecionar);
  selecionar.current = aoSelecionar;

  useEffect(() => {
    if (!ligada || totalDeItens <= 0) {
      setDestacado(null);
      return;
    }

    const varredura = criarVarredura({
      totalDeItens,
      intervaloMs,
      aoDestacar: setDestacado,
      aoSelecionar: (indice) => selecionar.current(indice),
    });

    motor.current = varredura;
    varredura.iniciar();

    // Qualquer toque na tela seleciona o item destacado — a pessoa não precisa
    // acertar o alvo, só reagir no momento certo.
    const aoTocar = () => varredura.selecionar();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === ' ' || evento.key === 'Enter') {
        evento.preventDefault();
        varredura.selecionar();
      }
    };

    window.addEventListener('pointerdown', aoTocar);
    window.addEventListener('keydown', aoTeclar);

    return () => {
      varredura.parar();
      motor.current = null;
      window.removeEventListener('pointerdown', aoTocar);
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [ligada, intervaloMs, totalDeItens]);

  // Depois de selecionar, o motor para. Reinicia para a próxima escolha.
  useEffect(() => {
    if (!ligada || destacado !== null) return;
    motor.current?.iniciar();
  }, [ligada, destacado]);

  return ligada ? destacado : null;
}

/** Anel de destaque. Grosso e em amarelo — o mesmo do foco de teclado. */
export function estiloDeDestaque(destacado: boolean): React.CSSProperties {
  if (!destacado) return {};
  return {
    outline: '0.5rem solid var(--color-amarelo-sinal)',
    outlineOffset: '0.5rem',
    borderRadius: '1rem',
  };
}
