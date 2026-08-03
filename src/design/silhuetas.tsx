import type { TokenDeCor } from '../dados/tipos';

/**
 * Silhuetas em SVG inline.
 *
 * Linguagem dos cartões físicos: massa sólida de cor chapada sobre preto.
 *
 * **A regra de detalhe interno é a do material real, não a do prompt.** Os
 * cartões impressos têm olho, orelha e boca desenhados — sempre como *recorte
 * preto dentro da forma*, negativo. Isso não custa contraste, porque cada
 * detalhe é preto absoluto contra a cor saturada. O que está proibido é traço
 * fino de cor sobre cor e contorno de outline. Ver `docs/PALETA.md`.
 *
 * Todas usam `viewBox="0 0 100 100"` para poderem ser escaladas por
 * `escala.ts` sem nenhum número em pixels aqui dentro.
 */

export type IdDeSilhueta =
  | 'polvo'
  | 'peixe'
  | 'elefante'
  | 'foca'
  | 'baleia'
  | 'borboleta'
  | 'passarinho'
  | 'bola'
  | 'casa'
  | 'coracao'
  | 'estrela'
  | 'lua'
  // Figurinhas da rotina do culto (quadro Agora e depois).
  | 'nota'
  | 'livro'
  | 'maca'
  | 'copo'
  | 'gota'
  | 'ampulheta'
  | 'fone'
  | 'lapis';

type Desenho = { corpo: string; detalhes?: string[] };

const DESENHOS: Record<IdDeSilhueta, Desenho> = {
  polvo: {
    corpo:
      'M50 8c-19 0-33 14-33 32 0 9 3 15 3 20 0 6-6 8-10 14-2 3 1 6 4 4 6-4 9-9 12-9 4 0 5 5 5 11 0 4 5 4 5 0 0-7 2-12 6-12s6 5 6 12c0 4 5 4 5 0 0-7 2-12 6-12s5 5 5 12c0 4 5 4 5 0 0-6 1-11 5-11 3 0 6 5 12 9 3 2 6-1 4-4-4-6-10-8-10-14 0-5 3-11 3-20 0-18-14-32-33-32Z',
    detalhes: ['M38 40a5 6 0 1 0 0.1 0Z', 'M62 40a5 6 0 1 0 0.1 0Z', 'M45 56c4 3 6 3 10 0'],
  },
  peixe: {
    corpo:
      'M12 50c0-16 16-28 34-28 12 0 22 5 28 12l14-12c2-2 5 0 4 3l-5 25 5 25c1 3-2 5-4 3l-14-12c-6 7-16 12-28 12-18 0-34-12-34-28Z',
    detalhes: ['M34 42a5 5 0 1 0 0.1 0Z'],
  },
  elefante: {
    corpo:
      'M22 34c0-13 11-22 26-22 12 0 21 6 25 15 8 1 13 7 13 14 0 6-3 11-8 13v20c0 3-2 5-5 5s-5-2-5-5v-8H40v8c0 3-2 5-5 5s-5-2-5-5V64c-5-4-8-10-8-17v-3l-8 22c-1 4-7 2-6-2l9-30Z',
    detalhes: ['M42 34a5 5 0 1 0 0.1 0Z', 'M62 26c8 2 12 8 12 14'],
  },
  foca: {
    corpo:
      'M70 18c-8 0-14 6-14 14 0 4 1 7 3 10-14 3-31 12-40 24-3 4 0 9 5 9h58c8 0 14-5 14-12 0-6-4-11-10-13 5-3 8-8 8-14 0-10-7-18-16-18h-8Z',
    detalhes: ['M74 30a4 4 0 1 0 0.1 0Z'],
  },
  baleia: {
    corpo:
      'M8 56c0-16 18-28 40-28 20 0 34 9 38 22l12-14c2-3 6-1 6 3v30c0 4-4 6-6 3l-12-14c-4 13-18 22-38 22-22 0-40-8-40-24Z',
    detalhes: ['M26 48a5 5 0 1 0 0.1 0Z', 'M8 62c14 6 30 6 44 0'],
  },
  borboleta: {
    corpo:
      'M50 30c-4-12-14-20-25-20C14 10 6 19 6 31c0 14 14 22 26 24-12 3-24 10-24 22 0 9 7 15 16 15 12 0 21-11 26-22 5 11 14 22 26 22 9 0 16-6 16-15 0-12-12-19-24-22 12-2 26-10 26-24 0-12-8-21-19-21-11 0-21 8-25 20Z',
    detalhes: ['M50 30v46'],
  },
  passarinho: {
    corpo:
      'M32 26c-13 0-24 11-24 24 0 16 13 28 30 28h26c10 0 18-8 18-18 0-8-5-14-12-17l16-12c3-2 1-7-3-6l-24 6c-5-4-11-6-18-6h-9Z',
    detalhes: ['M34 40a5 5 0 1 0 0.1 0Z', 'M8 50 2 46c-2-1-2 3 0 4l6 4'],
  },
  bola: { corpo: 'M50 6a44 44 0 1 0 0.1 0Z', detalhes: ['M6 50h88', 'M50 6v88'] },
  casa: {
    corpo: 'M50 8 4 46h12v46h68V46h12L50 8Z',
    detalhes: ['M40 60h20v32H40z'],
  },
  coracao: {
    corpo:
      'M50 92C24 72 8 56 8 36 8 22 19 12 32 12c8 0 15 4 18 10 3-6 10-10 18-10 13 0 24 10 24 24 0 20-16 36-42 56Z',
  },
  estrela: {
    corpo: 'M50 4 62 38h36L69 59l11 35-30-22-30 22 11-35L2 38h36L50 4Z',
  },
  /*
   * Lua: dois arcos que sobram um do outro, formando a foice.
   *
   * O path original — `44 44 ... 1 0` seguido de `36 36 ... 0 1` — **não
   * pintava nada**. Os dois arcos varriam em sentidos opostos e se anulavam
   * pela regra `nonzero`: o `getBBox` devolvia 44×88 e a tela ficava vazia.
   *
   * Trocar só o sentido para `0` fez pintar, mas virou um disco: com raio 36
   * para uma corda de 88, o SVG escala o raio até caber e o arco interno vira
   * outra semicircunferência, fechando o círculo.
   *
   * O raio interno precisa ser **maior** que o externo para a curva ser mais
   * rasa e sobrar a foice. Medido rasterizando: r=90 dá 33 unidades de
   * espessura no viewBox de 100 — massa sólida, não traço fino, que é a regra
   * deste arquivo.
   *
   * Importa porque `lua` é a figurinha do cantinho calmo, o recurso mais usado
   * em crise sensorial: a figura que não aparecia era justamente a necessária.
   */
  lua: {
    corpo: 'M62 6a44 44 0 1 0 0 88 90 90 0 0 1 0-88Z',
  },

  nota: {
    corpo: 'M84 8v50a20 20 0 1 1-16-19.6V32L40 40v42a20 20 0 1 1-16-19.6V28L84 8Z',
  },
  livro: {
    corpo: 'M10 16h32c5 0 8 3 8 8v62c0-5-3-8-8-8H10V16Zm80 0H58c-5 0-8 3-8 8v62c0-5 3-8 8-8h32V16Z',
  },
  maca: {
    corpo:
      'M50 24c15 0 27 13 27 32S65 92 50 92 23 75 23 56s12-32 27-32Zm4-2c0-9 7-16 16-18-2 11-7 17-16 18Z',
  },
  copo: {
    corpo: 'M22 16h56l-7 70a10 10 0 0 1-10 9H39a10 10 0 0 1-10-9L22 16Z',
  },
  gota: {
    corpo: 'M50 6c19 26 31 40 31 54a31 31 0 1 1-62 0c0-14 12-28 31-54Z',
  },
  ampulheta: {
    corpo: 'M20 6h60v18L54 50l26 26v18H20V76l26-26L20 24V6Z',
  },
  fone: {
    corpo:
      'M50 8c-23 0-40 17-40 40v24a10 10 0 0 0 10 10h10a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8h-4v-1c0-13 11-24 24-24s24 11 24 24v1h-4a8 8 0 0 0-8 8v18a8 8 0 0 0 8 8h10a10 10 0 0 0 10-10V48c0-23-17-40-40-40Z',
  },
  lapis: {
    corpo: 'M70 6l24 24-48 48-28 8 8-28L70 6Z',
  },
};

/** Exposto para o teste que verifica que toda silhueta pinta área. */
export const DESENHOS_PARA_TESTE = DESENHOS;

type Props = {
  id: IdDeSilhueta;
  cor: TokenDeCor;
  tamanho: number;
};

export function Silhueta({ id, cor, tamanho }: Props) {
  const desenho = DESENHOS[id];

  return (
    <svg
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={id}
      style={{ display: 'block' }}
    >
      <path d={desenho.corpo} fill={`var(--color-${cor})`} />
      {/*
        Detalhe em preto absoluto sobre a massa de cor: é recorte, não traço
        sobreposto. `stroke-width` é proporcional ao viewBox, não a pixels,
        então acompanha a escala do estímulo.
      */}
      {desenho.detalhes?.map((d) => (
        <path
          key={d}
          d={d}
          fill="var(--color-tinta-preta)"
          stroke="var(--color-tinta-preta)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
