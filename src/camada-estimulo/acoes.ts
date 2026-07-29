import { useCallback, useContext, useEffect } from 'react';
import { ContextoDeAcoes, type AcaoDoModulo } from './contexto-de-acoes';

export function useAcoesDoModulo(): AcaoDoModulo[] {
  return useContext(ContextoDeAcoes)?.acoes ?? [];
}

export function useEstadoDaVolta(): {
  voltaCompleta: boolean;
  recomecar: () => void;
} {
  const registro = useContext(ContextoDeAcoes);
  return {
    voltaCompleta: registro?.voltaCompleta ?? false,
    recomecar: registro?.recomecar ?? (() => {}),
  };
}

/**
 * O módulo avisa que percorreu tudo o que tinha — as 26 letras, os 7 animais,
 * os 5 percursos.
 *
 * Antes disso os módulos davam a volta em silêncio e recomeçavam sozinhos, sem
 * nenhum ponto de decisão para o cuidador. Não é comemoração nem placar (a
 * regra 4.7 não admite escore): é só o aviso de que o conteúdo acabou, com a
 * escolha de repetir ou sair.
 */
export function useAvisarVolta(): () => void {
  const registro = useContext(ContextoDeAcoes);
  return useCallback(() => registro?.avisarVolta(), [registro]);
}

/**
 * Declara uma ação a partir de um módulo, para ela aparecer no painel do
 * cuidador. Serve para controles que só existiam no teclado — no celular não há
 * teclado, e um controle solto na tela seria tocado pela pessoa atendida.
 */
export function useRegistrarAcao(id: string, rotulo: string, executar: () => void): void {
  const registro = useContext(ContextoDeAcoes);
  const registrar = registro?.registrar;

  useEffect(() => {
    if (!registrar) return;
    return registrar({ id, rotulo, executar });
  }, [registrar, id, rotulo, executar]);
}
