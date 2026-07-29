import { useEffect, useState } from 'react';
import { Dialogo } from './Dialogo';
import {
  MINIMO_PARA_PROPORCAO,
  porCor,
  porDia,
  porModulo,
  porPosicao,
  porTamanho,
  proporcao,
  temAmostraSuficiente,
  type Faixa,
} from '../dados/cruzamento';
import {
  apagarDadosDoPerfil,
  listarEventos,
  listarSessoes,
  type EventoSalvo,
  type Sessao,
} from '../dados/db';
import { baixar, eventosParaCsv, montarExportacao, nomeDeArquivo } from '../dados/exportar';
import { useStore } from '../dados/store';

/**
 * Histórico.
 *
 * O cruzamento é o produto: resposta × cor, × tamanho, × posição, ao longo do
 * tempo. Sem gamificação, sem escore, sem "parabéns, evoluiu 12%". Dado seco —
 * quem lê é profissional e tira as próprias conclusões.
 */
export function Historico() {
  const perfil = useStore((estado) => estado.perfil);
  const [eventos, setEventos] = useState<EventoSalvo[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);

  useEffect(() => {
    void (async () => {
      const [e, s] = await Promise.all([listarEventos(perfil.id), listarSessoes(perfil.id)]);
      setEventos(e);
      setSessoes(s);
    })();
  }, [perfil.id]);

  if (eventos.length === 0) {
    return (
      <p className="max-w-prose text-base text-texto-secundario">
        Ainda não há marcações para <span className="text-giz-branco">{perfil.nome}</span>. Durante
        um módulo, use <strong className="text-giz-branco">S</strong> para registrar que houve
        resposta e <strong className="text-giz-branco">N</strong> para registrar que não houve.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <Titulo>Resumo</Titulo>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Numero rotulo="Marcações" valor={String(eventos.length)} />
          <Numero rotulo="Com resposta" valor={String(eventos.filter((e) => e.respondeu).length)} />
          <Numero rotulo="Sessões" valor={String(sessoes.length)} />
          <Numero rotulo="Dias" valor={String(porDia(eventos).length)} />
        </dl>
      </section>

      <Cruzamento titulo="Resposta por cor" faixas={porCor(eventos)} />
      <Cruzamento titulo="Resposta por tamanho" faixas={porTamanho(eventos)} />
      <Cruzamento titulo="Resposta por posição" faixas={porPosicao(eventos)} />
      <Cruzamento titulo="Resposta por módulo" faixas={porModulo(eventos)} />

      <section>
        <Titulo>Sessões</Titulo>
        <ul className="flex flex-col gap-2">
          {sessoes.slice(0, 20).map((sessao) => (
            <li
              key={sessao.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-superficie px-4 py-3"
            >
              <span className="text-base tabular-nums">
                {new Date(sessao.inicio).toLocaleString('pt-BR')}
              </span>
              <span className="text-sm text-texto-secundario">
                {sessao.modulos.length} módulo(s)
                {sessao.fim !== null &&
                  ` · ${Math.round((sessao.fim - sessao.inicio) / 60000)} min`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Titulo>Levar os dados</Titulo>
        <p className="mb-4 max-w-prose text-sm text-texto-secundario">
          Tudo fica só neste aparelho. Limpar os dados do navegador apaga o histórico, e não há
          cópia em servidor nenhum — exporte antes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Botao
            onClick={() =>
              baixar(nomeDeArquivo(perfil, 'csv'), eventosParaCsv(eventos), 'text/csv')
            }
          >
            Exportar CSV
          </Botao>
          <Botao
            onClick={() =>
              void montarExportacao(perfil).then((dados) =>
                baixar(
                  nomeDeArquivo(perfil, 'json'),
                  JSON.stringify(dados, null, 2),
                  'application/json',
                ),
              )
            }
          >
            Exportar JSON
          </Botao>
        </div>

        <p className="mt-8 mb-3 text-sm text-texto-secundario">
          Apagar remove perfil, sessões, marcações e conteúdo próprio deste aparelho. Não há cópia
          em servidor nenhum — é definitivo.
        </p>
        <Botao onClick={() => setConfirmandoApagar(true)}>Apagar dados deste perfil</Botao>
      </section>

      <Dialogo
        aberto={confirmandoApagar}
        titulo={`Apagar os dados de ${perfil.nome}?`}
        descricao="Perfil, calibração, sessões, marcações e conteúdo próprio. Não dá para desfazer, e não existe cópia em servidor — exporte antes se quiser guardar."
        aoFechar={() => setConfirmandoApagar(false)}
      >
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmandoApagar(false)}
            className="min-h-14 rounded-lg bg-tinta-preta px-6 text-base font-medium text-giz-branco ring-2 ring-texto-secundario/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              void apagarDadosDoPerfil(perfil.id).then(() => {
                setConfirmandoApagar(false);
                setEventos([]);
                setSessoes([]);
                void useStore.getState().hidratar();
              });
            }}
            className="min-h-14 rounded-lg bg-vermelho-sinal px-6 text-base font-semibold text-giz-branco"
          >
            Apagar tudo
          </button>
        </div>
      </Dialogo>
    </div>
  );
}

/**
 * Uma barra por faixa, com a contagem sempre visível.
 *
 * **Proporção nunca aparece sem o n.** Com 2 observações, "50%" e "100%" são
 * ruído, e um número desses convida a uma conclusão que o dado não sustenta —
 * o tipo de erro que vira decisão clínica ruim. Abaixo do mínimo, a faixa é
 * marcada como insuficiente em vez de mostrar percentual.
 */
function Cruzamento({ titulo, faixas }: { titulo: string; faixas: Faixa[] }) {
  return (
    <section>
      <Titulo>{titulo}</Titulo>
      <ul className="flex flex-col gap-3">
        {faixas.map((faixa) => {
          const p = proporcao(faixa);
          const suficiente = temAmostraSuficiente(faixa);

          return (
            <li key={faixa.rotulo}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base">{faixa.rotulo}</span>
                <span className="text-sm tabular-nums text-texto-secundario">
                  {faixa.respondeu} de {faixa.total}
                  {p !== null && ` · ${Math.round(p * 100)}%`}
                  {!suficiente && ` · amostra pequena`}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded bg-superficie">
                <div
                  className={suficiente ? 'h-full bg-amarelo-sinal' : 'h-full bg-texto-secundario'}
                  style={{ width: `${(faixa.respondeu / Math.max(faixa.total, 1)) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-texto-secundario">
        Faixas com menos de {MINIMO_PARA_PROPORCAO} marcações não mostram percentual.
      </p>
    </section>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs tracking-[0.2em] text-texto-secundario uppercase">{children}</h2>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-superficie px-4 py-3">
      <dt className="text-xs tracking-wide text-texto-secundario uppercase">{rotulo}</dt>
      <dd className="mt-1 text-2xl font-medium tabular-nums">{valor}</dd>
    </div>
  );
}

function Botao({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-14 rounded-lg bg-superficie px-6 text-base font-medium"
    >
      {children}
    </button>
  );
}
