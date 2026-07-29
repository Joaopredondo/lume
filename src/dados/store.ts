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
    set((estado) => ({ configuracoes: { ...estado.configuracoes, ...mudanca } })),

  definirCalibracaoAparelho: async (calibracaoAparelho) => {
    set({ calibracaoAparelho });
    await salvarCalibracaoDoAparelho(calibracaoAparelho);
  },
}));
