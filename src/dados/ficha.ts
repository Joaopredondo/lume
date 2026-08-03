/**
 * Ficha de acompanhamento do culto.
 *
 * Espelha as quatro seções da folha impressa que o ministério já usa, sem
 * inventar campo nem cortar campo. O objetivo não é modelar bem: é que o
 * voluntário reconheça o papel na tela.
 *
 * **Contém dado de saúde de menor** (nome, idade, laudo). Ver `docs/AVISO.md`
 * e a proteção de acesso em `App.tsx`.
 */

export const HORARIOS = ['09:00', '10:45', '17:00', '19:00'] as const;
export type Horario = (typeof HORARIOS)[number];

export const PERTENCES = ['mochila', 'abafador', 'lanche', 'nenhum', 'outros'] as const;
export type Pertence = (typeof PERTENCES)[number];

export const ESTADOS = ['calmo', 'agitado', 'inadequado', 'crise', 'sonolento'] as const;
export type EstadoEmocional = (typeof ESTADOS)[number];

export const COMUNICACOES = ['fala', 'pecs', 'gestos', 'choro'] as const;
export type Comunicacao = (typeof COMUNICACOES)[number];

export const INTERACOES = ['todos', 'responsavel', 'isolado'] as const;
export type Interacao = (typeof INTERACOES)[number];

export const SAIDAS = ['nao', 'autorregulacao', 'pais'] as const;
export type Saida = (typeof SAIDAS)[number];

export const RECURSOS = ['abafador', 'som', 'calmo', 'pecs'] as const;
export type Recurso = (typeof RECURSOS)[number];

export const ALIMENTACOES = ['aceitou', 'agua', 'recusou'] as const;
export type Alimentacao = (typeof ALIMENTACOES)[number];

/** Resumo que o app monta da sessão. Nunca digitado, nunca editável. */
export type ResumoDaSessaoNaFicha = {
  duracaoMs: number;
  modulos: string[];
  respondeu: number;
  total: number;
  /** `[cumpridos, total]` da rotina do quadro Agora e depois. */
  passosDaRotina: [number, number];
};

export type Ficha = {
  id: string;
  perfilId: string;
  data: number;

  idade: string;
  laudo: string;
  voluntario: string;
  horario: Horario | null;
  pertences: Pertence[];
  outrosPertences: string;
  observacoes: string;

  estado: EstadoEmocional | null;
  comunicacao: Comunicacao[];
  interacao: Interacao | null;
  saida: Saida | null;
  recursos: Recurso[];
  alimentacao: Alimentacao[];

  interesses: string;
  manejo: string;
  descricao: string;

  assinatura: string;
  retiradaPor: string;

  sessao: ResumoDaSessaoNaFicha | null;
};

export const ROTULOS = {
  horario: { '09:00': '09:00', '10:45': '10:45', '17:00': '17:00', '19:00': '19:00' },
  pertences: {
    mochila: 'Mochila',
    abafador: 'Abafador',
    lanche: 'Lanche',
    nenhum: 'Nenhum',
    outros: 'Outros',
  },
  estado: {
    calmo: 'Calmo',
    agitado: 'Agitado',
    inadequado: 'Comportamento inadequado',
    crise: 'Crise',
    sonolento: 'Sonolento',
  },
  comunicacao: {
    fala: 'Fala',
    pecs: 'Cartões visuais / PECS',
    gestos: 'Gestos',
    choro: 'Choro',
  },
  interacao: {
    todos: 'Com todos',
    responsavel: 'Só com o responsável',
    isolado: 'Isolado',
  },
  saida: {
    nao: 'Não saiu',
    autorregulacao: 'Saiu para autorregulação',
    pais: 'Foi entregue aos pais',
  },
  recursos: {
    abafador: 'Abafador',
    som: 'Redução de som',
    calmo: 'Cantinho calmo',
    pecs: 'Cartões visuais / PECS',
  },
  alimentacao: {
    aceitou: 'Aceitou o lanche',
    agua: 'Bebeu água',
    recusou: 'Recusou',
  },
} as const;

/** Zero da ficha: tudo em branco, nada pré-marcado. */
export function fichaVazia(perfilId: string, data = Date.now()): Ficha {
  return {
    id: chaveDaFicha(perfilId, data),
    perfilId,
    data,
    idade: '',
    laudo: '',
    voluntario: '',
    horario: null,
    pertences: [],
    outrosPertences: '',
    observacoes: '',
    estado: null,
    comunicacao: [],
    interacao: null,
    saida: null,
    recursos: [],
    alimentacao: [],
    interesses: '',
    manejo: '',
    descricao: '',
    assinatura: '',
    retiradaPor: '',
    sessao: null,
  };
}

/**
 * Uma ficha por perfil por dia. A chave é o par, para o voluntário reabrir e
 * completar durante o culto em vez de criar uma ficha nova a cada toque.
 */
export function chaveDaFicha(perfilId: string, data: number): string {
  return `${perfilId}:${new Date(data).toISOString().slice(0, 10)}`;
}

/**
 * Alterna item de escolha única.
 *
 * Tocar de novo **desmarca**. O papel permite deixar em branco, e a versão
 * digital não pode ser mais rígida que a folha — voluntário que marcou errado
 * no meio do culto precisa conseguir desfazer.
 */
export function alternarUnico<T>(atual: T | null, escolha: T): T | null {
  return atual === escolha ? null : escolha;
}

/** Alterna item de escolha múltipla. */
export function alternarMultiplo<T>(atuais: T[], escolha: T): T[] {
  return atuais.includes(escolha)
    ? atuais.filter((item) => item !== escolha)
    : [...atuais, escolha];
}
