/**
 * Dimensões da tela, reativas.
 *
 * O app roda em celular, tablet, notebook e TV, e a mesma sessão pode girar o
 * tablet no meio. `escala.ts` precisa da menor dimensão para limitar o estímulo
 * e para o fallback sem calibração — se esse número for lido uma vez e
 * guardado, o estímulo fica com o tamanho da orientação anterior.
 */

export type Dimensoes = {
  largura: number;
  altura: number;
  menorDimensao: number;
  /** Sem ponteiro fino: TV, ou tablet sem mouse. Muda como a lanterna é operada. */
  temPonteiroFino: boolean;
};

export function medirTela(): Dimensoes {
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  return {
    largura,
    altura,
    menorDimensao: Math.min(largura, altura),
    temPonteiroFino:
      typeof matchMedia === 'function' ? matchMedia('(pointer: fine)').matches : false,
  };
}

/**
 * Avisa a cada mudança de tamanho ou orientação.
 *
 * `orientationchange` existe porque em parte dos aparelhos o `resize` chega
 * antes de o layout assentar, devolvendo a dimensão antiga.
 */
export function aoRedimensionar(ouvinte: (dimensoes: Dimensoes) => void): () => void {
  const avisar = () => ouvinte(medirTela());

  window.addEventListener('resize', avisar);
  window.addEventListener('orientationchange', avisar);

  return () => {
    window.removeEventListener('resize', avisar);
    window.removeEventListener('orientationchange', avisar);
  };
}
