import { useEffect, useState } from 'react';
import { useStore } from '../dados/store';

/**
 * Redução de movimento (regra 4.6).
 *
 * Existe em JS, e não só em CSS, por um motivo concreto: em CSS só dá para
 * sobrescrever a *duração* de uma animação, e sobrescrever duração acelera
 * qualquer animação que fosse mais lenta que o valor imposto. Uma travessia de
 * 12s forçada a 1s vira uma forma cruzando a tela a cada segundo — exatamente
 * o oposto de "modo calmo".
 *
 * A decisão certa é não animar o movimento, e isso quem decide é o módulo.
 */
export function prefereMovimentoReduzido(): boolean {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verdadeiro quando o movimento deve ser suprimido — por preferência do
 * sistema **ou** pelo Modo calmo, que é independente dele.
 */
export function useMovimentoReduzido(): boolean {
  const modoCalmo = useStore((estado) => estado.configuracoes.modoCalmo);
  const [doSistema, setDoSistema] = useState(prefereMovimentoReduzido);

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const consulta = matchMedia('(prefers-reduced-motion: reduce)');
    const avisar = () => setDoSistema(consulta.matches);
    consulta.addEventListener('change', avisar);
    return () => consulta.removeEventListener('change', avisar);
  }, []);

  return modoCalmo || doSistema;
}
