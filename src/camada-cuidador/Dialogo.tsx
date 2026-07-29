import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Diálogo modal.
 *
 * Usa `<dialog>` nativo em vez de uma div sobreposta: `showModal()` já entrega
 * foco preso, `Esc` para fechar, inerte no resto da página e camada superior
 * acima de qualquer `z-index`. Reimplementar isso à mão é onde a acessibilidade
 * costuma quebrar.
 *
 * O que era `prompt()` do navegador — caixa cinza do sistema, com botão azul e
 * laranja, sem nenhuma relação com o app — vira uma superfície nossa.
 */
type Props = {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  children: ReactNode;
};

export function Dialogo({ aberto, titulo, descricao, aoFechar, children }: Props) {
  const caixa = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = caixa.current;
    if (!elemento) return;

    // jsdom não implementa showModal; sem a checagem, todo teste que monta um
    // diálogo quebraria.
    if (aberto && !elemento.open) elemento.showModal?.();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={caixa}
      // `Esc` já é nativo; o `cancel` é o evento que ele dispara.
      onCancel={(evento) => {
        evento.preventDefault();
        aoFechar();
      }}
      onClick={(evento) => {
        // Clique no backdrop fecha. O alvo só é o próprio <dialog> quando o
        // clique caiu fora do conteúdo.
        if (evento.target === caixa.current) aoFechar();
      }}
      aria-labelledby="titulo-do-dialogo"
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl bg-superficie p-6 text-giz-branco ring-2 ring-amarelo-sinal backdrop:bg-tinta-preta/80 sm:p-8"
    >
      <h2 id="titulo-do-dialogo" className="text-2xl font-semibold tracking-tight">
        {titulo}
      </h2>
      {descricao && <p className="mt-2 max-w-prose text-sm text-texto-secundario">{descricao}</p>}
      <div className="mt-6">{children}</div>
    </dialog>
  );
}
