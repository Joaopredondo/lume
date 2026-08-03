import { describe, expect, it } from 'vitest';
import { DESENHOS_PARA_TESTE } from './silhuetas';

/**
 * Toda silhueta precisa **pintar área**.
 *
 * Existe porque a `lua` passou meses no repositório sem desenhar nada: os dois
 * arcos tinham sweep no mesmo sentido e se anulavam pela regra `nonzero`. A
 * geometria estava lá, o `getBBox` devolvia 44×88, e a tela ficava vazia.
 *
 * A figura silenciosamente ausente era a do cantinho calmo — o recurso mais
 * usado em crise sensorial. Um `path` que não pinta é pior que um que falta:
 * ninguém procura o que parece existir.
 */

describe('silhuetas', () => {
  const entradas = Object.entries(DESENHOS_PARA_TESTE);

  it('existe pelo menos uma para varrer', () => {
    expect(entradas.length).toBeGreaterThan(0);
  });

  it('nenhuma tem corpo vazio', () => {
    for (const [id, desenho] of entradas) {
      expect(desenho.corpo.trim().length, id).toBeGreaterThan(10);
    }
  });

  it('todo corpo começa em M e fecha em Z', () => {
    // Contorno aberto não preenche de forma previsível entre navegadores.
    for (const [id, desenho] of entradas) {
      expect(desenho.corpo.trim().startsWith('M'), `${id}: começa em M`).toBe(true);
      expect(desenho.corpo.trim().toUpperCase().endsWith('Z'), `${id}: fecha em Z`).toBe(true);
    }
  });

  it('a lua tem arco interno mais raso que o externo', () => {
    // Raio interno menor que a metade da corda faz o SVG escalar o raio e
    // fechar um disco. Maior que o externo é o que deixa sobrar a foice.
    const arcos = [...DESENHOS_PARA_TESTE.lua.corpo.matchAll(/(\d+) \1 0 [01] [01]/g)];
    expect(arcos.length).toBe(2);
    expect(Number(arcos[1]?.[1])).toBeGreaterThan(Number(arcos[0]?.[1]));
  });

  it('nenhum arco tem raio menor que a metade da corda que atravessa', () => {
    /*
     * Foi assim que a lua quebrou duas vezes. Raio insuficiente faz o SVG
     * escalá-lo até caber, e o arco vira uma semicircunferência — que ou anula
     * o contorno (nada pinta) ou fecha um disco.
     *
     * Só cobre arcos verticais com deslocamento em y, que é a forma que os
     * desenhos deste arquivo usam. A prova de que a figura realmente pinta é
     * feita em navegador, em `e2e/silhuetas.spec.ts`.
     */
    for (const [id, desenho] of entradas) {
      for (const arco of desenho.corpo.matchAll(/([\d.]+) ([\d.]+) 0 [01] [01] 0(-?[\d.]+)/g)) {
        const raio = Number(arco[1]);
        const corda = Math.abs(Number(arco[3]));
        expect(raio * 2, `${id}: raio ${raio} para corda ${corda}`).toBeGreaterThanOrEqual(corda);
      }
    }
  });
});
