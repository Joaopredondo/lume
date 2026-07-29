import { DEBOUNCE_MS } from './seguranca';

/**
 * Entrada com absorção de toque involuntário (seção 6).
 *
 * **Não é o debounce de sempre.** O debounce comum espera a janela fechar para
 * então agir — o que atrasaria o feedback em 400ms e destruiria o módulo Causa
 * e efeito: se a resposta não começa junto com o toque, a pessoa não liga uma
 * coisa à outra e o objetivo clínico se perde (regra 4.2).
 *
 * Aqui é o contrário: o **primeiro** toque dispara na hora, e os repetidos
 * dentro da janela são descartados. Dificuldade motora produz toque repetido
 * involuntário, e é isso que precisa ser filtrado — não o primeiro.
 */
export function comAbsorcaoDeRepeticao<A extends unknown[]>(
  acao: (...args: A) => void,
  janelaMs: number = DEBOUNCE_MS,
): ((...args: A) => void) & { reiniciar: () => void } {
  let ultimoDisparo = Number.NEGATIVE_INFINITY;

  const disparar = (...args: A) => {
    const agora = Date.now();
    if (agora - ultimoDisparo < janelaMs) return;
    ultimoDisparo = agora;
    acao(...args);
  };

  // Trocar de módulo não pode herdar a janela do módulo anterior.
  disparar.reiniciar = () => {
    ultimoDisparo = Number.NEGATIVE_INFINITY;
  };

  return disparar;
}

/**
 * "Tocar em qualquer lugar" da seção 6, em todas as formas de entrada que a
 * pessoa pode ter: dedo, mouse, teclado e acionador.
 *
 * Usa `pointerdown` em vez de `click` justamente pela latência — `click` só
 * dispara ao soltar, e soltar pode demorar bastante com dificuldade motora.
 */
export function ouvirAtivacao(
  alvo: HTMLElement,
  acao: () => void,
  janelaMs: number = DEBOUNCE_MS,
): () => void {
  const disparar = comAbsorcaoDeRepeticao(acao, janelaMs);

  const aoApontar = () => disparar();
  const aoTeclar = (evento: Event) => {
    const tecla = (evento as KeyboardEvent).key;
    if (tecla === ' ' || tecla === 'Enter') {
      evento.preventDefault();
      disparar();
    }
  };

  alvo.addEventListener('pointerdown', aoApontar);
  alvo.addEventListener('keydown', aoTeclar);

  return () => {
    alvo.removeEventListener('pointerdown', aoApontar);
    alvo.removeEventListener('keydown', aoTeclar);
  };
}
