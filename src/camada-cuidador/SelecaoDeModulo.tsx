import { useState } from 'react';
import { Silhueta } from '../design/silhuetas';
import { MODULOS, NOME_DO_NIVEL, type ManifestoDeModulo } from '../modulos/registro';

type Props = {
  aoEscolher: (modulo: ManifestoDeModulo) => void;
};

/**
 * Grade de módulos com **prévia estática real** de cada um — não ícone
 * genérico. No escuro, com pressa, o cuidador reconhece a forma antes de ler
 * o nome.
 *
 * Cada cartão traz uma linha de resumo sempre visível e um detalhe que abre:
 * o que a pessoa faz e o que observar. Sem isso, o marcador de resposta vira
 * palpite — quem não sabe o que conta como resposta não tem o que registrar.
 */
export function SelecaoDeModulo({ aoEscolher }: Props) {
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {MODULOS.map((modulo) => (
        <li
          key={modulo.id}
          // O anel é o que segura o cartão visualmente: a área de prévia é
          // preta como o fundo da página, então sem contorno o cartão parece
          // dois pedaços soltos — a figura flutuando acima de uma caixa.
          // Coluna de altura cheia: o resumo tem uma ou duas linhas conforme o
          // módulo, e sem isto o "Como funciona" de cada cartão parava numa
          // altura diferente dentro da mesma fileira.
          className="flex h-full flex-col overflow-hidden rounded-xl bg-superficie ring-2 ring-texto-secundario/25"
        >
          <button type="button" onClick={() => aoEscolher(modulo)} className="flex-1 text-left">
            <span className="grid h-32 place-items-center bg-tinta-preta sm:h-40">
              <Previa id={modulo.id} />
            </span>
            <span className="block p-4 sm:p-5">
              <span className="text-xs tracking-wide text-texto-secundario uppercase">
                {NOME_DO_NIVEL[modulo.nivel]}
              </span>
              <span className="mt-1 block text-xl font-semibold text-balance sm:text-2xl">
                {modulo.nome}
              </span>
              <span className="mt-2 block text-sm text-texto-secundario">{modulo.resumo}</span>
            </span>
          </button>

          {/* `mt-auto` empurra o rodapé para baixo, alinhando entre cartões. */}
          <div className="mt-auto border-t border-texto-secundario/20 px-4 sm:px-5">
            <button
              type="button"
              aria-expanded={aberto === modulo.id}
              onClick={() => setAberto(aberto === modulo.id ? null : modulo.id)}
              className="flex min-h-14 w-full items-center justify-between text-sm text-texto-secundario"
            >
              Como funciona
              <span aria-hidden className="text-base">
                {aberto === modulo.id ? '−' : '+'}
              </span>
            </button>

            {aberto === modulo.id && (
              <div className="pb-5 text-sm">
                <p className="text-giz-branco">{modulo.comoUsar}</p>
                <p className="mt-3 text-xs tracking-[0.2em] text-texto-secundario uppercase">
                  O que observar
                </p>
                <p className="mt-1 text-texto-secundario">{modulo.oQueObservar}</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A prévia usa a mesma linguagem da Camada Estímulo — forma sólida sobre preto,
 * sem gradiente nem contorno. É uma miniatura do que vai acontecer, então pode
 * ter tamanho fixo: é interface do cuidador, não estímulo calibrado.
 */
function Previa({ id }: { id: string }) {
  if (id === 'causa-e-efeito') {
    return (
      <span className="flex items-center gap-3">
        <span className="size-6 rounded-full bg-laranja-sinal" />
        <span className="size-12 rounded-full bg-amarelo-sinal" />
        <span className="size-20 rounded-full bg-ciano-sinal" />
      </span>
    );
  }

  if (id === 'estimulacao-visual') {
    return (
      <span className="flex w-full items-center justify-between px-8">
        <span className="size-16 rounded-full bg-verde-sinal" />
        <span className="h-1 flex-1 bg-texto-secundario/30" />
        <span className="size-16 rounded-full bg-magenta-sinal" />
      </span>
    );
  }

  if (id === 'alfabeto') {
    return (
      <span className="flex items-end gap-3 font-estimulo font-extrabold">
        <span className="text-5xl text-amarelo-sinal">A</span>
        <span className="text-5xl text-laranja-sinal">B</span>
        <span className="text-5xl text-ciano-sinal">C</span>
      </span>
    );
  }

  if (id === 'numeros') {
    return (
      <span className="flex flex-col items-center gap-2">
        <span className="font-estimulo text-5xl font-extrabold text-ciano-sinal">3</span>
        <span className="flex gap-2">
          <span className="size-4 rounded-full bg-ciano-sinal" />
          <span className="size-4 rounded-full bg-ciano-sinal" />
          <span className="size-4 rounded-full bg-ciano-sinal" />
        </span>
      </span>
    );
  }

  if (id === 'cores-e-formas') {
    return (
      <span className="flex items-center gap-6">
        <span className="size-12 rounded-full bg-vermelho-sinal" />
        <span className="size-12 bg-verde-sinal" />
        <svg viewBox="0 0 100 100" className="size-12" aria-hidden>
          <path d="M50 6 96 92H4L50 6Z" fill="var(--color-amarelo-sinal)" />
        </svg>
      </span>
    );
  }

  if (id === 'animais') {
    return <Silhueta id="peixe" cor="amarelo-sinal" tamanho={96} />;
  }

  if (id === 'tracado') {
    return (
      <svg viewBox="0 0 200 60" className="h-16 w-48" aria-hidden>
        <path
          d="M14 30H186"
          stroke="var(--color-laranja-sinal)"
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M14 30H90"
          stroke="var(--color-amarelo-sinal)"
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
        />
        <circle cx={14} cy={30} r={10} fill="var(--color-verde-sinal)" />
      </svg>
    );
  }

  if (id === 'circulos-e-setas') {
    return (
      <span className="flex items-center gap-4">
        <span className="size-12 rounded-full bg-azul-sinal" />
        <svg viewBox="0 0 100 100" className="size-12" aria-hidden>
          <path
            d="M50 6 88 46H66v48H34V46H12L50 6Z"
            fill="var(--color-giz-branco)"
            transform="rotate(180 50 50)"
          />
        </svg>
      </span>
    );
  }

  if (id === 'formas-e-tamanhos') {
    return (
      <span className="flex items-end gap-5">
        <span className="size-8 rounded-full bg-ciano-sinal" />
        <span className="size-12 bg-verde-sinal" />
        <svg viewBox="0 0 100 100" className="size-20" aria-hidden>
          <path d="M50 6 96 92H4L50 6Z" fill="var(--color-laranja-sinal)" />
        </svg>
      </span>
    );
  }

  if (id === 'agora-e-depois') {
    return (
      <span className="flex gap-3">
        <span className="grid size-16 place-items-center rounded-lg bg-superficie ring-2 ring-amarelo-sinal">
          <span className="size-8 rounded-full bg-amarelo-sinal" />
        </span>
        <span className="grid size-16 place-items-center rounded-lg bg-superficie ring-2 ring-texto-secundario/40">
          <span className="size-8 bg-ciano-sinal" />
        </span>
      </span>
    );
  }

  return <span className="size-16 rounded-full bg-giz-branco" />;
}
