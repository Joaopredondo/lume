import { useEffect, useState } from 'react';
import { Dialogo } from './Dialogo';

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (nome: string) => void;
};

/**
 * Cadastro de perfil.
 *
 * Substitui o `prompt()` do navegador. Além de feio e fora da identidade, o
 * `prompt` bloqueia a thread, não é estilizável, e em alguns navegadores pode
 * ser suprimido sem aviso — o cuidador clicaria e nada aconteceria.
 */
export function NovoPerfil({ aberto, aoFechar, aoCriar }: Props) {
  const [nome, setNome] = useState('');

  // Cada abertura começa limpa, senão o nome anterior reaparece.
  useEffect(() => {
    if (aberto) setNome('');
  }, [aberto]);

  const valido = nome.trim().length > 0;

  const confirmar = () => {
    if (!valido) return;
    aoCriar(nome.trim());
    aoFechar();
  };

  return (
    <Dialogo
      aberto={aberto}
      titulo="Novo perfil"
      descricao="Cada pessoa atendida tem o próprio perfil, com calibração, cores e histórico separados."
      aoFechar={aoFechar}
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          confirmar();
        }}
      >
        <label className="block">
          <span className="text-base">Nome</span>
          <input
            type="text"
            value={nome}
            autoFocus
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="como você chama a pessoa"
            className="mt-2 min-h-14 w-full rounded-lg bg-tinta-preta px-4 text-lg text-giz-branco ring-2 ring-texto-secundario/40 focus:ring-amarelo-sinal"
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-14 rounded-lg bg-tinta-preta px-6 text-base font-medium text-giz-branco ring-2 ring-texto-secundario/40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valido}
            className="min-h-14 rounded-lg bg-amarelo-sinal px-6 text-base font-semibold text-tinta-preta disabled:opacity-40"
          >
            Criar perfil
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
