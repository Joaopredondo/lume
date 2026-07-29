import type { EventoSalvo } from './db';

/**
 * Cruzamento do histórico: resposta × cor, × tamanho, × posição.
 *
 * Isto é o produto do app. Não há escore, nível, "evoluiu 12%" nem
 * interpretação automática — quem lê é profissional e tira as conclusões.
 * O que o código faz é contar e apresentar com honestidade.
 */

export type Faixa = {
  rotulo: string;
  respondeu: number;
  total: number;
};

/**
 * Abaixo disto, proporção não significa nada.
 *
 * Com 2 observações, "50%" e "100%" são ruído. A interface marca a faixa como
 * insuficiente em vez de exibir um número que convida a uma conclusão errada —
 * é o tipo de erro que vira decisão clínica ruim.
 */
export const MINIMO_PARA_PROPORCAO = 5;

export function temAmostraSuficiente(faixa: Faixa): boolean {
  return faixa.total >= MINIMO_PARA_PROPORCAO;
}

/** Proporção de resposta, ou `null` quando a amostra é pequena demais. */
export function proporcao(faixa: Faixa): number | null {
  if (!temAmostraSuficiente(faixa)) return null;
  return faixa.respondeu / faixa.total;
}

function agrupar(eventos: EventoSalvo[], chave: (e: EventoSalvo) => string): Faixa[] {
  const mapa = new Map<string, Faixa>();

  for (const evento of eventos) {
    const rotulo = chave(evento);
    const faixa = mapa.get(rotulo) ?? { rotulo, respondeu: 0, total: 0 };
    faixa.total += 1;
    if (evento.respondeu) faixa.respondeu += 1;
    mapa.set(rotulo, faixa);
  }

  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

export function porCor(eventos: EventoSalvo[]): Faixa[] {
  return agrupar(eventos, (e) => e.cor);
}

export function porPosicao(eventos: EventoSalvo[]): Faixa[] {
  return agrupar(eventos, (e) => e.posicao);
}

export function porModulo(eventos: EventoSalvo[]): Faixa[] {
  return agrupar(eventos, (e) => e.moduloId);
}

/**
 * Tamanho é contínuo, então vira faixa. Os cortes são grosseiros de propósito:
 * fatiar fino com poucas observações produziria muitas faixas vazias.
 */
export function porTamanho(eventos: EventoSalvo[]): Faixa[] {
  return agrupar(eventos, (e) => {
    const g = e.tamanhoAngular;
    if (g <= 0) return 'sem calibração';
    if (g < 3) return 'até 3°';
    if (g < 6) return '3° a 6°';
    if (g < 10) return '6° a 10°';
    return 'acima de 10°';
  }).sort((a, b) => ORDEM_DE_TAMANHO.indexOf(a.rotulo) - ORDEM_DE_TAMANHO.indexOf(b.rotulo));
}

const ORDEM_DE_TAMANHO = ['sem calibração', 'até 3°', '3° a 6°', '6° a 10°', 'acima de 10°'];

/** Contagem por dia, para a linha do tempo. */
export function porDia(eventos: EventoSalvo[]): Faixa[] {
  return agrupar(eventos, (e) => new Date(e.em).toISOString().slice(0, 10)).sort((a, b) =>
    a.rotulo.localeCompare(b.rotulo),
  );
}
