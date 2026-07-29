import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ContextoDeAcoes, type AcaoDoModulo, type RegistroDeAcoes } from './contexto-de-acoes';

export function ProvedorDeAcoes({ children }: { children: ReactNode }) {
  const [acoes, setAcoes] = useState<AcaoDoModulo[]>([]);
  const [voltaCompleta, setVoltaCompleta] = useState(false);

  const registrar = useCallback((acao: AcaoDoModulo) => {
    setAcoes((atuais) => [...atuais.filter((a) => a.id !== acao.id), acao]);
    return () => setAcoes((atuais) => atuais.filter((a) => a.id !== acao.id));
  }, []);

  const valor = useMemo<RegistroDeAcoes>(
    () => ({
      acoes,
      registrar,
      voltaCompleta,
      avisarVolta: () => setVoltaCompleta(true),
      recomecar: () => setVoltaCompleta(false),
    }),
    [acoes, registrar, voltaCompleta],
  );

  return <ContextoDeAcoes.Provider value={valor}>{children}</ContextoDeAcoes.Provider>;
}
