import type { ComponentType } from 'react';
import type { Posicao } from '../dados/tipos';

/**
 * Registro de módulos (seção 5).
 *
 * Cada módulo se declara num `manifesto.ts` e é coletado por `import.meta.glob`.
 * Adicionar um módulo novo não pode exigir tocar em nenhum arquivo central —
 * são 8 módulos previstos e a lista vai crescer.
 */

export type NivelDoModulo = 'inicial' | 'intermediario' | 'avancado';

/**
 * Os identificadores são ASCII para não depender de acento em chave de objeto,
 * mas o que aparece na tela precisa estar escrito certo — "AVANCADO" numa
 * interface em português é erro, não estilo.
 */
export const NOME_DO_NIVEL: Record<NivelDoModulo, string> = {
  inicial: 'inicial',
  intermediario: 'intermediário',
  avancado: 'avançado',
};

export type PropsDoModulo = {
  /** Onde o estímulo aparece nesta apresentação (seção 3.2). */
  posicao: Posicao;
  aoSair: () => void;
};

export type ManifestoDeModulo = {
  id: string;
  nome: string;
  icone: string;
  nivel: NivelDoModulo;
  componente: ComponentType<PropsDoModulo>;
  /**
   * Uma linha, sempre visível no cartão. O cuidador escolhe um módulo no
   * escuro e com pressa — precisa saber o que vai acontecer antes de abrir.
   */
  resumo: string;
  /**
   * O que a pessoa atendida faz. Escrito na voz de quem opera, não em
   * linguagem de produto.
   */
  comoUsar: string;
  /**
   * O que observar. É esta linha que liga o módulo ao marcador de resposta:
   * sem saber o que conta como resposta, o dado do histórico vira palpite.
   */
  oQueObservar: string;
  /**
   * Posições que o módulo aceita. Um módulo de layout fixo declara só
   * `['centro']` — é uma exceção deliberada, não um esquecimento.
   */
  posicoesSuportadas: Posicao[];
};

const encontrados = import.meta.glob<{ manifesto: ManifestoDeModulo }>('./*/manifesto.ts', {
  eager: true,
});

function coletar(): ManifestoDeModulo[] {
  return Object.values(encontrados)
    .map((modulo) => modulo.manifesto)
    .filter((manifesto): manifesto is ManifestoDeModulo => Boolean(manifesto))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export const MODULOS: ManifestoDeModulo[] = coletar();

export function moduloPorId(id: string): ManifestoDeModulo | undefined {
  return MODULOS.find((modulo) => modulo.id === id);
}

/**
 * A posição a usar, respeitando o que o módulo aceita. Um módulo de layout fixo
 * ignora a preferência do perfil sem quebrar.
 */
export function posicaoValida(manifesto: ManifestoDeModulo, desejada: Posicao): Posicao {
  if (manifesto.posicoesSuportadas.includes(desejada)) return desejada;
  return manifesto.posicoesSuportadas[0] ?? 'centro';
}

/** Sorteio para avaliação de campo visual (seção 3.2). */
export function sortearPosicao(manifesto: ManifestoDeModulo): Posicao {
  const opcoes = manifesto.posicoesSuportadas;
  const indice = Math.floor(Math.random() * opcoes.length);
  return opcoes[indice] ?? 'centro';
}
