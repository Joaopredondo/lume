import { create } from 'zustand';
import {
  lerCalibracaoDoAparelho,
  listarPerfis,
  salvarCalibracaoDoAparelho,
  salvarPerfil,
} from './db';
import {
  CONFIGURACOES_PADRAO,
  PERFIL_PADRAO,
  type CalibracaoDeAparelho,
  type Configuracoes,
  type Perfil,
} from './tipos';

type Estado = {
  perfil: Perfil;
  perfis: Perfil[];
  configuracoes: Configuracoes;
  calibracaoAparelho: CalibracaoDeAparelho | null;
  carregado: boolean;

  hidratar: () => Promise<void>;
  definirPerfil: (perfil: Perfil) => void;
  atualizarPerfil: (mudanca: Partial<Perfil>) => Promise<void>;
  criarPerfil: (nome: string) => Promise<void>;
  ajustar: (mudanca: Partial<Configuracoes>) => void;
  definirCalibracaoAparelho: (calibracao: CalibracaoDeAparelho) => Promise<void>;
};

const CHAVE_PREFERENCIAS = 'lume-config';

/** Só o que o cuidador escolhe de propósito. O multiplicador de tamanho é da sessão. */
type PreferenciasPersistidas = Pick<
  Configuracoes,
  'formasIniciais' | 'progressaoQuantidade' | 'progressaoTamanho'
>;

function lerPreferencias(): Partial<PreferenciasPersistidas> {
  try {
    const cru = localStorage.getItem(CHAVE_PREFERENCIAS);
    if (!cru) return {};
    const parsed = JSON.parse(cru) as Partial<Configuracoes>;
    const limpo: Partial<PreferenciasPersistidas> = {};
    if (typeof parsed.formasIniciais === 'number') limpo.formasIniciais = parsed.formasIniciais;
    if (typeof parsed.progressaoQuantidade === 'boolean') {
      limpo.progressaoQuantidade = parsed.progressaoQuantidade;
    }
    if (typeof parsed.progressaoTamanho === 'boolean') {
      limpo.progressaoTamanho = parsed.progressaoTamanho;
    }
    return limpo;
  } catch {
    return {};
  }
}

function gravarPreferencias(config: Configuracoes) {
  try {
    const fatia: PreferenciasPersistidas = {
      formasIniciais: config.formasIniciais,
      progressaoQuantidade: config.progressaoQuantidade,
      progressaoTamanho: config.progressaoTamanho,
    };
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(fatia));
  } catch {
    /* aparelho sem storage */
  }
}

export const useStore = create<Estado>((set, get) => ({
  perfil: PERFIL_PADRAO,
  perfis: [],
  configuracoes: CONFIGURACOES_PADRAO,
  calibracaoAparelho: null,
  carregado: false,

  /** Lê o que já existe no aparelho. Falha em silêncio: sem IndexedDB o app
   *  ainda funciona, só não lembra de nada entre sessões. */
  hidratar: async () => {
    try {
      const [perfis, calibracao] = await Promise.all([listarPerfis(), lerCalibracaoDoAparelho()]);
      set({
        perfis,
        perfil: perfis[0] ?? PERFIL_PADRAO,
        calibracaoAparelho: calibracao,
        configuracoes: {
          ...CONFIGURACOES_PADRAO,
          ...lerPreferencias(),
          // Sempre no limiar ao abrir o app — o tamanho da sessão anterior
          // não pode vazar para a próxima.
          multiploTamanho: 1,
        },
        carregado: true,
      });
    } catch {
      set({ carregado: true });
    }
  },

  definirPerfil: (perfil) => set({ perfil }),

  atualizarPerfil: async (mudanca) => {
    const atualizado = { ...get().perfil, ...mudanca };
    set((estado) => ({
      perfil: atualizado,
      perfis: estado.perfis.map((p) => (p.id === atualizado.id ? atualizado : p)),
    }));
    // O perfil padrão é um placeholder em memória; salvá-lo criaria um
    // "Sem perfil" fantasma no banco.
    if (atualizado.id !== PERFIL_PADRAO.id) await salvarPerfil(atualizado);
  },

  criarPerfil: async (nome) => {
    const novo: Perfil = { ...PERFIL_PADRAO, id: crypto.randomUUID(), nome };
    await salvarPerfil(novo);
    set((estado) => ({ perfis: [...estado.perfis, novo], perfil: novo }));
  },

  ajustar: (mudanca) =>
    set((estado) => {
      const configuracoes = { ...estado.configuracoes, ...mudanca };
      gravarPreferencias(configuracoes);
      return { configuracoes };
    }),

  definirCalibracaoAparelho: async (calibracaoAparelho) => {
    set({ calibracaoAparelho });
    await salvarCalibracaoDoAparelho(calibracaoAparelho);
  },
}));
