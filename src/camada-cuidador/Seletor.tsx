import * as Select from '@radix-ui/react-select';

/**
 * Seletor da Camada Cuidador.
 *
 * O `<select>` nativo não é estilizável — a lista aberta é desenhada pelo
 * sistema, e num app de fundo preto absoluto ela aparece como um retângulo
 * branco do Chrome. Fora da identidade e, pior, com um azul de seleção que é
 * exatamente a cor que este projeto documenta como a pior sobre preto.
 *
 * Usa Radix por causa do **comportamento**, não do visual: foco preso,
 * navegação por setas, typeahead, `Home`/`End`, `Esc`, e semântica de listbox
 * para leitor de tela. Este app tem acesso por teclado e acionador como
 * requisito clínico (seção 6) — errar isso na mão sairia caro. O estilo é
 * inteiramente nosso.
 */

export type OpcaoDeSeletor<T extends string> = {
  valor: T;
  rotulo: string;
};

type Props<T extends string> = {
  valor: T;
  opcoes: OpcaoDeSeletor<T>[];
  aoMudar: (valor: T) => void;
  rotulo: string;
};

export function Seletor<T extends string>({ valor, opcoes, aoMudar, rotulo }: Props<T>) {
  return (
    <Select.Root value={valor} onValueChange={(v) => aoMudar(v as T)}>
      <Select.Trigger
        aria-label={rotulo}
        className="flex min-h-14 min-w-56 items-center justify-between gap-4 rounded-lg bg-tinta-preta px-5 text-base font-medium text-giz-branco ring-2 ring-texto-secundario/40 data-[state=open]:ring-amarelo-sinal"
      >
        <Select.Value />
        <Select.Icon>
          <Seta />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-50 overflow-hidden rounded-lg bg-superficie ring-2 ring-amarelo-sinal"
        >
          <Select.Viewport className="p-2">
            {opcoes.map((opcao) => (
              <Select.Item
                key={opcao.valor}
                value={opcao.valor}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-4 text-base text-giz-branco outline-none select-none data-[highlighted]:bg-amarelo-sinal data-[highlighted]:text-tinta-preta"
              >
                {/* Espaço reservado para a marca, para o texto não deslocar
                    quando a seleção muda. */}
                <span className="w-5 shrink-0">
                  <Select.ItemIndicator>
                    <Marca />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{opcao.rotulo}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/** Sólida e espessa — nada de ícone vazado ou de traço fino. */
function Seta() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M12 17 3 7h18l-9 10Z" fill="currentColor" />
    </svg>
  );
}

function Marca() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M9.5 18 2 10.6l3-2.9 4.5 4.4L19 3l3 2.9L9.5 18Z" fill="currentColor" />
    </svg>
  );
}
