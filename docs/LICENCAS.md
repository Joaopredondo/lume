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

## Silhuetas

Os desenhos de `src/design/silhuetas.tsx` não são feitos à mão: cada `path` vem de um conjunto de ícones livre, copiado para dentro do código (nada é carregado da rede, o app segue 100% offline). Os `paths` foram só normalizados (escala e posição no `viewBox` 100×100). Emojis coloridos foram posterizados: o claro virou massa de cor, o escuro virou recorte preto. O comentário acima de cada entrada em `DESENHOS` diz de onde veio.

| Conjunto                                                           | Autor                                   | Licença                                                   | Desenhos                                                                                                                                                                                         |
| ------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Font Awesome Free 6 Solid](https://fontawesome.com)               | Fonticons, Inc. (Dave Gandy)            | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | peixe, passarinho, gato, hipopótamo, vaca, sapo, kiwi, mão, nuvem, ovo, queijo, xícara, wafer, iogurte, casa, coração, estrela, lua, ampulheta, fone, nota, livro, maçã, lápis, copo, gota, bola |
| [game-icons.net](https://game-icons.net)                           | Lorc, Delapouite e outros colaboradores | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | polvo, elefante, dado, ilha, janela, rato, tartaruga, uva                                                                                                                                        |
| [Emoji One Monotone](https://github.com/joypixels/emojione-assets) | Emoji One                               | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | borboleta                                                                                                                                                                                        |
| [Twemoji](https://github.com/jdecked/twemoji)                      | Twitter, Inc. e colaboradores           | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | foca, zebra                                                                                                                                                                                      |
| [Firefox OS Emoji (FxEmoji)](https://github.com/mozilla/fxemoji)   | Mozilla                                 | Apache 2.0                                                | abelha                                                                                                                                                                                           |
| [Pico-icon](https://github.com/yne/picon)                          | Colaboradores do Picon                  | SIL OFL 1.1                                               | baleia                                                                                                                                                                                           |

As licenças CC BY exigem atribuição; esta tabela é a atribuição. Os ícones foram modificados (escala, posição e, nos emojis, posterização).

## Dependências

Todas MIT ou Apache-2.0, exceto onde indicado. Ver `package.json` e `npm ls`.

## Nota de auditoria

`npm audit` reporta vulnerabilidades em `ejs`, alcançado por `workbox-build` ← `vite-plugin-pwa`. É dependência **de build**: não vai para o bundle e não roda no navegador do usuário. `npm audit fix --force` faria downgrade do `vite-plugin-pwa` e quebraria o PWA. Revisar quando o upstream atualizar.
