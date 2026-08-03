import Dexie, { type EntityTable } from 'dexie';
import type { EventoResposta } from '../nucleo/eventos';
import type { Ficha } from './ficha';
import type { CalibracaoDeAparelho, Perfil } from './tipos';

/**
 * Tudo fica no aparelho. Não há servidor, não há conta, nada sai daqui —
 * ver `docs/AVISO.md`.
 */

/**
 * A calibração física é do **aparelho**, não do perfil: `pxPorMm` descreve a
 * tela, e a mesma pessoa atendida pode ser vista no tablet e na TV. Guardar
 * junto ao perfil faria o limiar viajar errado entre os dois.
 */
export type RegistroDeAparelho = CalibracaoDeAparelho & { id: string };

export type Sessao = {
  id: string;
  perfilId: string;
  inicio: number;
  fim: number | null;
  /** Módulos abertos, na ordem, com repetição quando houve volta. */
  modulos: string[];
};

export type EventoSalvo = EventoResposta & {
  id?: number;
  sessaoId: string;
  perfilId: string;
};

/**
 * Categoria do conteúdo cadastrado pelo voluntário.
 *
 * `palavra` alimenta Alfabeto e Animais; `figurinha` entra na bandeja do quadro
 * Agora e depois. O fluxo de cadastro é o mesmo — muda só onde aparece.
 */
export type CategoriaDeConteudo = 'palavra' | 'figurinha';

/** Palavra e figura cadastradas pelo cuidador. */
export type ConteudoProprio = {
  id: string;
  perfilId: string;
  palavra: string;
  categoria: CategoriaDeConteudo;
  /** Silhueta gerada de uma foto, já limiarizada em cor única. */
  imagem: Blob;
  criadoEm: number;
};

/**
 * Rotina do culto, guardada por perfil.
 *
 * É a mesma toda semana. Redigitar a cada culto inviabilizaria o uso, então a
 * fila persiste e o voluntário só ajusta o que mudou.
 */
export type RotinaSalva = {
  perfilId: string;
  passos: string[];
};

const ID_DESTE_APARELHO = 'este';

class BancoDoApp extends Dexie {
  perfis!: EntityTable<Perfil, 'id'>;
  aparelhos!: EntityTable<RegistroDeAparelho, 'id'>;
  sessoes!: EntityTable<Sessao, 'id'>;
  eventos!: EntityTable<EventoSalvo, 'id'>;
  conteudo!: EntityTable<ConteudoProprio, 'id'>;
  fichas!: EntityTable<Ficha, 'id'>;
  rotinas!: EntityTable<RotinaSalva, 'perfilId'>;

  constructor() {
    super('lume');
    this.version(1).stores({
      perfis: 'id, nome',
      aparelhos: 'id',
    });
    this.version(2).stores({
      perfis: 'id, nome',
      aparelhos: 'id',
      sessoes: 'id, perfilId, inicio',
      // `++id` porque o evento não tem identidade própria: o que importa é a
      // combinação de eixos, e são muitos por sessão.
      eventos: '++id, sessaoId, perfilId, em',
      conteudo: 'id, perfilId, palavra',
    });
    /*
     * Versões anteriores ficam intactas: há aparelhos em uso, e o Dexie aplica
     * a cadeia de upgrades a partir da versão gravada lá.
     */
    this.version(3)
      .stores({
        perfis: 'id, nome',
        aparelhos: 'id',
        sessoes: 'id, perfilId, inicio',
        eventos: '++id, sessaoId, perfilId, em',
        conteudo: 'id, perfilId, palavra, categoria',
        fichas: 'id, perfilId, data',
        rotinas: 'perfilId',
      })
      .upgrade(async (tx) => {
        // Tudo que já existia era palavra do Alfabeto e dos Animais.
        await tx
          .table<ConteudoProprio>('conteudo')
          .toCollection()
          .modify((registro) => {
            registro.categoria = 'palavra';
          });
      });
  }
}

export const db = new BancoDoApp();

export async function listarPerfis(): Promise<Perfil[]> {
  return db.perfis.orderBy('nome').toArray();
}

export async function salvarPerfil(perfil: Perfil): Promise<void> {
  await db.perfis.put(perfil);
}

export async function lerCalibracaoDoAparelho(): Promise<CalibracaoDeAparelho | null> {
  const registro = await db.aparelhos.get(ID_DESTE_APARELHO);
  if (!registro) return null;
  return { pxPorMm: registro.pxPorMm, calibradoEm: registro.calibradoEm };
}

export async function salvarCalibracaoDoAparelho(calibracao: CalibracaoDeAparelho): Promise<void> {
  await db.aparelhos.put({ id: ID_DESTE_APARELHO, ...calibracao });
}

export async function listarSessoes(perfilId: string): Promise<Sessao[]> {
  const sessoes = await db.sessoes.where('perfilId').equals(perfilId).toArray();
  return sessoes.sort((a, b) => b.inicio - a.inicio);
}

export async function listarEventos(perfilId: string): Promise<EventoSalvo[]> {
  const eventos = await db.eventos.where('perfilId').equals(perfilId).toArray();
  return eventos.sort((a, b) => a.em - b.em);
}

export async function listarConteudo(
  perfilId: string,
  categoria?: CategoriaDeConteudo,
): Promise<ConteudoProprio[]> {
  const todos = await db.conteudo.where('perfilId').equals(perfilId).toArray();
  if (!categoria) return todos;
  // Registros anteriores à versão 3 podem não ter categoria gravada ainda.
  return todos.filter((item) => (item.categoria ?? 'palavra') === categoria);
}

/**
 * Apaga tudo de um perfil. Irreversível de propósito — o único jeito de tirar
 * dados do aparelho, já que não existe servidor para pedir remoção.
 */
export async function apagarDadosDoPerfil(perfilId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.perfis, db.sessoes, db.eventos, db.conteudo, db.fichas, db.rotinas],
    async () => {
      await db.eventos.where('perfilId').equals(perfilId).delete();
      await db.sessoes.where('perfilId').equals(perfilId).delete();
      await db.conteudo.where('perfilId').equals(perfilId).delete();
      // Sem estas duas o "apagar tudo" mentiria: a ficha guarda laudo e idade.
      await db.fichas.where('perfilId').equals(perfilId).delete();
      await db.rotinas.delete(perfilId);
      await db.perfis.delete(perfilId);
    },
  );
}
