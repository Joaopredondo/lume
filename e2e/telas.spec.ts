import { test, type Page } from '@playwright/test';

/**
 * A lista é declarada aqui em vez de importada de `src/modulos/registro`: o
 * registro usa `import.meta.glob`, que é do Vite e não existe no Node em que o
 * Playwright roda. Se um módulo novo entrar e não aparecer aqui, ele
 * simplesmente não é fotografado — não quebra nada.
 */
const MODULOS = [
  { id: 'agora-e-depois', nome: 'Agora e depois' },
  { id: 'alfabeto', nome: 'Alfabeto' },
  { id: 'animais', nome: 'Animais' },
  { id: 'causa-e-efeito', nome: 'Causa e efeito' },
  { id: 'circulos-e-setas', nome: 'Círculos e setas' },
  { id: 'cores-e-formas', nome: 'Cores e formas' },
  { id: 'estimulacao-visual', nome: 'Estimulação visual' },
  { id: 'numeros', nome: 'Números' },
  { id: 'tracado', nome: 'Traçado' },
];

/**
 * Captura cada tela do app, em cada tamanho de aparelho.
 *
 * Não afirma nada — a inspeção é humana. O objetivo é que exista, pela primeira
 * vez, uma imagem de cada tela: o app foi construído quase inteiro sem ninguém
 * ver um pixel, e os testes em jsdom nunca desenham nada.
 *
 * Saída em `e2e/telas/<aparelho>/`.
 */

async function preparar(page: Page) {
  await page.goto('/');
  // Sem esperar a fonte, o primeiro screenshot sai com o fallback do sistema.
  // O IndexedDB já vem vazio: o Playwright isola storage por contexto.
  await page.evaluate(() => document.fonts.ready);
}

test.describe('telas', () => {
  test('camada do cuidador', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await preparar(page);

    await page.screenshot({ path: `${pasta}/01-inicio.png`, fullPage: true });

    await page.getByRole('button', { name: 'Calibrar' }).click();
    await page.screenshot({ path: `${pasta}/02-calibracao-cartao.png`, fullPage: true });

    await page.getByRole('button', { name: 'Confirmar' }).click();
    await page.screenshot({ path: `${pasta}/03-calibracao-distancia.png`, fullPage: true });

    await page.getByRole('button', { name: 'Confirmar' }).click();
    await page.screenshot({ path: `${pasta}/04-calibracao-limiar.png`, fullPage: true });

    await page.getByRole('button', { name: /Houve resposta aqui/ }).click();
    await page.screenshot({ path: `${pasta}/05-calibracao-cores.png`, fullPage: true });

    await page.getByRole('button', { name: 'Voltar' }).click();
    await page.getByRole('button', { name: 'Conteúdo próprio' }).click();
    await page.screenshot({ path: `${pasta}/06-conteudo-proprio.png`, fullPage: true });

    await page.getByRole('button', { name: 'Voltar' }).click();
    await page.getByRole('button', { name: 'Histórico' }).click();
    await page.screenshot({ path: `${pasta}/07-historico-vazio.png`, fullPage: true });

    await page.getByRole('button', { name: 'Voltar' }).click();
    // A configuração fica atrás do botão de segurar; no teclado abre direto.
    await page.getByRole('button', { name: /Configuração/ }).press('Enter');
    await page.screenshot({ path: `${pasta}/08-configuracao.png`, fullPage: true });
  });

  test('novo perfil', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await preparar(page);

    await page.getByRole('button', { name: 'Novo perfil' }).click();
    await page.screenshot({ path: `${pasta}/09-novo-perfil.png` });
  });

  test('como funciona, aberto', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await preparar(page);

    await page.getByRole('button', { name: 'Como funciona' }).first().click();
    await page.screenshot({ path: `${pasta}/10-como-funciona.png`, fullPage: true });
  });

  for (const modulo of MODULOS) {
    test(`módulo ${modulo.nome}`, async ({ page }, info) => {
      const pasta = `e2e/telas/${info.project.name}/modulos`;
      await preparar(page);

      await page.getByRole('button', { name: new RegExp(modulo.nome) }).click();
      // Deixa a aparição inicial assentar antes de fotografar.
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${pasta}/${modulo.id}-inicial.png` });

      // Um toque, para ver o módulo em atividade.
      await page.mouse.click(
        (page.viewportSize()?.width ?? 800) / 2,
        (page.viewportSize()?.height ?? 600) / 2,
      );
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${pasta}/${modulo.id}-apos-toque.png` });
    });
  }

  test('painel do cuidador', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await preparar(page);

    await page.getByRole('button', { name: /Causa e efeito/ }).click();
    const gatilho = page.getByRole('button', { name: /Painel do cuidador/ });
    const caixa = await gatilho.boundingBox();
    if (!caixa) throw new Error('gatilho sem geometria');

    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1400);
    await page.mouse.up();

    await page.screenshot({ path: `${pasta}/11-painel-cuidador.png` });
  });

  test('ficha do culto', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await preparar(page);

    // Atrás do gesto de 3s; no teclado abre direto.
    await page.getByRole('button', { name: /Ficha do culto/ }).press('Enter');
    await page.screenshot({ path: `${pasta}/13-ficha.png`, fullPage: true });
  });

  test('superfície de controle', async ({ page }, info) => {
    const pasta = `e2e/telas/${info.project.name}`;
    await page.goto('/?papel=controle');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${pasta}/12-controle.png`, fullPage: true });
  });
});
