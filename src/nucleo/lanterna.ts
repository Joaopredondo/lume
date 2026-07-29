/**
 * Lanterna digital — o elemento-assinatura do produto (seção 3).
 *
 * O trabalho real acontece no escuro, com uma lanterna física apontada para o
 * material. Isto digitaliza esse gesto: a tela inteira escurece exceto um
 * círculo de luz que segue o dedo, revelando a figura por partes. Serve para
 * treino de rastreamento visual.
 *
 * **Exceção autorizada à regra 4.1** (única do app, e está na allowlist do
 * teste de segurança): há um loop contínuo de rAF aqui. É seguro porque a
 * luminância só muda onde o dedo está, sob comando da própria pessoa — não é
 * uma pulsação imposta à tela inteira. Ainda assim o loop se desliga sozinho
 * após 2s sem ponteiro, para não ficar girando à toa.
 */

/** Suavização por quadro. Baixo o bastante para nunca dar salto de luz. */
const SUAVIZACAO = 0.15;

/** Sem ponteiro por este tempo, o loop dorme. */
const OCIOSO_MS = 2000;

/** Passo do controle por seta, em fração da tela — TV não tem ponteiro. */
const PASSO_TECLADO = 0.04;

export type OpcoesDaLanterna = {
  raio: number;
  /** 0 = borda dura, 1 = degradê longo. */
  suavidadeDaBorda?: number;
};

export type Lanterna = {
  parar: () => void;
  moverPara: (x: number, y: number) => void;
};

function interpolar(de: number, para: number, fator: number): number {
  return de + (para - de) * fator;
}

/**
 * Monta a máscara no elemento. O alvo revela seu conteúdo só dentro do círculo.
 */
export function criarLanterna(alvo: HTMLElement, opcoes: OpcoesDaLanterna): Lanterna {
  const { raio, suavidadeDaBorda = 0.5 } = opcoes;

  // Começa no centro para nunca haver um primeiro quadro com a luz no canto.
  let destinoX = alvo.clientWidth / 2;
  let destinoY = alvo.clientHeight / 2;
  let atualX = destinoX;
  let atualY = destinoY;

  let quadro: number | null = null;
  let ultimoMovimento = Date.now();
  let vivo = true;

  const inicioDoDegrade = Math.max(0, 1 - suavidadeDaBorda) * 100;

  const desenhar = () => {
    const mascara =
      `radial-gradient(circle ${raio}px at ${atualX}px ${atualY}px, ` +
      `#000 ${inicioDoDegrade}%, transparent 100%)`;
    alvo.style.maskImage = mascara;
    alvo.style.webkitMaskImage = mascara;
  };

  const passo = () => {
    if (!vivo) return;

    atualX = interpolar(atualX, destinoX, SUAVIZACAO);
    atualY = interpolar(atualY, destinoY, SUAVIZACAO);
    desenhar();

    const parado = Math.hypot(destinoX - atualX, destinoY - atualY) < 0.5;
    const ocioso = Date.now() - ultimoMovimento > OCIOSO_MS;

    // Dorme só quando a luz já alcançou o destino: parar antes deixaria a
    // máscara a meio caminho, com um salto visível na próxima retomada.
    if (parado && ocioso) {
      quadro = null;
      return;
    }

    quadro = requestAnimationFrame(passo);
  };

  const acordar = () => {
    ultimoMovimento = Date.now();
    if (quadro === null && vivo) quadro = requestAnimationFrame(passo);
  };

  const moverPara = (x: number, y: number) => {
    destinoX = x;
    destinoY = y;
    acordar();
  };

  const aoApontar = (evento: Event) => {
    const ponteiro = evento as PointerEvent;
    const area = alvo.getBoundingClientRect();
    moverPara(ponteiro.clientX - area.left, ponteiro.clientY - area.top);
  };

  // Sem ponteiro (TV, controle por teclado) a lanterna anda pelas setas, com a
  // mesma suavização — o movimento não pode ser em degraus.
  const aoTeclar = (evento: Event) => {
    const tecla = (evento as KeyboardEvent).key;
    const passoX = alvo.clientWidth * PASSO_TECLADO;
    const passoY = alvo.clientHeight * PASSO_TECLADO;

    if (tecla === 'ArrowLeft') moverPara(destinoX - passoX, destinoY);
    else if (tecla === 'ArrowRight') moverPara(destinoX + passoX, destinoY);
    else if (tecla === 'ArrowUp') moverPara(destinoX, destinoY - passoY);
    else if (tecla === 'ArrowDown') moverPara(destinoX, destinoY + passoY);
    else return;

    evento.preventDefault();
  };

  alvo.addEventListener('pointermove', aoApontar);
  alvo.addEventListener('pointerdown', aoApontar);
  window.addEventListener('keydown', aoTeclar);

  desenhar();
  acordar();

  return {
    moverPara,
    parar: () => {
      vivo = false;
      if (quadro !== null) cancelAnimationFrame(quadro);
      quadro = null;
      alvo.removeEventListener('pointermove', aoApontar);
      alvo.removeEventListener('pointerdown', aoApontar);
      window.removeEventListener('keydown', aoTeclar);
      alvo.style.maskImage = '';
      alvo.style.webkitMaskImage = '';
    },
  };
}
