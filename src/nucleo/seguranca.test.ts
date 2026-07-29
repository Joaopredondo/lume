import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DURACAO, DURACAO_MINIMA_MS, periodoEhSeguro } from './seguranca';

/**
 * Regra 4.8: as regras clínicas da seção 4 não podem depender de alguém
 * lembrar delas na revisão. Estes testes varrem o código e falham sozinhos.
 *
 * Escape auditável: uma linha marcada com `seguranca:ok` é ignorada. Serve para
 * as exceções que a seção 4 autoriza por escrito (a lanterna, o alvo de toque
 * mínimo). Ficar visível no diff é justamente o objetivo — se aparecer um
 * `seguranca:ok` novo, alguém tem que justificar.
 */

const RAIZ = join(import.meta.dirname, '..');
const EXTENSOES = new Set(['.ts', '.tsx', '.css']);
const ESCAPE = 'seguranca:ok';

/** Onde a proibição de tamanho fixo vale: é lá que a pessoa atendida olha. */
const CAMADAS_DE_ESTIMULO = ['camada-estimulo/', 'modulos/'];

/**
 * Superfícies do **cuidador** que moram dentro da Camada Estímulo.
 *
 * O painel de marcação e o aviso de fim de volta aparecem por cima do estímulo,
 * mas não são estímulo: são controles para um adulto que enxerga, atrás de um
 * gesto deliberado. Tamanho deles não deriva do limiar da pessoa atendida — é
 * a mesma exceção já escrita para o alvo de toque mínimo na seção 6.
 *
 * A lista é curta de propósito. Qualquer arquivo novo aqui precisa desta mesma
 * justificativa, e os oito módulos continuam sob a regra cheia.
 */
const SUPERFICIES_DO_CUIDADOR = [
  'camada-estimulo/PainelDoCuidador.tsx',
  'camada-estimulo/FimDaVolta.tsx',
];

type Linha = { arquivo: string; numero: number; texto: string };

function listarArquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return EXTENSOES.has(extname(entrada.name)) ? [caminho] : [];
  });
}

function linhasDoProjeto(): Linha[] {
  return listarArquivos(RAIZ).flatMap((caminho) => {
    const arquivo = relative(RAIZ, caminho).replaceAll('\\', '/');
    if (arquivo.endsWith('.test.ts') || arquivo.endsWith('.test.tsx')) return [];
    return readFileSync(caminho, 'utf8')
      .split('\n')
      .map((texto, i) => ({ arquivo, numero: i + 1, texto }))
      .filter((linha) => !linha.texto.includes(ESCAPE));
  });
}

const LINHAS = linhasDoProjeto();

function relatar(linhas: Linha[]): string[] {
  return linhas.map((l) => `${l.arquivo}:${l.numero} → ${l.texto.trim()}`);
}

describe('enum DURACAO', () => {
  it('não tem nenhuma duração abaixo do piso da regra 4.2', () => {
    for (const [nome, valor] of Object.entries(DURACAO)) {
      expect(valor, `DURACAO.${nome}`).toBeGreaterThanOrEqual(DURACAO_MINIMA_MS);
    }
  });

  it('só considera seguro um período de repetição de 3s ou mais (regra 4.1)', () => {
    expect(periodoEhSeguro(2999)).toBe(false);
    expect(periodoEhSeguro(3000)).toBe(true);
  });
});

describe('varredura do código (regra 4.8)', () => {
  it('encontrou arquivos para varrer', () => {
    // Sem isto, um erro de caminho faria todos os testes abaixo passarem vazios.
    expect(LINHAS.length).toBeGreaterThan(0);
  });

  it('não usa literal numérico em duração no código (TS/TSX)', () => {
    // Só em TS/TSX: aqui a duração tem que sair do enum, sem exceção.
    // No CSS a checagem é outra — ver os testes de valor abaixo — porque o
    // próprio bloco do Modo calmo precisa declarar durações literais para
    // sobrescrever tudo, e essas são a regra sendo aplicada, não violada.
    const suspeitas = LINHAS.filter(
      (l) => !l.arquivo.endsWith('.css') && /\bduration\s*:\s*[\d.]/.test(l.texto),
    );
    expect(relatar(suspeitas), 'use DURACAO do nucleo/seguranca.ts').toEqual([]);
  });

  it('não declara animation-duration abaixo de 800ms', () => {
    const suspeitas = LINHAS.filter((l) => {
      const achado = /animation-duration:\s*([\d.]+)(m?s)/.exec(l.texto);
      if (!achado) return false;
      const [, valor, unidade] = achado;
      const ms = Number(valor) * (unidade === 's' ? 1000 : 1);
      return ms < DURACAO_MINIMA_MS;
    });
    expect(relatar(suspeitas)).toEqual([]);
  });

  it('não usa delay diferente de zero no feedback (regra 4.2)', () => {
    // delay: 0 é obrigatório, não proibido — o feedback começa junto com o toque.
    const suspeitas = LINHAS.filter((l) => /\bdelay\s*:\s*(?!0\b)[\d.]/.test(l.texto));
    expect(relatar(suspeitas), 'latência de resposta tem que ser ≤100ms').toEqual([]);
  });

  /**
   * A regra 4.1 não proíbe repetição: proíbe repetição que mexa em luminância,
   * ou rápida demais. A verificação anterior era uma allowlist de arquivos, o
   * que era ao mesmo tempo frouxo (qualquer coisa no arquivo permitido passava)
   * e estrito demais (bloqueava casos que a regra autoriza). Pior: apontava
   * para `lanterna.ts`, que nem usa `infinite` — usa rAF. Protegia nada.
   *
   * Agora a checagem é a própria regra: toda animação repetida precisa ter
   * período ≥3s e mexer só em `transform`.
   */
  describe('animação repetida (regra 4.1)', () => {
    const usos = LINHAS.filter((l) => /\binfinite\b/.test(l.texto));

    it('toda repetição tem período de 3s ou mais', () => {
      const rapidas = usos.filter((l) => {
        const achado = /([\d.]+)s\s+[^;`'"]*\binfinite\b/.exec(l.texto);
        if (!achado) return false;
        return Number(achado[1]) < 3;
      });
      expect(relatar(rapidas)).toEqual([]);
    });

    it('toda repetição usa duração vinda do enum, não literal', () => {
      const literais = usos.filter((l) => !l.arquivo.endsWith('.css') && /[\d.]+s\b/.test(l.texto));
      expect(relatar(literais), 'use emSegundos() do nucleo/seguranca.ts').toEqual([]);
    });

    it('toda keyframe repetida altera apenas transform', () => {
      // Mudar luminância em laço é exatamente o que a regra proíbe.
      const css = readFileSync(join(RAIZ, 'index.css'), 'utf8');
      const nomes = new Set(
        usos
          .map((l) => /animation:?\s*`?\$?\{?[^`'"]*?([a-z-]+)\s/.exec(l.texto)?.[1])
          .filter((n): n is string => Boolean(n)),
      );

      // A pulsação do Traçado é hoje a única; se surgir outra, ela cai aqui.
      for (const nome of ['pulsar-partida', ...nomes]) {
        const bloco = new RegExp(`@keyframes\\s+${nome}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css);
        if (!bloco) continue;

        const propriedades = [...(bloco[1] ?? '').matchAll(/^\s*([a-z-]+)\s*:/gm)].map((m) => m[1]);
        const proibidas = propriedades.filter((p) => p !== 'transform');
        expect(proibidas, `@keyframes ${nome} só pode mexer em transform`).toEqual([]);
      }
    });
  });

  it('não declara transition-duration abaixo de 800ms', () => {
    const suspeitas = LINHAS.filter((l) => {
      const achado = /transition-duration:\s*([\d.]+)(m?s)/.exec(l.texto);
      if (!achado) return false;
      const [, valor, unidade] = achado;
      const ms = Number(valor) * (unidade === 's' ? 1000 : 1);
      return ms < DURACAO_MINIMA_MS;
    });
    expect(relatar(suspeitas)).toEqual([]);
  });

  it('não escreve transition abreviado com tempo curto', () => {
    const suspeitas = LINHAS.filter((l) => {
      const achado = /transition:[^;]*?([\d.]+)(m?s)/.exec(l.texto);
      if (!achado) return false;
      const [, valor, unidade] = achado;
      const ms = Number(valor) * (unidade === 's' ? 1000 : 1);
      return ms < DURACAO_MINIMA_MS;
    });
    expect(relatar(suspeitas)).toEqual([]);
  });

  it('não escreve tamanho fixo na Camada Estímulo (seção 3.1)', () => {
    // Tamanho de estímulo sai de escala.ts, derivado do limiar do perfil.
    // Nunca de um número decidido no editor.
    const suspeitas = LINHAS.filter(
      (l) =>
        CAMADAS_DE_ESTIMULO.some((pasta) => l.arquivo.startsWith(pasta)) &&
        !SUPERFICIES_DO_CUIDADOR.includes(l.arquivo) &&
        /\b\d+(\.\d+)?(px|rem)\b/.test(l.texto),
    );
    expect(relatar(suspeitas), 'derive de nucleo/escala.ts').toEqual([]);
  });
});
