import { useCallback, useEffect, useRef, useState } from 'react';

/** Seção 9: abrir a configuração exige segurar por 3 segundos. */
export const TEMPO_DE_ESPERA_MS = 3000;

type Props = {
  rotulo: string;
  aoCompletar: () => void;
};

/**
 * Botão que só age depois de mantido pressionado.
 *
 * Existe para a criança não entrar na configuração sem querer enquanto mexe no
 * tablet. O progresso é mostrado porque um botão que "não funciona" ao toque
 * simples é indistinguível de um botão quebrado.
 */
export function BotaoSegurar({ rotulo, aoCompletar }: Props) {
  const [progresso, setProgresso] = useState(0);
  const inicio = useRef<number | null>(null);
  const quadro = useRef<number | null>(null);

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
      const decorrido = Date.now() - inicio.current;
      const fracao = Math.min(1, decorrido / TEMPO_DE_ESPERA_MS);
      setProgresso(fracao);

      if (fracao >= 1) {
        soltar();
        aoCompletar();
        return;
      }
      quadro.current = requestAnimationFrame(passo);
    };

    quadro.current = requestAnimationFrame(passo);
  }, [aoCompletar, soltar]);

  useEffect(() => soltar, [soltar]);

  return (
    <button
      type="button"
      onPointerDown={segurar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      // Teclado e acionador não conseguem "segurar": para eles, Enter/Espaço
      // abre direto. A trava é contra toque acidental, não contra o cuidador.
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          aoCompletar();
        }
      }}
      className="relative min-h-14 overflow-hidden rounded-lg bg-superficie px-6 text-base font-medium text-giz-branco"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-amarelo-sinal/30"
        style={{ width: `${progresso * 100}%` }}
      />
      <span className="relative">
        {rotulo}
        {progresso > 0 && ' — segure'}
      </span>
    </button>
  );
}
