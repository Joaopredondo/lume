# Licenças de terceiros

## Fontes

Todas as fontes são servidas de `public/fonts`, localmente. **Nenhuma vem de CDN** — o app precisa funcionar 100% offline, e uma fonte remota quebraria justamente a camada que depende de legibilidade.

### Atkinson Hyperlegible Next

- **Uso**: Camada Estímulo, pesos Bold (700) e ExtraBold (800).
- **Autor**: Braille Institute of America, Inc.
- **Versão**: Next (2025) — sete pesos e suporte a mais de 150 idiomas. A versão original de 2019 tinha só Regular e Bold, e acentuação de português menos cuidada.
- **Origem**: <https://github.com/googlefonts/atkinson-hyperlegible-next>
- **Licença**: SIL Open Font License 1.1 — texto completo em [`OFL-AtkinsonHyperlegibleNext.txt`](./OFL-AtkinsonHyperlegibleNext.txt)

Desenhada especificamente para baixa visão, com foco em distinção entre letterforms. É requisito clínico do projeto, não preferência estética: não substituir por fonte "mais bonita".

### Space Grotesk

- **Uso**: Camada Cuidador, variável 300–700.
- **Autor**: Florian Karsten
- **Origem**: <https://github.com/google/fonts/tree/main/ofl/spacegrotesk>
- **Licença**: SIL Open Font License 1.1 — texto completo em [`OFL-SpaceGrotesk.txt`](./OFL-SpaceGrotesk.txt)

O `.woff2` foi extraído do pacote `@fontsource-variable/space-grotesk` (o repositório `google/fonts` publica só `.ttf`) e copiado para `public/fonts`. O pacote não é dependência do projeto.

## Dependências

Todas MIT ou Apache-2.0, exceto onde indicado. Ver `package.json` e `npm ls`.

## Nota de auditoria

`npm audit` reporta vulnerabilidades em `ejs`, alcançado por `workbox-build` ← `vite-plugin-pwa`. É dependência **de build**: não vai para o bundle e não roda no navegador do usuário. `npm audit fix --force` faria downgrade do `vite-plugin-pwa` e quebraria o PWA. Revisar quando o upstream atualizar.
