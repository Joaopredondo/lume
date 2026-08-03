import { useEffect, useState, type ReactNode } from 'react';
import {
  ALIMENTACOES,
  COMUNICACOES,
  ESTADOS,
  HORARIOS,
  INTERACOES,
  PERTENCES,
  RECURSOS,
  ROTULOS,
  SAIDAS,
  alternarMultiplo,
  alternarUnico,
  fichaVazia,
  type Ficha as TipoDaFicha,
} from '../dados/ficha';
import { fichaDoDia, listarFichas, resumoDoDia, salvarFicha } from '../dados/fichas';
import { useStore } from '../dados/store';

/**
 * Ficha de acompanhamento do culto.
 *
 * Espelha a folha que o ministério já usa, na mesma ordem e com os mesmos
 * grupos. O objetivo não é modelar bem: é que o voluntário reconheça o papel na
 * tela e preencha sem aprender nada novo.
 *
 * Três decisões que vêm do uso real, não da conveniência de programar:
 *
 * - **Escolha única desmarca ao tocar de novo.** O papel permite deixar em
 *   branco; a versão digital não pode ser mais rígida que a folha.
 * - **Salvar não valida nada.** Ficha pela metade é melhor que ficha não
 *   preenchida, e o culto acaba antes do formulário.
 * - **O bloco do app é somente leitura, e some quando não houve sessão.** Uma
 *   fileira de zeros pareceria resultado.
 */
export function Ficha() {
  const perfil = useStore((estado) => estado.perfil);
  const [ficha, setFicha] = useState<TipoDaFicha>(() => fichaVazia(perfil.id));
  const [salvando, setSalvando] = useState(false);
  const [salvaEm, setSalvaEm] = useState<number | null>(null);
  const [anteriores, setAnteriores] = useState<TipoDaFicha[]>([]);

  useEffect(() => {
    void (async () => {
      const [doDia, resumo, lista] = await Promise.all([
        fichaDoDia(perfil.id),
        resumoDoDia(perfil.id),
        listarFichas(perfil.id),
      ]);
      setFicha({ ...doDia, sessao: resumo });
      setAnteriores(lista);
    })();
  }, [perfil.id]);

  const mudar = <C extends keyof TipoDaFicha>(campo: C, valor: TipoDaFicha[C]) =>
    setFicha((atual) => ({ ...atual, [campo]: valor }));

  const guardar = async () => {
    setSalvando(true);
    await salvarFicha(ficha);
    setSalvaEm(Date.now());
    setAnteriores(await listarFichas(perfil.id));
    setSalvando(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-base text-texto-secundario">
        Ficha de <span className="text-giz-branco">{perfil.nome}</span> para{' '}
        {new Date(ficha.data).toLocaleDateString('pt-BR')}. Uma por criança por dia — reabrir
        continua de onde parou. Nada aqui é obrigatório.
      </p>

      <Secao titulo="1 · Identificação, culto e segurança">
        <div className="grid gap-4 sm:grid-cols-3">
          <Texto
            rotulo="Idade"
            valor={ficha.idade}
            aoMudar={(v) => mudar('idade', v)}
            dica="7 anos"
          />
          <div className="sm:col-span-2">
            <Texto
              rotulo="Laudo"
              valor={ficha.laudo}
              aoMudar={(v) => mudar('laudo', v)}
              dica="TEA nível 2, baixa visão…"
            />
          </div>
        </div>

        <Texto
          rotulo="Voluntário(a) responsável"
          valor={ficha.voluntario}
          aoMudar={(v) => mudar('voluntario', v)}
          dica="Nome de quem acompanhou"
        />

        <Grupo rotulo="Horário do culto">
          {HORARIOS.map((h) => (
            <Opcao
              key={h}
              rotulo={ROTULOS.horario[h]}
              marcada={ficha.horario === h}
              aoTocar={() => mudar('horario', alternarUnico(ficha.horario, h))}
            />
          ))}
        </Grupo>

        <Grupo rotulo="Pertences com a criança">
          {PERTENCES.map((p) => (
            <Opcao
              key={p}
              rotulo={ROTULOS.pertences[p]}
              marcada={ficha.pertences.includes(p)}
              aoTocar={() => mudar('pertences', alternarMultiplo(ficha.pertences, p))}
            />
          ))}
        </Grupo>

        {ficha.pertences.includes('outros') && (
          <Texto
            rotulo="Quais outros"
            valor={ficha.outrosPertences}
            aoMudar={(v) => mudar('outrosPertences', v)}
          />
        )}

        <Area
          rotulo="Observações de segurança"
          valor={ficha.observacoes}
          aoMudar={(v) => mudar('observacoes', v)}
          dica="alergias, medicação, restrições…"
        />
      </Secao>

      <Secao titulo="2 · Comportamento, comunicação e autorregulação">
        <Grupo rotulo="Estado emocional geral">
          {ESTADOS.map((e) => (
            <Opcao
              key={e}
              rotulo={ROTULOS.estado[e]}
              marcada={ficha.estado === e}
              aoTocar={() => mudar('estado', alternarUnico(ficha.estado, e))}
            />
          ))}
        </Grupo>

        <Grupo rotulo="Comunicação utilizada hoje">
          {COMUNICACOES.map((c) => (
            <Opcao
              key={c}
              rotulo={ROTULOS.comunicacao[c]}
              marcada={ficha.comunicacao.includes(c)}
              aoTocar={() => mudar('comunicacao', alternarMultiplo(ficha.comunicacao, c))}
            />
          ))}
        </Grupo>

        <Grupo rotulo="Apresentou boa interação?">
          {INTERACOES.map((i) => (
            <Opcao
              key={i}
              rotulo={ROTULOS.interacao[i]}
              marcada={ficha.interacao === i}
              aoTocar={() => mudar('interacao', alternarUnico(ficha.interacao, i))}
            />
          ))}
        </Grupo>

        <Grupo rotulo="Foi necessário sair da sala?">
          {SAIDAS.map((s) => (
            <Opcao
              key={s}
              rotulo={ROTULOS.saida[s]}
              marcada={ficha.saida === s}
              aoTocar={() => mudar('saida', alternarUnico(ficha.saida, s))}
            />
          ))}
        </Grupo>
      </Secao>

      <Secao titulo="3 · Suporte sensorial, alimentação e interesses">
        <Grupo rotulo="Recursos e sensibilidades observadas">
          {RECURSOS.map((r) => (
            <Opcao
              key={r}
              rotulo={ROTULOS.recursos[r]}
              marcada={ficha.recursos.includes(r)}
              aoTocar={() => mudar('recursos', alternarMultiplo(ficha.recursos, r))}
            />
          ))}
        </Grupo>

        <Grupo rotulo="Alimentação / lanche">
          {ALIMENTACOES.map((a) => (
            <Opcao
              key={a}
              rotulo={ROTULOS.alimentacao[a]}
              marcada={ficha.alimentacao.includes(a)}
              aoTocar={() => mudar('alimentacao', alternarMultiplo(ficha.alimentacao, a))}
            />
          ))}
        </Grupo>

        <Area
          rotulo="Interesses demonstrados"
          valor={ficha.interesses}
          aoMudar={(v) => mudar('interesses', v)}
          dica="o que prendeu a atenção hoje"
        />
      </Secao>

      <Secao titulo="4 · Manejo do voluntário e descrição de comportamento">
        <Area
          rotulo="O que o voluntário fez"
          valor={ficha.manejo}
          aoMudar={(v) => mudar('manejo', v)}
          dica="estratégias que funcionaram e as que não"
        />
        <Area
          rotulo="Descrição do comportamento"
          valor={ficha.descricao}
          aoMudar={(v) => mudar('descricao', v)}
          dica="o que aconteceu, sem interpretação"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="Assinatura do voluntário"
            valor={ficha.assinatura}
            aoMudar={(v) => mudar('assinatura', v)}
          />
          <Texto
            rotulo="Retirada por"
            valor={ficha.retiradaPor}
            aoMudar={(v) => mudar('retiradaPor', v)}
            dica="quem buscou a criança"
          />
        </div>
      </Secao>

      {/* Some quando não houve sessão: zeros pareceriam resultado. */}
      {ficha.sessao && (
        <Secao titulo="Preenchido pelo app">
          <p className="text-sm text-texto-secundario">
            Vem da sessão de hoje. Não é digitado nem editável.
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dado rotulo="Duração" valor={`${Math.round(ficha.sessao.duracaoMs / 60000)} min`} />
            <Dado rotulo="Módulos" valor={String(ficha.sessao.modulos.length)} />
            <Dado rotulo="Marcações" valor={`${ficha.sessao.respondeu} de ${ficha.sessao.total}`} />
            <Dado
              rotulo="Passos da rotina"
              valor={`${ficha.sessao.passosDaRotina[0]} de ${ficha.sessao.passosDaRotina[1]}`}
            />
          </dl>
        </Secao>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={salvando}
          className="min-h-14 rounded-lg bg-amarelo-sinal px-6 text-base font-semibold text-tinta-preta disabled:opacity-40"
        >
          {salvando ? 'Salvando…' : 'Salvar ficha'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-14 rounded-lg bg-superficie px-6 text-base font-medium ring-2 ring-texto-secundario/40"
        >
          Exportar PDF
        </button>
        {salvaEm && (
          <span className="text-sm text-texto-secundario">
            salva às {new Date(salvaEm).toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>

      {anteriores.length > 1 && (
        <Secao titulo="Fichas anteriores">
          <ul className="flex flex-col gap-2">
            {anteriores.slice(0, 12).map((anterior) => (
              <li
                key={anterior.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-superficie px-4 py-3"
              >
                <span className="text-base tabular-nums">
                  {new Date(anterior.data).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-sm text-texto-secundario">
                  {anterior.horario ?? 'sem horário'}
                  {anterior.estado && ` · ${ROTULOS.estado[anterior.estado]}`}
                </span>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-superficie/60 p-5 ring-1 ring-texto-secundario/20 sm:p-7">
      <h2 className="text-xs tracking-[0.2em] text-texto-secundario uppercase">{titulo}</h2>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-base font-medium">{rotulo}</legend>
      <div className="mt-3 flex flex-wrap gap-3">{children}</div>
    </fieldset>
  );
}

/**
 * Marca com caixa visível.
 *
 * `aria-pressed` em vez de `checkbox`/`radio` porque escolha única aqui
 * **desmarca** ao tocar de novo — comportamento que um grupo de rádio nativo
 * não tem, e forçá-lo confundiria leitor de tela.
 */
function Opcao({
  rotulo,
  marcada,
  aoTocar,
}: {
  rotulo: string;
  marcada: boolean;
  aoTocar: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={marcada}
      onClick={aoTocar}
      className={`flex min-h-14 items-center gap-3 rounded-lg px-5 text-base ring-inset ${
        marcada
          ? 'bg-amarelo-sinal font-semibold text-tinta-preta'
          : 'bg-superficie text-giz-branco ring-2 ring-texto-secundario/30'
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {marcada && (
          <path d="M9.5 18 2.8 11.3l2.4-2.4L9.5 13.2 18.8 4l2.4 2.4L9.5 18Z" fill="currentColor" />
        )}
      </svg>
      {rotulo}
    </button>
  );
}

function Texto({
  rotulo,
  valor,
  aoMudar,
  dica,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium">{rotulo}</span>
      <input
        type="text"
        value={valor}
        placeholder={dica}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-2 min-h-14 w-full rounded-lg bg-tinta-preta px-4 text-lg text-giz-branco ring-2 ring-texto-secundario/40"
      />
    </label>
  );
}

function Area({
  rotulo,
  valor,
  aoMudar,
  dica,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium">{rotulo}</span>
      <textarea
        value={valor}
        placeholder={dica}
        rows={3}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-2 w-full rounded-lg bg-tinta-preta p-4 text-lg text-giz-branco ring-2 ring-texto-secundario/40"
      />
    </label>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-tinta-preta px-4 py-3">
      <dt className="text-xs tracking-wide text-texto-secundario uppercase">{rotulo}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{valor}</dd>
    </div>
  );
}
