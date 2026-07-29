# Regras clínicas de segurança

A usuária principal tem **baixa visão extrema**, **dificuldade motora** e **histórico de crises convulsivas**. As regras abaixo têm prioridade sobre qualquer escolha estética. Em conflito, a segurança ganha.

Nada aqui depende de alguém lembrar da regra na revisão de código: cada uma tem verificação automatizada em `src/nucleo/seguranca.test.ts`.

## 4.1 — Luminância

Nenhuma mudança de luminância global maior que 10% em área maior que 25% da tela pode ocorrer com frequência superior a **0,33 Hz** (uma vez a cada 3 segundos).

Sem strobe, sem flash, sem confete, sem partículas. `animation-iteration-count: infinite` só é permitido em animações que alteram exclusivamente `transform`, sem mudança perceptível de luminância, e com período ≥ 3s.

> **Verificado por**: teste `não repete animação fora da lanterna`, que falha se `infinite` aparecer fora de `src/nucleo/lanterna.ts`. A constante `FREQUENCIA_MAXIMA_HZ` e `periodoEhSeguro()` expõem o limite para o código.

## 4.2 — Latência ≠ duração

São coisas diferentes e o app depende de acertar as duas.

- **Latência de resposta ao toque: ≤ 100ms.** O feedback tem que _começar_ praticamente junto com o toque. Se demorar, a relação de causa e efeito se perde — é o objetivo clínico do módulo mais importante. `delay` é sempre `0` no feedback de entrada.
- **Duração da animação: ≥ 800ms**, easing suave, alterando apenas `opacity` e `transform`.

Começa imediato, termina devagar.

> **Verificado por**: `não usa literal numérico em duração no código (TS/TSX)`, `não usa delay diferente de zero no feedback`, `não declara animation-duration abaixo de 800ms`, `não declara transition-duration abaixo de 800ms`, `não escreve transition abreviado com tempo curto`, e o teste sobre o enum `DURACAO`.

## 4.3 — Fundo

A tela inteira nunca alterna entre claro e escuro. O fundo é preto (`--color-tinta-preta`) e permanece preto. `color-scheme: dark` fixo, sem tema claro.

> **Verificado por**: inspeção — não existe caminho de código que troque o fundo. Não há alternância de tema no app.

## 4.4 — Frequência espacial

Nada de padrão listrado, xadrez ou repetitivo em movimento. Qualquer padrão repetido em movimento precisa de período maior que 1/10 da menor dimensão da tela.

> **Verificado por**: revisão de cada módulo na sua etapa. Não há verificação estática — a forma é decidida no SVG.

## 4.5 — Áudio

Envelope de ataque ≥ 150ms, sem transiente agudo, sem conteúdo relevante acima de ~4kHz, com limitador de ganho no destino. Mudo global sempre acessível.

> **Verificado por**: testes de `nucleo/audio.ts` (etapa 2).

## 4.6 — Movimento reduzido

`prefers-reduced-motion` respeitado **e** um "Modo calmo" que zera todas as animações (só fade de 1s), independente da configuração do sistema.

> **Implementado em** `src/index.css`. O Modo calmo é ligado pelo store e aplicado via `data-calmo` no `<html>`. As durações literais de `1s` nesse bloco são a regra sendo aplicada, não violada — por isso a checagem de duração literal ignora CSS e valida o _valor_ em vez da presença.

## 4.7 — Sem pressão

Sem cronômetro, contagem regressiva, placar, ranking ou feedback de erro. Nenhuma pressão de tempo em nenhum módulo, **inclusive na calibração**.

> **Verificado por**: revisão por etapa. Nenhum módulo pode registrar acerto/erro — só resposta observada pelo cuidador, com a cor, o tamanho e a posição do estímulo naquele instante.

## 4.8 — Garantias em código

- Todas as durações de animação saem do enum `DURACAO` em `src/nucleo/seguranca.ts`.
- Proibido literal numérico em prop de duração no código.
- Proibido literal de `px`/`rem` em `src/camada-estimulo/` e `src/modulos/` — tamanho de estímulo sai de `nucleo/escala.ts`, derivado do limiar do perfil (§3.1).
- Escape auditável: uma linha marcada com `seguranca:ok` é ignorada pela varredura. Serve para as exceções autorizadas por escrito. Um `seguranca:ok` novo num diff exige justificativa.

Estado atual: **10 testes, 7 deles varredura estática**. Foram validados injetando violações deliberadas e confirmando que cada verificação falha.

## Zoom — por que o viewport continua zoomável

`user-scalable=no` e `maximum-scale` reprovam na regra `meta-viewport` do axe e são falha de **WCAG 1.4.4**. Bloquear zoom no viewport derrubaria a meta de acessibilidade do projeto.

O bloqueio de gesto acontece **só no container da Camada Estímulo**, em `src/nucleo/tela.ts`: `touch-action: none`, `overscroll-behavior: none` e `preventDefault` em `gesturestart`/`gesturechange`/`gestureend`.

Os listeners `gesture*` são não-padrão e existem para o Safari: **`touch-action` sozinho não bloqueia pinch-zoom no iOS**, e o iPad é o aparelho provável. Não são redundantes com o CSS.

## Aviso

Ver [`AVISO.md`](./AVISO.md).
