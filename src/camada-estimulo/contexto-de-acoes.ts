import { createContext } from 'react';

/**
 * Canal entre um módulo e a Camada Estímulo que o hospeda.
 *
 * Carrega duas coisas que o módulo sabe e a camada precisa: as ações extras que
 * ele oferece ao cuidador, e o momento em que uma volta se completa.
 */

export type AcaoDoModulo = {
  id: string;
  rotulo: string;
  executar: () => void;
};

export type RegistroDeAcoes = {
  acoes: AcaoDoModulo[];
  registrar: (acao: AcaoDoModulo) => () => void;
  voltaCompleta: boolean;
  avisarVolta: () => void;
  recomecar: () => void;
};

export const ContextoDeAcoes = createContext<RegistroDeAcoes | null>(null);
