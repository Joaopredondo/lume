import { useCallback, useRef, useState } from 'react';

/**
 * Arrastar e soltar por pointer events.
 *
 * **Não usa HTML5 drag-and-drop.** Aquela API não dispara em toque no iPad, que
 * é o aparelho provável — o recurso simplesmente não existiria para a criança.
 *
 * O alvo é resolvido por `getBoundingClientRect()` de refs registradas, não por
 * `querySelector`: o componente não precisa saber o DOM de ninguém, e o hit-test
 * continua correto depois de rolagem ou giro de tela.
 */

export type Alvo = {
  id: string;
  elemento: HTMLElement;
};

export type EstadoDoArraste = {
  /** Id do item sendo arrastado, ou `null` quando ninguém está arrastando. */
  arrastando: string | null;
  /** Posição do dedo, para desenhar o fantasma que o acompanha. */
  x: number;
  y: number;
  /** Alvo sob o dedo agora, para destacar antes de soltar. */
  sobre: string | null;
};

export type Arraste = EstadoDoArraste & {
  /** Registra um espaço que aceita soltura. Passe como `ref` do elemento. */
  registrarAlvo: (id: string) => (elemento: HTMLElement | null) => void;
  /** Começa a arrastar. Chame no `onPointerDown` do item. */
  comecar: (id: string, evento: { clientX: number; clientY: number }) => void;
};

type Opcoes = {
  /** Chamado quando o item é solto sobre um alvo válido. */
  aoSoltar: (item: string, alvo: string) => void;
};

export function useArraste({ aoSoltar }: Opcoes): Arraste {
  const [estado, setEstado] = useState<EstadoDoArraste>({
    arrastando: null,
    x: 0,
    y: 0,
    sobre: null,
  });

  const alvos = useRef(new Map<string, HTMLElement>());
  // O callback muda a cada render; sem ref, os listeners de janela ficariam
  // presos à primeira versão.
  const soltar = useRef(aoSoltar);
  soltar.current = aoSoltar;

  const registrarAlvo = useCallback(
    (id: string) => (elemento: HTMLElement | null) => {
      if (elemento) alvos.current.set(id, elemento);
      else alvos.current.delete(id);
    },
    [],
  );

  const alvoEm = useCallback((x: number, y: number): string | null => {
    for (const [id, elemento] of alvos.current) {
      const area = elemento.getBoundingClientRect();
      if (x >= area.left && x <= area.right && y >= area.top && y <= area.bottom) return id;
    }
    return null;
  }, []);

  const comecar = useCallback(
    (id: string, evento: { clientX: number; clientY: number }) => {
      setEstado({ arrastando: id, x: evento.clientX, y: evento.clientY, sobre: null });

      const mover = (e: PointerEvent) => {
        setEstado((atual) =>
          atual.arrastando
            ? { ...atual, x: e.clientX, y: e.clientY, sobre: alvoEm(e.clientX, e.clientY) }
            : atual,
        );
      };

      const largar = (e: PointerEvent) => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', largar);
        window.removeEventListener('pointercancel', largar);

        const alvo = alvoEm(e.clientX, e.clientY);
        // Soltar fora de um espaço é desistir, não erro: nada acontece.
        if (alvo) soltar.current(id, alvo);
        setEstado({ arrastando: null, x: 0, y: 0, sobre: null });
      };

      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', largar);
      window.addEventListener('pointercancel', largar);
    },
    [alvoEm],
  );

  return { ...estado, registrarAlvo, comecar };
}
