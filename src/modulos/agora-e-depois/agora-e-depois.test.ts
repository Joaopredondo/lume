import { describe, expect, it } from 'vitest';
import { FIGURINHAS, ROTINA_PADRAO, figurinhaPorId } from './figurinhas';
import {
  agora,
  avancar,
  colocar,
  depois,
  estaNoFim,
  progresso,
  rotinaInicial,
  voltar,
} from './rotina';

describe('catálogo de figurinhas', () => {
  it('toda figurinha aponta para uma silhueta que existe', () => {
    for (const figurinha of FIGURINHAS) {
      expect(figurinha.silhueta, figurinha.id).toBeTruthy();
      expect(figurinha.nome.length, figurinha.id).toBeGreaterThan(2);
    }
  });

  it('ids são únicos', () => {
    expect(new Set(FIGURINHAS.map((f) => f.id)).size).toBe(FIGURINHAS.length);
  });

  it('a rotina padrão só usa figurinhas do catálogo', () => {
    for (const id of ROTINA_PADRAO) {
      expect(figurinhaPorId(id), id).toBeDefined();
    }
  });

  it('o cantinho calmo existe — é o recurso de crise sensorial', () => {
    expect(figurinhaPorId('calmo')?.silhueta).toBe('lua');
  });
});

describe('rotina', () => {
  it('começa no primeiro passo, com o seguinte à vista', () => {
    const estado = rotinaInicial(['louvor', 'oracao', 'casa']);
    expect(agora(estado)).toBe('louvor');
    expect(depois(estado)).toBe('oracao');
  });

  it('avançar move os dois espaços juntos', () => {
    const estado = avancar(rotinaInicial(['louvor', 'oracao', 'casa']));
    expect(agora(estado)).toBe('oracao');
    expect(depois(estado)).toBe('casa');
  });

  it('NÃO dá a volta no fim', () => {
    // Recomeçar sozinho faria a criança achar que o culto começou de novo —
    // exatamente a confusão que o quadro existe para evitar.
    let estado = rotinaInicial(['louvor', 'casa']);
    estado = avancar(estado);
    expect(estaNoFim(estado)).toBe(true);

    estado = avancar(estado);
    expect(agora(estado)).toBe('casa');
  });

  it('voltar não passa do primeiro passo', () => {
    const estado = voltar(voltar(rotinaInicial(['louvor', 'casa'])));
    expect(agora(estado)).toBe('louvor');
  });

  it('colocar troca a figurinha do espaço certo', () => {
    const inicial = rotinaInicial(['louvor', 'oracao', 'casa']);

    expect(agora(colocar(inicial, 'lanche', 'agora'))).toBe('lanche');
    expect(depois(colocar(inicial, 'lanche', 'depois'))).toBe('lanche');
  });

  it('soltar em DEPOIS no último passo estende a fila', () => {
    // É como o voluntário monta a rotina no quadro físico: acrescenta ao fim.
    let estado = rotinaInicial(['louvor']);
    estado = colocar(estado, 'casa', 'depois');

    expect(estado.rotina).toEqual(['louvor', 'casa']);
    expect(depois(estado)).toBe('casa');
  });

  it('colocar não move o passo atual', () => {
    const estado = colocar(rotinaInicial(['louvor', 'oracao']), 'lanche', 'depois');
    expect(estado.indice).toBe(0);
    expect(agora(estado)).toBe('louvor');
  });

  it('progresso conta cumpridos sobre o total, para a ficha', () => {
    let estado = rotinaInicial(['a', 'b', 'c', 'd']);
    expect(progresso(estado)).toEqual([0, 4]);

    estado = avancar(avancar(estado));
    expect(progresso(estado)).toEqual([2, 4]);
  });
});
