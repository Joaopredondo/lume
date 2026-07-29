/**
 * Geometria do módulo Traçado.
 *
 * Tudo aqui é puro e em coordenadas normalizadas (0 a 1), para o percurso ser
 * o mesmo em qualquer tela e o componente só multiplicar pela dimensão.
 */

export type Ponto = { x: number; y: number };

export const TIPOS_DE_PERCURSO = [
  'reta-horizontal',
  'reta-vertical',
  'curva',
  'zigue-zague',
  'circulo',
] as const;

export type TipoDePercurso = (typeof TIPOS_DE_PERCURSO)[number];

/** Tolerância de desvio: 2,5 × a espessura da linha, sempre calculada. */
export const FATOR_DE_TOLERANCIA = 2.5;

/**
 * Quanto do percurso pode ser vencido de uma vez.
 *
 * Sem isso, encostar o dedo perto do fim marcaria tudo como percorrido. Com
 * isso, o dedo precisa de fato percorrer. O valor é fração do total.
 */
const JANELA_DE_AVANCO = 0.12;

const PASSOS_POR_CURVA = 48;

/** Gera o percurso em coordenadas normalizadas, com margem para a espessura. */
export function gerarPercurso(tipo: TipoDePercurso): Ponto[] {
  const m = 0.15;
  const f = 1 - m;

  if (tipo === 'reta-horizontal') {
    return [
      { x: m, y: 0.5 },
      { x: f, y: 0.5 },
    ];
  }

  if (tipo === 'reta-vertical') {
    return [
      { x: 0.5, y: m },
      { x: 0.5, y: f },
    ];
  }

  if (tipo === 'zigue-zague') {
    // Largo de propósito: zigue-zague apertado é padrão de alta frequência
    // espacial, proibido pela regra 4.4.
    return [
      { x: m, y: 0.3 },
      { x: 0.35, y: 0.7 },
      { x: 0.65, y: 0.3 },
      { x: f, y: 0.7 },
    ];
  }

  if (tipo === 'curva') {
    return Array.from({ length: PASSOS_POR_CURVA + 1 }, (_, i) => {
      const t = i / PASSOS_POR_CURVA;
      return { x: m + (f - m) * t, y: 0.5 + Math.sin(t * Math.PI) * -0.28 };
    });
  }

  // Círculo: começa e termina no mesmo lugar, o que exige avanço por janela
  // (ver `avancarNoPercurso`) para o dedo não "chegar ao fim" no primeiro toque.
  return Array.from({ length: PASSOS_POR_CURVA + 1 }, (_, i) => {
    const a = (i / PASSOS_POR_CURVA) * Math.PI * 2 - Math.PI / 2;
    return { x: 0.5 + Math.cos(a) * 0.32, y: 0.5 + Math.sin(a) * 0.32 };
  });
}

export function escalarPercurso(percurso: Ponto[], largura: number, altura: number): Ponto[] {
  return percurso.map((p) => ({ x: p.x * largura, y: p.y * altura }));
}

function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Comprimentos acumulados em cada vértice, e o total. */
export function medirPercurso(pontos: Ponto[]): { acumulado: number[]; total: number } {
  const acumulado = [0];
  let total = 0;

  for (let i = 1; i < pontos.length; i += 1) {
    const a = pontos[i - 1];
    const b = pontos[i];
    if (!a || !b) continue;
    total += distancia(a, b);
    acumulado.push(total);
  }

  return { acumulado, total };
}

/** O ponto do percurso a uma dada fração do comprimento. */
export function pontoEm(pontos: Ponto[], progresso: number): Ponto {
  const { acumulado, total } = medirPercurso(pontos);
  const alvo = Math.min(Math.max(progresso, 0), 1) * total;

  for (let i = 1; i < pontos.length; i += 1) {
    const inicio = acumulado[i - 1] ?? 0;
    const fim = acumulado[i] ?? 0;
    if (alvo > fim) continue;

    const a = pontos[i - 1];
    const b = pontos[i];
    if (!a || !b) break;

    const trecho = fim - inicio;
    const t = trecho === 0 ? 0 : (alvo - inicio) / trecho;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  return pontos[pontos.length - 1] ?? { x: 0, y: 0 };
}

/** Projeta um ponto no segmento AB e devolve o parâmetro t em [0,1]. */
function projetarNoSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimentoQuadrado = dx * dx + dy * dy;
  if (comprimentoQuadrado === 0) return 0;

  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / comprimentoQuadrado;
  return Math.min(Math.max(t, 0), 1);
}

export type Avanco = {
  progresso: number;
  desvio: number;
  dentroDaTolerancia: boolean;
};

/**
 * Novo progresso a partir da posição do dedo.
 *
 * **Só olha para a frente, dentro de uma janela.** Isso resolve dois problemas
 * de uma vez: no círculo, o começo e o fim ficam no mesmo lugar, e uma projeção
 * global saltaria direto para o fim; e em qualquer percurso, encostar o dedo
 * adiante marcaria como percorrido um trecho que ninguém percorreu.
 *
 * O progresso **nunca retrocede**: soltar o dedo não reinicia, e voltar com a
 * mão não desfaz o que já foi feito. Refazer trabalho já feito seria punição, e
 * a regra 4.7 não admite punição.
 */
export function avancarNoPercurso(
  pontos: Ponto[],
  dedo: Ponto,
  progressoAtual: number,
  tolerancia: number,
): Avanco {
  const { acumulado, total } = medirPercurso(pontos);
  if (total === 0) return { progresso: progressoAtual, desvio: 0, dentroDaTolerancia: false };

  const limite = Math.min(1, progressoAtual + JANELA_DE_AVANCO) * total;
  const piso = progressoAtual * total;

  let melhorDesvio = Number.POSITIVE_INFINITY;
  let melhorDistancia = piso;

  for (let i = 1; i < pontos.length; i += 1) {
    const inicio = acumulado[i - 1] ?? 0;
    const fim = acumulado[i] ?? 0;

    // Fora da janela: nem atrás do progresso atual, nem além do alcance.
    if (fim < piso || inicio > limite) continue;

    const a = pontos[i - 1];
    const b = pontos[i];
    if (!a || !b) continue;

    const t = projetarNoSegmento(dedo, a, b);
    const naLinha = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const desvio = distancia(dedo, naLinha);

    if (desvio >= melhorDesvio) continue;

    melhorDesvio = desvio;
    melhorDistancia = Math.min(Math.max(inicio + (fim - inicio) * t, piso), limite);
  }

  const dentro = melhorDesvio <= tolerancia;

  return {
    // Fora da tolerância o progresso congela, não volta.
    progresso: dentro ? Math.max(progressoAtual, melhorDistancia / total) : progressoAtual,
    desvio: melhorDesvio,
    dentroDaTolerancia: dentro,
  };
}

/** Fração a partir da qual o percurso conta como concluído. */
export const PROGRESSO_DE_CONCLUSAO = 0.97;

export function estaConcluido(progresso: number): boolean {
  return progresso >= PROGRESSO_DE_CONCLUSAO;
}
