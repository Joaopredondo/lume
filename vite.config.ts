import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/*.woff2'],
      workbox: {
        // Fontes entram no precache: o app tem que abrir offline, e sem as
        // fontes locais a Camada Estímulo perde a legibilidade que a justifica.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // O controle remoto entre aparelhos é a única parte que exige internet
        // (ver docs/ADR-controle-remoto.md). Precachear o pacote dele seria
        // baixar 115 KB que só servem online, em um app cujo ponto é abrir sem
        // rede. O `import()` dinâmico busca o chunk na hora, se houver rede.
        globIgnores: ['**/assets/remoto-*.js'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'Lume',
        short_name: 'Lume',
        description:
          'Estimulação visual e cognitiva para baixa visão, com calibração por perfil e registro de resposta.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#050505',
        theme_color: '#050505',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Nome estável para o chunk do controle remoto, para o `globIgnores`
        // acima poder excluí-lo do precache de forma confiável.
        chunkFileNames: (chunk) =>
          chunk.name === 'remoto' ? 'assets/remoto-[hash].js' : 'assets/[name]-[hash].js',
        manualChunks: (id) => (id.includes('peerjs') ? 'remoto' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    /*
     * Tetos explícitos. Os testes de componente montam a Camada Estímulo, que
     * abre BroadcastChannel, laços de rAF e conexões do Dexie; handle que
     * escapa da limpeza pendura o processo depois de os testes já terem
     * passado. Com teto, isso falha com mensagem em vez de travar em silêncio.
     */
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
  },
});
