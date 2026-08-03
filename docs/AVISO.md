# Aviso de uso

**Este app não é um dispositivo médico.** Não diagnostica, não trata e não substitui acompanhamento profissional. É um recurso de apoio à estimulação visual e cognitiva.

## Uso supervisionado

O app foi desenhado para ser operado por um **cuidador ou terapeuta**, presente durante toda a sessão. Não é feito para uso autônomo pela pessoa atendida.

## Encerrar a sessão

**Qualquer sinal de desconforto encerra a sessão imediatamente.** Isso inclui, sem se limitar a: desvio persistente do olhar, agitação, rigidez, sonolência súbita, náusea ou qualquer alteração de comportamento que fuja do habitual da pessoa.

Na dúvida, encerre. Não há nada no app que justifique continuar.

## Fotossensibilidade

As regras da seção 4 (ver [`SEGURANCA.md`](./SEGURANCA.md)) foram escritas para reduzir risco em pessoas com histórico de crises convulsivas: nada pisca, o fundo permanece preto, e nenhuma mudança de luminância se repete acima de 0,33 Hz.

**Isso reduz o risco, não o elimina.** Nenhum software pode garantir ausência de risco fotossensível. A decisão de usar o app com uma pessoa específica é clínica e cabe a quem a acompanha.

## Dados

Todos os dados — perfis, calibrações, sessões e eventos de resposta — ficam **no próprio aparelho**, em IndexedDB. Não há servidor, não há conta, não há envio para lugar nenhum.

A única exceção é o modo de controle remoto entre dispositivos separados, desligado por padrão e rotulado como "requer internet" na interface.

Limpar os dados do navegador apaga tudo. Use a exportação em CSV/JSON antes.

## Ficha do culto — dado sensível

A ficha guarda **nome, idade e laudo de uma criança**. Isso é dado de saúde de
menor, e merece cuidado maior que o resto do app.

- A ficha abre só depois de segurar o botão por 3 segundos, como a
  Configuração. Nunca a um toque.
- Tudo continua no aparelho, sem servidor. **Quem empresta o tablet leva o
  histórico junto** — não há login separando um voluntário do outro.
- "Apagar dados deste perfil" remove também as fichas e a rotina salva. Se
  algum dia deixar de remover, o botão passa a mentir.
- Antes de repassar ou devolver um aparelho, apague os perfis.
