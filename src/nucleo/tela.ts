/**
 * Controle de tela para a Camada Estímulo.
 *
 * O app roda em tela cheia, no escuro, com alguém de motricidade imprecisa
 * encostando na tela. Tudo aqui existe para que nada aconteça por acidente —
 * e para que a tela não apague no meio de uma sessão.
 */

/**
 * Mantém a tela acesa enquanto a sessão está aberta.
 *
 * O bloqueio cai sozinho quando a aba perde o foco, então é refeito no
 * `visibilitychange`. Devolve a função de liberação.
 */
export function manterTelaAcesa(): () => void {
  if (!('wakeLock' in navigator)) return () => {};

  let bloqueio: WakeLockSentinel | null = null;
  let cancelado = false;

  const pedir = async () => {
    if (cancelado || document.visibilityState !== 'visible') return;
    try {
      const novo = await navigator.wakeLock.request('screen');
      if (cancelado) {
        void novo.release();
        return;
      }
      bloqueio = novo;
    } catch {
      // Bateria fraca ou permissão negada: segue sem manter a tela acesa.
      // Não é motivo para interromper a sessão.
    }
  };

  void pedir();
  document.addEventListener('visibilitychange', pedir);

  return () => {
    cancelado = true;
    document.removeEventListener('visibilitychange', pedir);
    void bloqueio?.release();
    bloqueio = null;
  };
}

/** Entra em tela cheia. Falha silenciosa: fullscreen exige gesto do usuário. */
export async function entrarEmTelaCheia(elemento: Element): Promise<void> {
  if (document.fullscreenElement) return;
  try {
    await elemento.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    // Recusado pelo navegador ou já em transição. O módulo funciona sem.
  }
}

export async function sairDeTelaCheia(): Promise<void> {
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Idem: sair de tela cheia nunca pode derrubar a sessão.
  }
}

/**
 * Eventos de gesto do Safari. São não-padrão e não estão no lib.dom, mas são
 * a única forma de bloquear pinch-zoom no iOS — ver `bloquearGestos`.
 */
type EventoDeGesto = Event;
const GESTOS = ['gesturestart', 'gesturechange', 'gestureend'] as const;

/**
 * Bloqueia zoom e scroll acidental **dentro do container do estímulo**.
 *
 * Deliberadamente não mexe no viewport: `user-scalable=no` e `maximum-scale`
 * reprovam na regra `meta-viewport` do axe e são falha de WCAG 1.4.4, o que
 * derrubaria a meta de acessibilidade da seção 8. A Camada Cuidador continua
 * totalmente zoomável — é a interface de um adulto que pode precisar ampliar.
 *
 * Os listeners `gesture*` existem porque `touch-action: none` sozinho NÃO
 * bloqueia pinch-zoom no Safari do iOS, e o iPad é o aparelho provável.
 * Não remova achando que é redundante com o CSS.
 */
export function bloquearGestos(container: HTMLElement): () => void {
  const impedir = (evento: EventoDeGesto) => evento.preventDefault();

  for (const gesto of GESTOS) {
    container.addEventListener(gesto, impedir);
  }

  // Toque longo não pode abrir o menu de "copiar" por cima do estímulo.
  container.addEventListener('contextmenu', impedir);

  return () => {
    for (const gesto of GESTOS) {
      container.removeEventListener(gesto, impedir);
    }
    container.removeEventListener('contextmenu', impedir);
  };
}

type OrientacaoTravavel = ScreenOrientation & {
  lock?: (orientacao: 'landscape' | 'portrait' | 'any') => Promise<void>;
};

/**
 * Trava a orientação quando o navegador permite. O layout funciona nas duas de
 * qualquer forma — isto só evita o giro acidental com o tablet na mão.
 */
export async function travarOrientacao(orientacao: 'landscape' | 'portrait'): Promise<void> {
  const alvo: OrientacaoTravavel | undefined = screen.orientation;
  try {
    await alvo?.lock?.(orientacao);
  } catch {
    // Desktop e boa parte do iOS não implementam. Segue sem travar.
  }
}
