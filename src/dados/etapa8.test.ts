import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MINIMO_PARA_PROPORCAO,
  porCor,
  porPosicao,
  porTamanho,
  proporcao,
  temAmostraSuficiente,
} from './cruzamento';
import { apagarDadosDoPerfil, db, listarEventos, type EventoSalvo } from './db';
import { eventosParaCsv, nomeDeArquivo } from './exportar';
import { encerrarSessao, iniciarSessao, limparSessao, registrarModulo } from './sessoes';
import { PERFIL_PADRAO } from './tipos';
import { definirEstimuloVigente, limparEventos, marcarResposta } from '../nucleo/eventos';

function evento(mudanca: Partial<EventoSalvo> = {}): EventoSalvo {
  return {
    respondeu: true,
    moduloId: 'causa-e-efeito',
    cor: 'amarelo-sinal',
    tamanhoAngular: 6,
    posicao: 'centro',
    pesoFonte: 'extrabold',
    origem: 'teclado',
    em: Date.now(),
    sessaoId: 's1',
    perfilId: 'p1',
    ...mudanca,
  };
}

beforeEach(async () => {
  limparSessao();
  limparEventos();
  await db.sessoes.clear();
  await db.eventos.clear();
  await db.perfis.clear();
  await db.conteudo.clear();
});

afterEach(() => {
  limparSessao();
  limparEventos();
});

describe('sessão', () => {
  it('persiste a marcação com todos os eixos', async () => {
    await iniciarSessao('p1');
    definirEstimuloVigente({
      moduloId: 'animais',
      cor: 'laranja-sinal',
      tamanhoAngular: 8,
      posicao: 'q2',
      pesoFonte: 'bold',
    });

    marcarResposta(true, 'teclado');
    await new Promise((r) => setTimeout(r, 10));

    const salvos = await listarEventos('p1');
    expect(salvos).toHaveLength(1);
    expect(salvos[0]).toMatchObject({
      respondeu: true,
      moduloId: 'animais',
      cor: 'laranja-sinal',
      tamanhoAngular: 8,
      posicao: 'q2',
    });
  });

  it('reaproveita a sessão aberta ao trocar de módulo', async () => {
    // Entrar e sair de módulos é normal dentro de um mesmo atendimento;
    // fatiar isso em várias sessões picotaria o histórico sem motivo.
    const primeira = await iniciarSessao('p1');
    await registrarModulo('alfabeto');
    const segunda = await iniciarSessao('p1');
    await registrarModulo('numeros');

    expect(segunda.id).toBe(primeira.id);
    const sessao = await db.sessoes.get(primeira.id);
    expect(sessao?.modulos).toEqual(['alfabeto', 'numeros']);
  });

  it('trocar de perfil encerra a sessão anterior', async () => {
    const antiga = await iniciarSessao('p1');
    const nova = await iniciarSessao('p2');

    expect(nova.id).not.toBe(antiga.id);
    expect((await db.sessoes.get(antiga.id))?.fim).not.toBeNull();
  });

  it('o resumo conta resposta e não-resposta, não toques', async () => {
    await iniciarSessao('p1');
    definirEstimuloVigente({
      moduloId: 'x',
      cor: 'verde-sinal',
      tamanhoAngular: 4,
      posicao: 'centro',
      pesoFonte: 'extrabold',
    });

    marcarResposta(true, 'teclado');
    marcarResposta(false, 'teclado');
    marcarResposta(true, 'controle');
    await new Promise((r) => setTimeout(r, 10));

    const resumo = await encerrarSessao();
    expect(resumo?.respondeu).toBe(2);
    expect(resumo?.naoRespondeu).toBe(1);
  });

  it('depois de encerrada, marcação não é mais gravada', async () => {
    await iniciarSessao('p1');
    definirEstimuloVigente({
      moduloId: 'x',
      cor: 'verde-sinal',
      tamanhoAngular: 4,
      posicao: 'centro',
      pesoFonte: 'extrabold',
    });
    await encerrarSessao();

    marcarResposta(true, 'teclado');
    await new Promise((r) => setTimeout(r, 10));

    expect(await listarEventos('p1')).toHaveLength(0);
  });
});

describe('cruzamento', () => {
  it('agrupa por cor contando resposta e total', () => {
    const faixas = porCor([
      evento({ cor: 'amarelo-sinal', respondeu: true }),
      evento({ cor: 'amarelo-sinal', respondeu: false }),
      evento({ cor: 'ciano-sinal', respondeu: true }),
    ]);

    expect(faixas.find((f) => f.rotulo === 'amarelo-sinal')).toEqual({
      rotulo: 'amarelo-sinal',
      respondeu: 1,
      total: 2,
    });
  });

  it('NÃO mostra proporção com amostra pequena', () => {
    // Com 2 observações, "50%" é ruído — e um número desses convida a uma
    // conclusão que o dado não sustenta.
    const pequena = { rotulo: 'q1', respondeu: 1, total: 2 };
    expect(temAmostraSuficiente(pequena)).toBe(false);
    expect(proporcao(pequena)).toBeNull();
  });

  it('mostra proporção a partir do mínimo', () => {
    const suficiente = { rotulo: 'q1', respondeu: 3, total: MINIMO_PARA_PROPORCAO };
    expect(proporcao(suficiente)).toBeCloseTo(3 / MINIMO_PARA_PROPORCAO, 6);
  });

  it('agrupa tamanho em faixas ordenadas do menor para o maior', () => {
    const faixas = porTamanho([
      evento({ tamanhoAngular: 12 }),
      evento({ tamanhoAngular: 2 }),
      evento({ tamanhoAngular: 7 }),
      evento({ tamanhoAngular: 0 }),
    ]);

    expect(faixas.map((f) => f.rotulo)).toEqual([
      'sem calibração',
      'até 3°',
      '6° a 10°',
      'acima de 10°',
    ]);
  });

  it('separa por posição, que é o eixo de campo visual', () => {
    const faixas = porPosicao([
      evento({ posicao: 'esquerda', respondeu: false }),
      evento({ posicao: 'esquerda', respondeu: false }),
      evento({ posicao: 'direita', respondeu: true }),
    ]);

    expect(faixas.find((f) => f.rotulo === 'esquerda')?.respondeu).toBe(0);
    expect(faixas.find((f) => f.rotulo === 'direita')?.respondeu).toBe(1);
  });
});

describe('exportação', () => {
  it('gera CSV com cabeçalho e uma linha por evento', () => {
    const csv = eventosParaCsv([evento(), evento({ respondeu: false })]);
    const linhas = csv.trim().split('\n');

    expect(linhas[0]).toContain('respondeu');
    expect(linhas).toHaveLength(3);
    expect(linhas[1]).toContain('sim');
    expect(linhas[2]).toContain('nao');
  });

  it('escapa campo que contém o separador', () => {
    const csv = eventosParaCsv([evento({ moduloId: 'a;b' })]);
    expect(csv).toContain('"a;b"');
  });

  it('nomeia o arquivo com perfil e data, sem acento nem espaço', () => {
    const nome = nomeDeArquivo({ ...PERFIL_PADRAO, nome: 'Maria José' }, 'csv');
    expect(nome).toMatch(/^lume-maria-jos.*-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(nome).not.toMatch(/\s/);
  });
});

describe('apagar dados', () => {
  it('remove perfil, sessões, eventos e conteúdo de uma vez', async () => {
    await iniciarSessao('p1');
    definirEstimuloVigente({
      moduloId: 'x',
      cor: 'verde-sinal',
      tamanhoAngular: 4,
      posicao: 'centro',
      pesoFonte: 'extrabold',
    });
    marcarResposta(true, 'teclado');
    await new Promise((r) => setTimeout(r, 10));
    await encerrarSessao();
    await db.perfis.put({ ...PERFIL_PADRAO, id: 'p1', nome: 'Teste' });

    await apagarDadosDoPerfil('p1');

    expect(await db.perfis.get('p1')).toBeUndefined();
    expect(await listarEventos('p1')).toHaveLength(0);
    expect(await db.sessoes.where('perfilId').equals('p1').count()).toBe(0);
  });

  it('não toca nos dados de outro perfil', async () => {
    await db.perfis.put({ ...PERFIL_PADRAO, id: 'p1', nome: 'Um' });
    await db.perfis.put({ ...PERFIL_PADRAO, id: 'p2', nome: 'Dois' });

    await apagarDadosDoPerfil('p1');

    expect(await db.perfis.get('p2')).toBeDefined();
  });
});
