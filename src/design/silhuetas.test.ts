import { describe, expect, it } from 'vitest';
import { DESENHOS_PARA_TESTE } from './silhuetas';

/**
 * Toda silhueta precisa **pintar área**.
 *
 * Existe porque a `lua` passou meses no repositório sem desenhar nada: os dois
 * arcos tinham sweep no mesmo sentido e se anulavam pela regra `nonzero`. A
 * geometria estava lá, o `getBBox` devolvia 44×88, e a tela ficava vazia. Hoje
 * os paths vêm de conjuntos de ícones, mas a prova de massa continua valendo.
 *
 * A figura silenciosamente ausente era a do cantinho calmo — o recurso mais
 * usado em crise sensorial. Um `path` que não pinta é pior que um que falta:
 * ninguém procura o que parece existir.
 */

describe('silhuetas', () => {
  const entradas = Object.entries(DESENHOS_PARA_TESTE);

  it('existe pelo menos uma para varrer', () => {
    expect(entradas.length).toBeGreaterThan(0);
  });

  it('nenhuma tem corpo vazio', () => {
    for (const [id, desenho] of entradas) {
      expect(desenho.corpo.trim().length, id).toBeGreaterThan(10);
    }
  });

  it('todo corpo começa em M e fecha em Z', () => {
    // Contorno aberto não preenche de forma previsível entre navegadores.
    for (const [id, desenho] of entradas) {
      expect(desenho.corpo.trim().startsWith('M'), `${id}: começa em M`).toBe(true);
      expect(desenho.corpo.trim().toUpperCase().endsWith('Z'), `${id}: fecha em Z`).toBe(true);
    }
  });

  it('todo detalhe também começa em M e fecha em Z', () => {
    for (const [id, desenho] of entradas) {
      for (const d of desenho.detalhes ?? []) {
        expect(d.trim().startsWith('M'), `${id}: detalhe começa em M`).toBe(true);
        expect(d.trim().toUpperCase().endsWith('Z'), `${id}: detalhe fecha em Z`).toBe(true);
      }
    }
  });

  it('só usa comandos absolutos, que sobrevivem a qualquer concatenação', () => {
    // O gerador normaliza com `abs()`. Comando relativo no começo de um
    // subcaminho seria lido a partir do ponto errado se alguém juntasse paths.
    for (const [id, desenho] of entradas) {
      expect(
        /[mlhvcsqta]/.test(desenho.corpo.replace(/[eE]/g, '')),
        `${id}: comando relativo`,
      ).toBe(false);
    }
  });
});
