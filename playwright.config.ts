import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright roda em Chromium de verdade.
 *
 * É o que os testes em jsdom nunca alcançaram: layout, fontes carregadas, SVG
 * desenhado, service worker de fato instalado. O app foi construído quase
 * inteiro sem ninguém ver um pixel — é aqui que isso se corrige.
 *
 * Roda contra o build, não contra o dev server: offline e PWA só existem depois
 * do `vite build`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    // Sem isto, `page.click` em elemento fora da viewport rola a página e o
    // screenshot sai de um estado que ninguém veria.
    screenshot: 'off',
  },

  /*
   * Tudo em Chromium. Os descritores de iPad da Playwright pedem WebKit, e
   * instalar mais um navegador só para simular largura não paga — o que muda o
   * layout aqui é viewport e toque, não motor de renderização.
   */
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 1080, height: 810 },
        hasTouch: true,
        isMobile: false,
      },
    },
    { name: 'tv', use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } } },
  ],

  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
