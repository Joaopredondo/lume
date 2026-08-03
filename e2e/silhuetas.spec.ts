import { expect, test } from '@playwright/test';
import { DESENHOS_PARA_TESTE } from '../src/design/silhuetas';

/**
 * Toda silhueta precisa **pintar massa** de verdade.
 *
 * Verificação em navegador porque nenhuma heurística sobre a string do `path`
 * resolve: a `lua` quebrou duas vezes seguidas por motivos diferentes — uma vez
 * com os arcos se anulando (nada pintava) e outra com raio insuficiente, que o
 * SVG escala até fechar um disco. Nos dois casos o `getBBox` parecia saudável.
 *
 * Aqui o path é rasterizado e os pixels são contados. É a única prova honesta.
 */

/** Abaixo disto a figura é traço, não massa — e traço fino é proibido. */
const AREA_MINIMA = 0.08;

test.describe('silhuetas pintam massa', () => {
  test('nenhuma sai vazia ou fina demais', async ({ page }) => {
    await page.setContent('<canvas id="c" width="100" height="100"></canvas>');

    const medidas = await page.evaluate(
      (desenhos) => {
        const canvas = document.getElementById('c') as HTMLCanvasElement;
        const contexto = canvas.getContext('2d');
        if (!contexto) throw new Error('sem canvas');

        return Object.entries(desenhos).map(([id, corpo]) => {
          contexto.clearRect(0, 0, 100, 100);
          contexto.fillStyle = '#fff';
          contexto.fill(new Path2D(corpo as string));

          const pixels = contexto.getImageData(0, 0, 100, 100).data;
          let preenchidos = 0;
          for (let i = 3; i < pixels.length; i += 4) {
            if ((pixels[i] ?? 0) > 128) preenchidos += 1;
          }
          return { id, fracao: preenchidos / (100 * 100) };
        });
      },
      Object.fromEntries(Object.entries(DESENHOS_PARA_TESTE).map(([k, v]) => [k, v.corpo])),
    );

    for (const { id, fracao } of medidas) {
      expect(fracao, `${id} ocupa ${(fracao * 100).toFixed(1)}% do quadro`).toBeGreaterThan(
        AREA_MINIMA,
      );
    }
  });

  test('a lua é uma foice, não um disco', async ({ page }) => {
    // As duas regressões anteriores passariam em qualquer teste de "existe":
    // uma pintava 0%, a outra 59% — quase o disco cheio.
    await page.setContent('<canvas id="c" width="100" height="100"></canvas>');

    const fracao = await page.evaluate((corpo) => {
      const canvas = document.getElementById('c') as HTMLCanvasElement;
      const contexto = canvas.getContext('2d');
      if (!contexto) throw new Error('sem canvas');
      contexto.fillStyle = '#fff';
      contexto.fill(new Path2D(corpo));

      const pixels = contexto.getImageData(0, 0, 100, 100).data;
      let preenchidos = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if ((pixels[i] ?? 0) > 128) preenchidos += 1;
      }
      return preenchidos / (100 * 100);
    }, DESENHOS_PARA_TESTE.lua.corpo);

    expect(fracao).toBeGreaterThan(0.15);
    // Um disco de raio 44 ocupa ~61% do quadro. A foice fica bem abaixo.
    expect(fracao).toBeLessThan(0.45);
  });
});
