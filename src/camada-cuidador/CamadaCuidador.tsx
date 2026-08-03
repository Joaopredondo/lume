import type { ReactNode } from 'react';

type Props = {
  titulo: string;
  children: ReactNode;
};

/**
 * A interface do cuidador/terapeuta. Aqui pode ser moderna: hierarquia
 * tipográfica, espaçamento generoso, dado bem apresentado.
 *
 * Continua zoomável e rolável de propósito — quem usa é um adulto que pode
 * precisar ampliar, e bloquear zoom aqui seria falha de WCAG 1.4.4.
 *
 * Responsividade: a escala tipográfica e o respiro crescem por breakpoint, mas
 * a largura de leitura para no `max-w-4xl`. Numa TV o conteúdo fica centrado e
 * confortável em vez de esticar a linha até virar ilegível.
 */
export function CamadaCuidador({ titulo, children }: Props) {
  return (
    <div className="min-h-dvh bg-tinta-preta font-interface text-giz-branco">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <header data-imprimir="nao" className="mb-8 sm:mb-10 lg:mb-14">
          <p className="text-xs tracking-[0.2em] text-texto-secundario uppercase sm:text-sm">
            Lume
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {titulo}
          </h1>
        </header>
        {children}
      </div>
    </div>
  );
}
