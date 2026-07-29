# Calibração

Sem este passo, "gigante" é um chute e o app não é instrumento nenhum — é só um gerador de formas coloridas. A calibração descobre **o menor tamanho em que houve resposta** e **quais cores funcionam**, e guarda isso de um jeito que vale em qualquer tela.

## Por que em graus, e não em pixels

O app roda em tablet a ~45 cm e em TV a ~2 m. **300 px nos dois não é o mesmo estímulo** — é a diferença entre enxergar e não enxergar.

O que o olho mede é ângulo visual: o quanto o objeto ocupa do campo de visão. Um limiar guardado em graus vale em qualquer aparelho, e as sessões do histórico ficam comparáveis entre si mesmo quando feitas em telas diferentes.

A conversão está em `src/nucleo/escala.ts`:

```
tamanhoPx = 2 · (distânciaCm · 10) · tan(graus / 2) · pxPorMm
```

## Os quatro passos

### 1. Cartão de banco — a régua física

O navegador **não expõe o tamanho real da tela**. `devicePixelRatio` não resolve isso: ele descreve a densidade lógica, não os milímetros.

Então: encoste um cartão de banco na tela e ajuste a barra branca até ficar exatamente da largura dele. Qualquer cartão serve — todos seguem o padrão ISO/IEC 7810 ID-1, **85,6 mm**. Isso dá o `pxPorMm` do aparelho.

**É por aparelho, não por perfil.** `pxPorMm` descreve a tela. Guardar junto ao perfil faria o limiar viajar errado quando a mesma pessoa fosse atendida na TV. Ao trocar de aparelho, refaça só este passo.

Valores fora de 2 a 40 px/mm são recusados — abaixo de ~50 dpi não existe tela de verdade, então só pode ser arrasto acidental.

### 2. Distância de uso

Do olho até a tela, **na posição em que a sessão acontece de verdade** — não na posição em que seria confortável configurar o app. Entra direto na conta do ângulo.

### 3. Limiar de tamanho

Uma figura amarela cresce em degraus de ângulo (1°, 1,5°, 2°, 3°, 4°, 6°, 8°, 10°, 12°, 16°, 20°). Aumente até perceber reação — olhar, virar a cabeça, aquietar, mudar a respiração. Marque **onde houve resposta**.

Restrições que valem aqui como em qualquer tela do app:

- A figura **permanece visível** entre degraus. Ela só cresce, com transição de 800 ms. Some-e-volta seria piscar, e piscar é exatamente o que a regra 4.1 proíbe.
- **Sem cronômetro, sem escore, sem erro.** Não há resposta certa. Quem está sendo avaliado não é a pessoa atendida — é o tamanho.
- Sem pressa. Repita quantas vezes quiser, em dias diferentes.

### 4. Cores com resposta

Cada cor da paleta, já no tamanho calibrado. Marque as que provocaram reação. Só elas entram no sorteio dos módulos.

Vale esperar diferenças grandes aqui: amarelo sobre preto tem ~19:1 de contraste, azul tem ~3,7:1. Ver [`PALETA.md`](./PALETA.md).

## Antes de calibrar

O app funciona sem calibração — cai num padrão conservador de 12°, deliberadamente grande.

Errar para o lado do estímulo grande demais custa uma sessão pouco informativa. Errar para o pequeno demais faz a pessoa **parecer não responsiva quando o problema é do app** — e esse erro pode virar uma conclusão clínica falsa. Por isso o padrão erra para cima.

## Repetir

Visão muda, e a resposta a estímulo varia com fadiga, medicação e hora do dia. Recalibrar periodicamente é esperado, não sinal de que algo deu errado antes. O limiar registrado é o daquele dia, não uma medida permanente da pessoa.
