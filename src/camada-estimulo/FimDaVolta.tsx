import { useEstadoDaVolta } from './acoes';

type Props = {
  nomeDoModulo: string;
  aoSair: () => void;
};

/**
 * Aviso de volta completa.
 *
 * Os módulos com conteúdo finito — as 26 letras, os 7 animais, os 5 percursos —
 * davam a volta em silêncio e recomeçavam sozinhos. O cuidador não tinha como
 * saber que acabou nem onde parar.
 *
 * **Não é comemoração e não é placar.** A regra 4.7 proíbe escore, ranking e
 * pressão de tempo, então aqui não há "parabéns", nem quantos acertou, nem
 * quanto tempo levou. É só o fato — o conteúdo terminou — e a escolha do que
 * fazer com isso.
 */
export function FimDaVolta({ nomeDoModulo, aoSair }: Props) {
  const { voltaCompleta, recomecar } = useEstadoDaVolta();

  if (!voltaCompleta) return null;

  return (
    <div
      role="dialog"
      aria-label="Volta completa"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        background: 'var(--color-tinta-preta)',
        fontFamily: 'var(--font-interface)',
        textAlign: 'center',
      }}
    >
      <p style={{ color: 'var(--color-texto-secundario)', fontSize: '1rem', margin: 0 }}>
        {nomeDoModulo}
      </p>
      <p
        style={{
          color: 'var(--color-giz-branco)',
          fontSize: '1.75rem',
          fontWeight: 600,
          margin: 0,
        }}
      >
        Chegou ao fim
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={recomecar}
          style={{
            minHeight: '3.5rem',
            padding: '0 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'var(--color-amarelo-sinal)',
            color: 'var(--color-tinta-preta)',
            fontSize: '1.125rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Recomeçar
        </button>
        <button
          type="button"
          onClick={aoSair}
          style={{
            minHeight: '3.5rem',
            padding: '0 2rem',
            borderRadius: '0.5rem',
            border: '2px solid var(--color-texto-secundario)',
            background: 'var(--color-tinta-preta)',
            color: 'var(--color-giz-branco)',
            fontSize: '1.125rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Encerrar atividade
        </button>
      </div>
    </div>
  );
}
