/**
 * Modo varredura (seção 6).
 *
 * Para quem não consegue apontar: um destaque grosso percorre as opções
 * sozinho e qualquer toque — em qualquer lugar, ou no acionador — seleciona a
 * que estiver destacada. É o que torna o app operável sem controle motor fino.
 */

/** Limites configuráveis da seção 6. Abaixo de 2s não dá tempo de reagir. */
export const INTERVALO_MINIMO_MS = 2000;
export const INTERVALO_MAXIMO_MS = 8000;

export type OpcoesDeVarredura = {
  totalDeItens: number;
  intervaloMs: number;
  aoDestacar: (indice: number) => void;
  aoSelecionar: (indice: number) => void;
};

export type Varredura = {
  iniciar: () => void;
  parar: () => void;
  selecionar: () => void;
  indiceAtual: () => number;
};

export function limitarIntervalo(ms: number): number {
  return Math.min(INTERVALO_MAXIMO_MS, Math.max(INTERVALO_MINIMO_MS, ms));
}

export function criarVarredura(opcoes: OpcoesDeVarredura): Varredura {
  const { totalDeItens, aoDestacar, aoSelecionar } = opcoes;
  const intervalo = limitarIntervalo(opcoes.intervaloMs);

  let indice = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const parar = () => {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
  };

  const iniciar = () => {
    if (totalDeItens <= 0 || timer !== null) return;
    indice = 0;
    aoDestacar(indice);
    timer = setInterval(() => {
      indice = (indice + 1) % totalDeItens;
      aoDestacar(indice);
    }, intervalo);
  };

  const selecionar = () => {
    if (totalDeItens <= 0) return;
    // Para antes de avisar: o callback normalmente troca de tela, e a varredura
    // não pode continuar rodando por baixo do que veio depois.
    parar();
    aoSelecionar(indice);
  };

  return { iniciar, parar, selecionar, indiceAtual: () => indice };
}
