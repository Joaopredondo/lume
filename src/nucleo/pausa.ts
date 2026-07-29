import { useEffect, useState } from 'react';
import { useStore } from '../dados/store';

/**
 * Lembrete de pausa (seção 8.2).
 *
 * **Aparece só na camada do cuidador.** Nunca interrompe a Camada Estímulo,
 * nunca aparece para a pessoa atendida: um aviso surgindo no meio do estímulo
 * seria uma mudança de tela não solicitada, e para quem está em sessão isso é
 * ruído, não ajuda.
 */
export function useLembreteDePausa(sessaoAberta: boolean): {
  vencido: boolean;
  adiar: () => void;
} {
  const intervaloMin = useStore((estado) => estado.configuracoes.intervaloPausaMin);
  const [desde, setDesde] = useState(() => Date.now());
  const [vencido, setVencido] = useState(false);

  useEffect(() => {
    if (!sessaoAberta) {
      setVencido(false);
      setDesde(Date.now());
      return;
    }

    const intervaloMs = intervaloMin * 60 * 1000;
    const restante = Math.max(0, desde + intervaloMs - Date.now());
    const timer = window.setTimeout(() => setVencido(true), restante);

    return () => window.clearTimeout(timer);
  }, [sessaoAberta, intervaloMin, desde]);

  return {
    vencido,
    adiar: () => {
      setVencido(false);
      setDesde(Date.now());
    },
  };
}
