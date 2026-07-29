import { listarEventos, listarSessoes, type EventoSalvo, type Sessao } from './db';
import type { Perfil } from './tipos';

/**
 * Exportação. Todos os dados vivem só no aparelho, então limpar o navegador
 * apaga tudo — exportar é a única forma de levar o histórico embora.
 */

const COLUNAS = [
  'em',
  'data',
  'sessaoId',
  'moduloId',
  'respondeu',
  'cor',
  'tamanhoAngular',
  'posicao',
  'pesoFonte',
  'origem',
] as const;

function escapar(valor: string): string {
  // Aspas e ponto-e-vírgula dentro do campo quebrariam a coluna.
  if (!/[";\n]/.test(valor)) return valor;
  return `"${valor.replaceAll('"', '""')}"`;
}

/**
 * CSV separado por ponto-e-vírgula: é o que o Excel em pt-BR abre sem pedir
 * assistente de importação, e quem vai abrir isso é a terapeuta, não um script.
 */
export function eventosParaCsv(eventos: EventoSalvo[]): string {
  const linhas = [COLUNAS.join(';')];

  for (const e of eventos) {
    linhas.push(
      [
        String(e.em),
        new Date(e.em).toISOString(),
        e.sessaoId,
        e.moduloId,
        e.respondeu ? 'sim' : 'nao',
        e.cor,
        String(e.tamanhoAngular),
        e.posicao,
        e.pesoFonte,
        e.origem,
      ]
        .map(escapar)
        .join(';'),
    );
  }

  return `${linhas.join('\n')}\n`;
}

export type Exportacao = {
  perfil: Perfil;
  exportadoEm: string;
  sessoes: Sessao[];
  eventos: EventoSalvo[];
};

export async function montarExportacao(perfil: Perfil): Promise<Exportacao> {
  const [sessoes, eventos] = await Promise.all([
    listarSessoes(perfil.id),
    listarEventos(perfil.id),
  ]);
  return { perfil, exportadoEm: new Date().toISOString(), sessoes, eventos };
}

/** Dispara o download no navegador. Sem servidor: o arquivo é gerado aqui. */
export function baixar(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

export function nomeDeArquivo(perfil: Perfil, extensao: string): string {
  const limpo = perfil.nome
    .normalize('NFD')
    .replace(/[^\w]+/g, '-')
    .toLowerCase();
  const data = new Date().toISOString().slice(0, 10);
  return `lume-${limpo || 'perfil'}-${data}.${extensao}`;
}
