# Paleta e material de referência

## De onde vem a identidade visual

Os cartões físicos de estimulação visual. Fundo preto, silhueta maciça de cor chapada saturada, moldura laranja. É linguagem de cartaz serigrafado, e o app digitaliza essa identidade em vez de inventar outra.

Observações do material real que corrigem o que estava escrito no prompt:

- **As silhuetas têm detalhe interno**, ao contrário do que "zero detalhe fino" sugeria. O elefante amarelo tem olho, orelha, presa e dedos desenhados; o polvo laranja tem olhos e boca. O detalhe é sempre **recorte preto dentro da forma** — negativo, não traço fino sobreposto. Isso preserva o contraste, porque cada elemento interno é preto absoluto contra a cor saturada.
- **A regra que vale é**: nenhum traço fino de cor sobre cor, nenhum contorno de outline. Detalhe interno em negativo preto é permitido e faz parte da identidade.
- Os cartões têm moldura laranja. No app a moldura não é replicada: a tela inteira já é o cartão, e uma borda roubaria área útil do estímulo.

## Cores da Camada Estímulo

| token                    | valor     | uso                                              |
| ------------------------ | --------- | ------------------------------------------------ |
| `--color-amarelo-sinal`  | `#FFE600` | estímulo primário — maior luminância sobre preto |
| `--color-laranja-sinal`  | `#FF6A00` | estímulo primário                                |
| `--color-verde-sinal`    | `#00E676` | estímulo primário                                |
| `--color-ciano-sinal`    | `#00E5FF` | estímulo primário                                |
| `--color-magenta-sinal`  | `#FF2D95` | estímulo primário                                |
| `--color-vermelho-sinal` | `#FF1E1E` | estímulo primário                                |
| `--color-azul-sinal`     | `#2979FF` | **só módulos cognitivos** — ver abaixo           |

## Por que o azul é diferente dos outros

A atividade impressa de **Círculos e setas** usa exatamente quatro cores: azul, verde, vermelho e amarelo. O app é réplica dela, então o azul precisou entrar na paleta — ciano não substitui sem descaracterizar o material.

Mas azul sobre preto é a **pior** combinação possível para baixa visão: luminância baixa e cones sensíveis ao azul escassos na fóvea. Sobre `#050505` o azul chega a ~3,7:1 de contraste, contra ~19:1 do amarelo.

Isso não é um defeito da atividade — é que ela **não é para a usuária de baixa visão extrema**. Círculos e setas é uma folha impressa em fundo branco, para trabalho cognitivo com as outras crianças e com os idosos. Público diferente, exigência diferente.

Regra prática:

- **Estímulo primário** (Causa e efeito, Estimulação visual, Animais, Alfabeto, Números, Traçado): nunca azul. O sorteio de cor só considera `coresComResposta` do perfil, e o azul não entra na lista padrão.
- **Módulos cognitivos** (Círculos e setas, Cores e formas em modo "encontre"): azul permitido, porque a tarefa é de correspondência e não de detecção no limiar visual.

## Círculos e setas — como a atividade realmente funciona

O prompt descrevia "toca no círculo e depois na seta correspondente". A folha impressa é outra coisa:

1. **Legenda no topo**: quatro pares círculo+seta definindo a regra — azul→baixo, verde→esquerda, vermelho→cima, amarelo→direita.
2. **Grade de círculos coloridos**: 4 colunas × 5 linhas.
3. **Grade de quadrados vazios** logo abaixo, na mesma disposição.

A pessoa preenche cada quadrado com a seta correspondente à cor do círculo acima dele. É transcrição por correspondência, coluna a coluna — não seleção de par.

A segunda página do PDF traz a mesma folha com os círculos **em branco**, para o cuidador definir a própria sequência de cores. Isso alimenta direto o recurso de "conteúdo próprio" da etapa 8.

**Densidade**: 20 itens numa tela é muito para baixa visão. Na versão digital a grade precisa ser fatiada — uma coluna por vez, ou um par por vez — com o número de itens vindo do perfil. Fica registrado para a etapa 7.
