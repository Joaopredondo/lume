import { expect, test, type Page } from '@playwright/test';

/**
 * Fluxo principal em navegador de verdade.
 *
 * O que jsdom nunca cobriu: o service worker instala, as fontes carregam, o
 * SVG desenha, e o app abre com a rede desligada.
 */

/**
 * O Playwright cria um contexto novo por teste, e o IndexedDB é isolado por
 * contexto — cada teste já começa com o banco vazio.
 *
 * Apagar o banco à mão aqui era pior que inútil: `deleteDatabase` fica
 * *bloqueado* enquanto o Dexie mantém conexão aberta, o `reload` fecha a
 * conexão, e aí o delete pendente executa e apaga o banco que a página nova
 * acabou de criar — junto com o que foi gravado depois. Os testes alternavam
 * entre passar e falhar por causa disso.
 */
async function abrir(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('sessão completa', () => {
  test('abre um módulo, marca resposta e encerra', async ({ page }) => {
    await abrir(page);

    await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();

    // Entrar num módulo abre a sessão.
    await page.getByRole('button', { name: /Causa e efeito/ }).click();

    // A Camada Estímulo não tem nada da interface do cuidador.
    await expect(page.getByRole('heading')).toHaveCount(0);
    const gatilho = page.getByRole('button', { name: /Painel do cuidador/ });
    await expect(gatilho).toBeVisible();

    // Toque em qualquer lugar faz surgir a forma.
    await page.mouse.click(400, 300);

    // Marcar resposta pelo teclado, que é o caminho sempre disponível.
    await page.keyboard.press('s');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();

    // Encerrar a sessão produz o resumo.
    await page.getByRole('button', { name: 'Encerrar sessão' }).click();
    await expect(page.getByText(/Sessão encerrada/)).toBeVisible();

    // E a marcação chegou ao histórico.
    await page.getByRole('button', { name: 'Histórico' }).click();
    await expect(page.getByText('Resposta por cor')).toBeVisible();
  });

  test('o painel do cuidador exige segurar', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: /Causa e efeito/ }).click();

    const gatilho = page.getByRole('button', { name: /Painel do cuidador/ });

    // Toque de relance não abre nada.
    await gatilho.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Segurar abre.
    const caixa = await gatilho.boundingBox();
    if (!caixa) throw new Error('gatilho sem geometria');
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1400);
    await page.mouse.up();

    await expect(page.getByRole('button', { name: 'RESPONDEU', exact: true })).toBeVisible();
  });

  test('marcar pelo painel registra no histórico', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: /Causa e efeito/ }).click();
    await page.mouse.click(400, 300);

    const gatilho = page.getByRole('button', { name: /Painel do cuidador/ });
    const caixa = await gatilho.boundingBox();
    if (!caixa) throw new Error('gatilho sem geometria');
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1400);
    await page.mouse.up();

    // Marcar fecha o painel e devolve ao estímulo — por isso a saída aqui é
    // pelo teclado, não pelo botão do painel, que já não está mais na tela.
    await page.getByRole('button', { name: 'RESPONDEU', exact: true }).click();
    await page.keyboard.press('Escape');

    // Encerrar antes de olhar o histórico é o fluxo real, e também garante que
    // a gravação no Dexie já commitou: o Histórico busca uma vez, na montagem.
    await page.getByRole('button', { name: 'Encerrar sessão' }).click();
    await page.getByRole('button', { name: 'Histórico' }).click();
    // O cruzamento só aparece quando existe marcação gravada — é a prova de
    // que o caminho pelo painel chegou ao banco, e não só à tela.
    await expect(page.getByText('Resposta por cor')).toBeVisible();
  });
});

test.describe('regras clínicas em navegador real', () => {
  test('o viewport permanece zoomável (WCAG 1.4.4)', async ({ page }) => {
    await page.goto('/');
    const conteudo = await page.locator('meta[name="viewport"]').getAttribute('content');

    expect(conteudo).not.toContain('user-scalable=no');
    expect(conteudo).not.toContain('maximum-scale');
  });

  test('o fundo é preto e permanece preto', async ({ page }) => {
    await page.goto('/');
    const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(fundo).toBe('rgb(5, 5, 5)');
  });

  test('a fonte da Camada Estímulo carrega de verdade', async ({ page }) => {
    await abrir(page);
    // Sem a Atkinson, a camada abre mas perde a legibilidade que a justifica —
    // pior que não abrir, porque parece funcionar.
    const carregada = await page.evaluate(() =>
      document.fonts.check("800 48px 'Atkinson Hyperlegible Next'"),
    );
    expect(carregada).toBe(true);
  });
});

test.describe('offline', () => {
  test('abre com a rede desligada', async ({ page, context }) => {
    await page.goto('/');
    // O service worker precisa terminar de instalar antes de cortar a rede.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Início' })).toBeVisible();

    // E a fonte local também veio do cache, não da rede.
    const carregada = await page.evaluate(() =>
      document.fonts.check("800 48px 'Atkinson Hyperlegible Next'"),
    );
    expect(carregada).toBe(true);

    await context.setOffline(false);
  });
});
