# ADR — Controle remoto

**Situação**: aceita. Etapa 9.

## O problema

O trabalho acontece no escuro. O cuidador precisa trocar de módulo, ajustar e marcar resposta **sem se colocar na frente da pessoa atendida** e sem acender a tela do estímulo com uma interface de comando.

## A restrição que decide tudo

Dois navegadores em aparelhos diferentes **não conseguem se encontrar sozinhos**.

Isso costuma ser mal entendido: WebRTC não resolve. Ele estabelece a conexão par-a-par, mas antes disso alguém precisa trocar as ofertas iniciais entre os dois lados — e essa troca exige um servidor de sinalização acessível pelos dois. O PeerJS usa um servidor público na nuvem exatamente para isso.

Não existe API de navegador para descoberta em rede local. mDNS não é exposto ao JavaScript, não há acesso a UDP bruto, e o service worker não escuta a rede.

Portanto: **"controle entre dois aparelhos" e "100% offline" são incompatíveis.** Não por falta de esforço — por falta de mecanismo.

## Decisão

Duas modalidades, com a diferença dita em voz alta em vez de escondida.

### A — Espelho local (padrão, offline de verdade)

Duas janelas ou abas do mesmo navegador, comunicando por `BroadcastChannel`. Uma vai para a TV por cabo ou espelhamento de tela; a outra fica na mão do cuidador.

- Sem rede, sem servidor, sem permissão, sem pareamento.
- É a modalidade padrão e **a única anunciada como offline**.
- Abre em `/?papel=controle`.

Limite honesto: exige que as duas superfícies sejam o mesmo navegador. Espelhamento de tela por cabo ou Chromecast cobre o caso real de "TV grande + celular do cuidador" na maioria das vezes.

### B — Dois aparelhos separados (opcional, requer internet)

Implementada com PeerJS, atrás de pareamento por código.

- **Desligada por padrão.** Nada acontece até alguém clicar em "Gerar código".
- **Rotulada "requer internet"** na própria interface, não só na documentação.
- **Degrada para a modalidade A** quando `navigator.onLine` é falso, com aviso na tela.
- **Carregada por `import()` dinâmico.** O pacote não entra no bundle principal nem no precache do service worker, então a promessa de o app funcionar offline continua verdadeira para todo o resto.

## O que foi rejeitado

**Anunciar B como offline.** Seria mentira, e mentira sobre disponibilidade é a pior categoria: descobre-se no pior momento, com a pessoa atendida já posicionada.

**Subir um servidor de sinalização próprio.** Resolveria a dependência de terceiro, mas o projeto é estático na Vercel, sem backend, e um servidor a manter contradiz a arquitetura inteira.

**Fazer só a modalidade A e omitir B.** O caso "TV na parede, celular na mão" é real e nem sempre há cabo.

## Custo aceito

Dependência de um serviço de terceiro (servidor PeerJS público) para uma funcionalidade opcional. Se ele sair do ar, a modalidade B para e a A continua. Nenhum dado de sessão trafega por lá: as mensagens são comandos (`abrir módulo`, `marcar resposta`, `ajustar`), e os eventos são gravados no aparelho do palco.

## Estado de verificação

A modalidade A tem teste automatizado. **A modalidade B não foi testada de ponta a ponta** — exige dois aparelhos e internet, o que não estava disponível no ambiente de desenvolvimento. O código está escrito e tipado, mas a primeira execução real precisa ser conferida por uma pessoa.
