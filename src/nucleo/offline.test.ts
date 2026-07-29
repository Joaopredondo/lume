import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * O app promete funcionar 100% offline. A única exceção declarada é o controle
 * remoto entre aparelhos separados, que exige um servidor de sinalização
 * (ver `docs/ADR-controle-remoto.md`).
 *
 * Estes testes leem o build de verdade. Rodam só quando `dist/` existe — em
 * `npm run verificar` o build ainda não foi feito, e falhar por isso seria
 * ruído. `npm run build && npm run teste` executa a verificação completa.
 */

const DIST = join(import.meta.dirname, '..', '..', 'dist');
const temBuild = existsSync(join(DIST, 'sw.js'));

describe.skipIf(!temBuild)('precache do service worker', () => {
  const sw = temBuild ? readFileSync(join(DIST, 'sw.js'), 'utf8') : '';
  const precache = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1] ?? '');

  it('inclui as fontes locais', () => {
    // Sem elas, a Camada Estímulo abre offline mas perde a legibilidade que a
    // justifica — pior que não abrir, porque parece funcionar.
    const fontes = precache.filter((u) => u.endsWith('.woff2'));
    expect(fontes.length).toBeGreaterThanOrEqual(3);
    expect(fontes.some((u) => u.includes('Atkinson'))).toBe(true);
  });

  it('inclui HTML, CSS e o bundle principal', () => {
    expect(precache).toContain('index.html');
    expect(precache.some((u) => u.endsWith('.css'))).toBe(true);
    expect(precache.some((u) => /assets\/index-.*\.js$/.test(u))).toBe(true);
  });

  it('inclui o manifesto e os ícones do PWA', () => {
    expect(precache).toContain('manifest.webmanifest');
    expect(precache.filter((u) => u.startsWith('icons/')).length).toBeGreaterThanOrEqual(3);
  });

  it('NÃO inclui o pacote do controle remoto', () => {
    // Precachear 115 KB que só funcionam online, num app cujo ponto é abrir sem
    // rede, seria contradizer a própria promessa. O chunk é buscado sob demanda.
    expect(precache.filter((u) => u.includes('remoto-'))).toEqual([]);
  });
});

describe.skipIf(!temBuild)('separação do controle remoto', () => {
  const arquivos = temBuild ? readdirSync(join(DIST, 'assets')) : [];

  it('o peerjs fica num chunk próprio, fora do bundle principal', () => {
    const principal = arquivos.find((a) => /^index-.*\.js$/.test(a));
    if (!principal) throw new Error('bundle principal não encontrado');

    const codigo = readFileSync(join(DIST, 'assets', principal), 'utf8');
    // Assinaturas do PeerJS que apareceriam se ele tivesse entrado no bundle.
    expect(codigo).not.toContain('peerjs');
    expect(codigo).not.toContain('PeerConnection');
  });

  it('o chunk do remoto existe e é carregado sob demanda', () => {
    expect(arquivos.some((a) => /^remoto-.*\.js$/.test(a))).toBe(true);
  });
});
