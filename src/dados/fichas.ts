import { db } from './db';
import { chaveDaFicha, fichaVazia, type Ficha, type ResumoDaSessaoNaFicha } from './ficha';

/**
 * Persistência da ficha do culto.
 *
 * Salvar **nunca valida campo obrigatório**. Ficha pela metade é melhor que
 * ficha não preenchida, e o culto acaba antes do formulário.
 */

/** A ficha do dia, existente ou nova. Não grava até alguém salvar. */
export async function fichaDoDia(perfilId: string, data = Date.now()): Promise<Ficha> {
  const existente = await db.fichas.get(chaveDaFicha(perfilId, data));
  return existente ?? fichaVazia(perfilId, data);
}

export async function salvarFicha(ficha: Ficha): Promise<void> {
  await db.fichas.put({ ...ficha, id: chaveDaFicha(ficha.perfilId, ficha.data) });
}

export async function listarFichas(perfilId: string): Promise<Ficha[]> {
  const fichas = await db.fichas.where('perfilId').equals(perfilId).toArray();
  return fichas.sort((a, b) => b.data - a.data);
}

export async function apagarFicha(id: string): Promise<void> {
  await db.fichas.delete(id);
}

/**
 * Monta o bloco que o app preenche sozinho, a partir do que foi registrado no
 * dia. Devolve `null` quando não houve sessão — melhor sumir com o bloco do que
 * mostrar uma fileira de zeros que parece resultado.
 */
export async function resumoDoDia(
  perfilId: string,
  data = Date.now(),
): Promise<ResumoDaSessaoNaFicha | null> {
  const inicioDoDia = new Date(data);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = inicioDoDia.getTime() + 24 * 60 * 60 * 1000;

  const sessoes = (await db.sessoes.where('perfilId').equals(perfilId).toArray()).filter(
    (s) => s.inicio >= inicioDoDia.getTime() && s.inicio < fimDoDia,
  );
  if (sessoes.length === 0) return null;

  const ids = new Set(sessoes.map((s) => s.id));
  const eventos = (await db.eventos.where('perfilId').equals(perfilId).toArray()).filter((e) =>
    ids.has(e.sessaoId),
  );

  const passosDaRotina = await contarPassosDaRotina(
    perfilId,
    eventos.map((e) => e.moduloId),
  );

  return {
    duracaoMs: sessoes.reduce((total, s) => total + ((s.fim ?? s.inicio) - s.inicio), 0),
    modulos: [...new Set(sessoes.flatMap((s) => s.modulos))],
    respondeu: eventos.filter((e) => e.respondeu).length,
    total: eventos.length,
    passosDaRotina,
  };
}

/**
 * Quantos passos da rotina foram cumpridos hoje, sobre o total da rotina do
 * perfil. É a linha "Passos da rotina: 6 de 7" da ficha.
 */
async function contarPassosDaRotina(
  perfilId: string,
  modulosDosEventos: string[],
): Promise<[number, number]> {
  const rotina = await db.rotinas.get(perfilId);
  const total = rotina?.passos.length ?? 0;
  const cumpridos = modulosDosEventos.filter((id) => id === 'agora-e-depois').length;
  return [Math.min(cumpridos, total || cumpridos), total];
}

export async function lerRotina(perfilId: string): Promise<string[] | null> {
  const salva = await db.rotinas.get(perfilId);
  return salva?.passos ?? null;
}

export async function salvarRotina(perfilId: string, passos: string[]): Promise<void> {
  await db.rotinas.put({ perfilId, passos });
}
