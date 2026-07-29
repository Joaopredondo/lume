import { describe, expect, it } from 'vitest';
import {
  FATOR_DE_TOLERANCIA,
  TIPOS_DE_PERCURSO,
  avancarNoPercurso,
  escalarPercurso,
  estaConcluido,
  gerarPercurso,
  medirPercurso,
  pontoEm,
  type Ponto,
} from './tracado';

const RETA: Ponto[] = [
  { x: 0, y: 100 },
  { x: 1000, y: 100 },
];

describe('percursos', () => {
  it('todos cabem na tela, com margem para a espessura', () => {
    for (const tipo of TIPOS_DE_PERCURSO) {
      for (const p of gerarPercurso(tipo)) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('o zigue-zague é largo, não um padrão de alta frequência (regra 4.4)', () => {
    const pontos = gerarPercurso('zigue-zague');
    // Poucas inversões e bem espaçadas: padrão apertado em movimento é proibido.
    expect(pontos.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < pontos.length; i += 1) {
      expect(Math.abs((pontos[i]?.x ?? 0) - (pontos[i - 1]?.x ?? 0))).toBeGreaterThan(0.1);
    }
  });

  it('o círculo fecha onde começou', () => {
    const pontos = gerarPercurso('circulo');
    const primeiro = pontos[0];
    const ultimo = pontos[pontos.length - 1];
    expect(
      Math.hypot((primeiro?.x ?? 0) - (ultimo?.x ?? 0), (primeiro?.y ?? 0) - (ultimo?.y ?? 0)),
    ).toBeLessThan(0.01);
  });

  it('escalar multiplica pelas dimensões da tela', () => {
    const escalado = escalarPercurso([{ x: 0.5, y: 0.25 }], 800, 600);
    expect(escalado[0]).toEqual({ x: 400, y: 150 });
  });
});

describe('medição e projeção', () => {
  it('mede o comprimento total', () => {
    expect(medirPercurso(RETA).total).toBe(1000);
  });

  it('pontoEm devolve a posição na fração pedida', () => {
    expect(pontoEm(RETA, 0.5)).toEqual({ x: 500, y: 100 });
    expect(pontoEm(RETA, 0)).toEqual({ x: 0, y: 100 });
    expect(pontoEm(RETA, 1)).toEqual({ x: 1000, y: 100 });
  });
});

describe('avanço do dedo', () => {
  const tolerancia = 48 * FATOR_DE_TOLERANCIA;

  it('avança quando o dedo está sobre a linha', () => {
    const { progresso, dentroDaTolerancia } = avancarNoPercurso(
      RETA,
      { x: 80, y: 100 },
      0,
      tolerancia,
    );
    expect(dentroDaTolerancia).toBe(true);
    expect(progresso).toBeCloseTo(0.08, 3);
  });

  it('aceita desvio dentro da tolerância', () => {
    const { dentroDaTolerancia } = avancarNoPercurso(
      RETA,
      { x: 80, y: 100 + tolerancia - 1 },
      0,
      tolerancia,
    );
    expect(dentroDaTolerancia).toBe(true);
  });

  it('congela — não retrocede — fora da tolerância', () => {
    const { progresso, dentroDaTolerancia } = avancarNoPercurso(
      RETA,
      { x: 80, y: 100 + tolerancia + 50 },
      0.4,
      tolerancia,
    );
    expect(dentroDaTolerancia).toBe(false);
    expect(progresso).toBe(0.4);
  });

  it('NUNCA retrocede: voltar com a mão não desfaz o percorrido', () => {
    // Refazer trabalho já feito seria punição, e a regra 4.7 não admite punição.
    const { progresso } = avancarNoPercurso(RETA, { x: 10, y: 100 }, 0.5, tolerancia);
    expect(progresso).toBe(0.5);
  });

  it('soltar o dedo e voltar retoma de onde parou', () => {
    // Não há estado de "soltou": o progresso é só um número que não desce.
    let progresso = 0;
    progresso = avancarNoPercurso(RETA, { x: 300, y: 100 }, progresso, tolerancia).progresso;
    const antesDeSoltar = progresso;

    // Dedo fora da linha (soltou), depois volta no mesmo lugar.
    progresso = avancarNoPercurso(RETA, { x: 300, y: 900 }, progresso, tolerancia).progresso;
    expect(progresso).toBe(antesDeSoltar);

    progresso = avancarNoPercurso(RETA, { x: 340, y: 100 }, progresso, tolerancia).progresso;
    expect(progresso).toBeGreaterThan(antesDeSoltar);
  });

  it('não dá para pular para o fim encostando o dedo lá', () => {
    // Sem a janela de avanço, tocar perto do alvo marcaria tudo como percorrido.
    const { progresso } = avancarNoPercurso(RETA, { x: 990, y: 100 }, 0, tolerancia);
    expect(progresso).toBeLessThan(0.2);
    expect(estaConcluido(progresso)).toBe(false);
  });

  it('no círculo, o dedo no ponto de partida não conclui de imediato', () => {
    // Começo e fim ficam no mesmo lugar: uma projeção global saltaria para o fim.
    const circulo = escalarPercurso(gerarPercurso('circulo'), 1000, 1000);
    const partida = circulo[0];
    if (!partida) throw new Error('percurso vazio');

    const { progresso } = avancarNoPercurso(circulo, partida, 0, tolerancia);
    expect(estaConcluido(progresso)).toBe(false);
  });

  it('percorrer passo a passo chega ao fim', () => {
    const circulo = escalarPercurso(gerarPercurso('circulo'), 1000, 1000);
    let progresso = 0;

    for (let i = 0; i <= 200; i += 1) {
      const alvo = pontoEm(circulo, Math.min(1, i / 200));
      progresso = avancarNoPercurso(circulo, alvo, progresso, tolerancia).progresso;
    }

    expect(estaConcluido(progresso)).toBe(true);
  });

  it('a tolerância é derivada da espessura, nunca um número fixo', () => {
    expect(FATOR_DE_TOLERANCIA).toBe(2.5);
    // Espessura maior (perfil com limiar maior) aceita desvio maior.
    const fina = 20 * FATOR_DE_TOLERANCIA;
    const grossa = 80 * FATOR_DE_TOLERANCIA;
    expect(grossa).toBeGreaterThan(fina);
  });
});
