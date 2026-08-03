# Lume

Web app de estimulação visual e cognitiva para baixa visão extrema, usado em ambiente escuro por um cuidador/terapeuta com a pessoa atendida. Funciona offline, sem backend e sem conta.

Não é um gerador de imagens: é um **instrumento de observação**. Apresenta estímulo calibrado e registra resposta.

> ⚠️ Não é dispositivo médico. Leia [`docs/AVISO.md`](./docs/AVISO.md) antes de usar.

## Comandos

```bash
npm run dev         # servidor de desenvolvimento
npm run build       # tsc -b && vite build
npm run verificar   # tsc + oxlint + prettier + vitest — roda tudo
npm run teste       # suíte unitária (jsdom)
npm run teste:e2e   # Playwright em Chromium de verdade
npm run teste:telas # gera screenshot de cada tela em 3 tamanhos
```

O `pre-commit` roda tipos, lint, formatação e a varredura das regras clínicas —
tudo rápido, nada que monte componente.

### Por que a suíte inteira não roda no pre-commit

Os testes de componente montam a Camada Estímulo, e ela abre `BroadcastChannel`,
laços de `requestAnimationFrame` e conexões do Dexie. Handles que escapam da
limpeza deixam o processo do Vitest pendurado depois que os testes já passaram —
o commit ficava bloqueado por um problema de teardown, não por defeito no código.

Então o pre-commit ficou com o que é barato e cobre o que importa: `tsc`,
`oxlint`, Prettier e `src/nucleo/seguranca.test.ts`, a varredura que garante as
regras clínicas. Ela lê arquivo, não renderiza nada, e roda em ~1s.

A suíte completa continua disponível em `npm run teste`, para rodar de propósito
quando fizer sentido. O vazamento de handles nos testes de componente é dívida
conhecida, não está resolvido.

### Testes de ponta a ponta

`npm run teste:e2e` roda em Chromium de verdade, contra o build, em três
tamanhos (celular, tablet, TV). É onde se verifica o que jsdom nunca alcança:
o service worker instalando, as fontes carregando, o SVG desenhado, e o app
abrindo **com a rede desligada**.

`npm run teste:telas` fotografa cada tela do app em cada tamanho e grava em
`e2e/telas/`. Não afirma nada — a inspeção é humana. Existe porque o app foi
construído quase inteiro sem ninguém ver um pixel.

**Ainda não rodado:** os screenshots nunca foram gerados e o Lighthouse nunca
foi executado. A largura de celular segue sem verificação visual.

## Decisões de arquitetura

### Duas camadas, não um tema

`camada-cuidador/` e `camada-estimulo/` não são variações visuais do mesmo app — são interfaces para dois usuários com necessidades opostas. A do cuidador é moderna e densa. A do estímulo é cartaz serigrafado: forma sólida, cor chapada, preto absoluto, zero detalhe fino. Entrar num módulo é tela cheia sem chrome nenhum.

Consequência prática: o bloqueio de gesto, o wake lock e o fullscreen vivem só na Camada Estímulo. A do cuidador continua zoomável e rolável, porque quem a usa é um adulto que pode precisar ampliar.

### Segurança clínica como código, não como convenção

A usuária principal tem histórico de crises convulsivas. As regras (nada pisca, transição ≥800ms, fundo sempre preto) não podem depender de alguém lembrar delas numa revisão.

Então: todas as durações saem do enum `DURACAO` em `nucleo/seguranca.ts`, e `nucleo/seguranca.test.ts` varre o código-fonte procurando violação — literal de duração, `infinite` fora da lanterna, `transition` curto, tamanho fixo na Camada Estímulo. São 7 verificações estáticas, validadas injetando violações deliberadas e conferindo que cada uma falha.

Ver [`docs/SEGURANCA.md`](./docs/SEGURANCA.md).

### Latência e duração são coisas separadas

O erro fácil aqui é ler "toda transição dura no mínimo 800ms" e atrasar o feedback do toque. Isso destrói o módulo Causa e efeito: se a resposta não _começa_ junto com o toque, a pessoa não liga uma coisa à outra.

A regra é: **latência ≤100ms, duração ≥800ms**. Começa imediato, termina devagar. Por isso o debounce de 400ms dispara no primeiro toque e suprime os seguintes, em vez de esperar a janela fechar.

### Tamanho em ângulo visual, não em pixels

O app roda em tablet a ~45cm e em TV a ~2m. 300px nos dois não é o mesmo estímulo. O perfil guarda o limiar em **graus de ângulo visual**, e cada aparelho guarda seu `pxPorMm` (obtido encostando um cartão de banco na tela — o navegador não expõe tamanho físico real).

Assim o baseline é portátil entre aparelhos e o histórico fica comparável entre sessões. Nenhum tamanho de estímulo é escrito em código; tudo deriva de `nucleo/escala.ts`.

### Viewport zoomável de propósito

`user-scalable=no` reprova na regra `meta-viewport` do axe e é falha de WCAG 1.4.4. O bloqueio de pinch fica no container do estímulo, via `touch-action` **e** listeners `gesture*` — `touch-action` sozinho não segura pinch no Safari do iOS, e o iPad é o aparelho provável.

### Sem backend

Estático na Vercel. Perfis, calibrações, sessões e eventos em IndexedDB (Dexie). O controle remoto entre dispositivos separados é a única parte que precisaria de servidor de sinalização — fica desligada por padrão e rotulada como "requer internet", nunca anunciada como offline.

## Estrutura

```
src/
  app/               rotas, layout, providers
  camada-estimulo/   componentes da tela cheia (só primitivos gigantes)
  camada-cuidador/   componentes de interface normal
  modulos/           um diretório por módulo, auto-registrados
  nucleo/            seguranca.ts, tela.ts, escala.ts, eventos.ts,
                     audio.ts, fala.ts, varredura.ts, lanterna.ts
  dados/             tipos, store, dexie
  design/            tokens, tipografia
```

Código, pastas e comentários em português. Comentário só explica _por quê_.

## Estado

**Etapas 1 a 3 de 10 concluídas.** 93 testes.

|     |                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅  | **1** — Base: TS strict, Tailwind v4, fontes locais, PWA offline, `seguranca.ts` com a varredura da regra 4.8, `tela.ts`                                                                       |
| ✅  | **2** — Núcleo: `escala.ts` (ângulo visual), `eventos.ts` (marcador S/N), `audio.ts`, `fala.ts`, `entrada.ts`, `varredura.ts`, `lanterna.ts`, `posicao.ts`, `viewport.ts`, registro de módulos |
| ✅  | **3** — Módulos **Causa e efeito** e **Estimulação visual**, já instrumentados                                                                                                                 |
| ⬜  | **4** — Camada Cuidador: perfis em Dexie e o fluxo de calibração                                                                                                                               |

Etapas seguintes em `prompt-lume-v3.md`.

### Responsividade

O app roda em celular, tablet, notebook e TV, e a mesma sessão pode girar o tablet no meio. `nucleo/viewport.ts` observa `resize` **e** `orientationchange` — em vários aparelhos o `resize` chega antes de o layout assentar e devolve a dimensão antiga. `escala.ts` recebe a dimensão como parâmetro em vez de ler `window`, então o estímulo nunca fica com o tamanho da orientação anterior.

`nucleo/posicao.ts` impede o estímulo de vazar da tela: sem isso, uma figura grande num quadrante ficaria metade fora, e a pessoa pareceria não responsiva a algo que nunca foi mostrado inteiro.

### Por que não há animação em laço fora da lanterna

A travessia do módulo Estimulação visual poderia ser um `animation: infinite` — é só `transform`, com período de 12s, o que a regra 4.1 permitiria. Mas cada travessia termina de fato e o módulo encadeia a próxima no `animationend`, trocando a cor por fade nesse intervalo. Assim a lanterna segue sendo a única animação contínua do app, que é exatamente o que a varredura da regra 4.8 verifica — a allowlist não precisa crescer.
