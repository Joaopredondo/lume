import { useEffect, useRef, useState } from 'react';
import { useStore } from '../dados/store';
import { MODULOS } from '../modulos/registro';
import {
  abrirEspelhoLocal,
  enderecoDoControle,
  type Mensagem,
  type Transporte,
} from '../nucleo/espelho';
import { abrirRemoto, temRede, type EstadoDoRemoto } from '../nucleo/remoto';
import type { EstimuloVigente } from '../nucleo/eventos';

/**
 * Superfície de controle (seção 8.1 e etapa 9).
 *
 * É aqui — e **só** aqui — que os dois botões grandes de marcação existem. Na
 * Camada Estímulo eles seriam tocados sem querer pela própria pessoa atendida,
 * contaminando exatamente o dado que se quer coletar. Com uma tela só, a
 * marcação continua sendo por tecla `S`/`N`.
 */
export function Controle() {
  const [estimulo, setEstimulo] = useState<EstimuloVigente | null>(null);
  const [moduloId, setModuloId] = useState<string | null>(null);
  const [estadoRemoto, setEstadoRemoto] = useState<EstadoDoRemoto>('desligado');
  const [codigo, setCodigo] = useState<string | null>(null);
  const [codigoDigitado, setCodigoDigitado] = useState('');

  const local = useRef<Transporte | null>(null);
  const remoto = useRef<Transporte | null>(null);

  const configuracoes = useStore((estado) => estado.configuracoes);
  const ajustar = useStore((estado) => estado.ajustar);

  useEffect(() => {
    const receber = (mensagem: Mensagem) => {
      if (mensagem.tipo !== 'estado') return;
      setModuloId(mensagem.moduloId);
      setEstimulo(mensagem.estimulo);
    };

    local.current = abrirEspelhoLocal(receber);
    local.current.enviar({ tipo: 'ola' });

    return () => {
      local.current?.fechar();
      local.current = null;
    };
  }, []);

  const enviar = (mensagem: Mensagem) => {
    local.current?.enviar(mensagem);
    remoto.current?.enviar(mensagem);
  };

  const ligarRemoto = async (codigoAlvo?: string) => {
    remoto.current?.fechar();
    remoto.current = await abrirRemoto(
      (mensagem) => {
        if (mensagem.tipo !== 'estado') return;
        setModuloId(mensagem.moduloId);
        setEstimulo(mensagem.estimulo);
      },
      (estado, novoCodigo) => {
        setEstadoRemoto(estado);
        if (novoCodigo) setCodigo(novoCodigo);
      },
      codigoAlvo,
    );
  };

  const nomeDoModulo = MODULOS.find((m) => m.id === moduloId)?.nome;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl bg-superficie p-5">
        <p className="text-xs tracking-[0.2em] text-texto-secundario uppercase">Na tela</p>
        <p className="mt-1 text-2xl font-semibold">{nomeDoModulo ?? 'Nada aberto'}</p>
        {estimulo && (
          <p className="mt-2 text-sm text-texto-secundario">
            {estimulo.cor} · {estimulo.tamanhoAngular.toFixed(1)}° · {estimulo.posicao}
          </p>
        )}
      </section>

      {/*
        Os dois botões grandes. Gravam com origem 'controle'; o atalho de
        teclado continua funcionando em paralelo, sem exclusividade.
      */}
      <section className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!estimulo}
          onClick={() => enviar({ tipo: 'marcar', respondeu: true })}
          className="min-h-40 rounded-2xl bg-verde-sinal text-2xl font-extrabold text-tinta-preta disabled:opacity-30 sm:text-3xl"
        >
          RESPONDEU
        </button>
        <button
          type="button"
          disabled={!estimulo}
          onClick={() => enviar({ tipo: 'marcar', respondeu: false })}
          className="min-h-40 rounded-2xl bg-superficie text-2xl font-extrabold text-giz-branco ring-4 ring-texto-secundario disabled:opacity-30 sm:text-3xl"
        >
          NÃO RESPONDEU
        </button>
      </section>

      <section>
        <Titulo>Trocar de módulo</Titulo>
        <div className="flex flex-wrap gap-3">
          {MODULOS.map((modulo) => (
            <button
              key={modulo.id}
              type="button"
              onClick={() => enviar({ tipo: 'abrir', moduloId: modulo.id })}
              className={`min-h-14 rounded-lg px-5 text-base font-medium ${
                modulo.id === moduloId
                  ? 'bg-amarelo-sinal text-tinta-preta'
                  : 'bg-superficie text-giz-branco'
              }`}
            >
              {modulo.nome}
            </button>
          ))}
          <button
            type="button"
            onClick={() => enviar({ tipo: 'sair' })}
            className="min-h-14 rounded-lg bg-superficie px-5 text-base font-medium"
          >
            Sair do módulo
          </button>
        </div>
      </section>

      <section>
        <Titulo>Ajustes rápidos</Titulo>
        <div className="flex flex-wrap gap-3">
          <Chave
            rotulo="Modo calmo"
            ligado={configuracoes.modoCalmo}
            aoAlternar={() => {
              const modoCalmo = !configuracoes.modoCalmo;
              ajustar({ modoCalmo });
              enviar({ tipo: 'ajustar', mudanca: { modoCalmo } });
            }}
          />
          <Chave
            rotulo="Lanterna"
            ligado={configuracoes.lanternaLigada}
            aoAlternar={() => {
              const lanternaLigada = !configuracoes.lanternaLigada;
              ajustar({ lanternaLigada });
              enviar({ tipo: 'ajustar', mudanca: { lanternaLigada } });
            }}
          />
          <Chave
            rotulo="Mudo"
            ligado={configuracoes.mudo}
            aoAlternar={() => {
              const mudo = !configuracoes.mudo;
              ajustar({ mudo });
              enviar({ tipo: 'ajustar', mudanca: { mudo } });
            }}
          />
        </div>
      </section>

      <section>
        <Titulo>Como conectar</Titulo>

        <div className="rounded-xl bg-superficie p-5">
          <p className="text-base font-medium">Mesma máquina — funciona offline</p>
          <p className="mt-2 max-w-prose text-sm text-texto-secundario">
            Abra <code className="text-giz-branco">{enderecoDoControle()}</code> numa segunda janela
            e deixe a primeira na TV. Não precisa de rede nem de servidor: a comunicação é entre
            abas do mesmo navegador.
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-superficie p-5">
          <p className="text-base font-medium">
            Dois aparelhos — <span className="text-amarelo-sinal">requer internet</span>
          </p>
          <p className="mt-2 max-w-prose text-sm text-texto-secundario">
            Navegador não conecta dois aparelhos sem um servidor de sinalização, então esta é a
            única parte do app que não funciona offline. Fica desligada por padrão.
          </p>

          {!temRede() && (
            <p className="mt-3 text-sm text-amarelo-sinal">
              Sem rede agora — use a opção de mesma máquina acima.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!temRede()}
              onClick={() => void ligarRemoto()}
              className="min-h-14 rounded-lg bg-superficie px-5 text-base font-medium ring-2 ring-texto-secundario disabled:opacity-40"
            >
              Gerar código
            </button>

            <input
              type="text"
              value={codigoDigitado}
              onChange={(e) => setCodigoDigitado(e.target.value)}
              placeholder="colar código"
              className="min-h-14 rounded-lg bg-tinta-preta px-4 text-base text-giz-branco ring-2 ring-texto-secundario"
            />
            <button
              type="button"
              disabled={!temRede() || codigoDigitado.trim() === ''}
              onClick={() => void ligarRemoto(codigoDigitado.trim())}
              className="min-h-14 rounded-lg bg-superficie px-5 text-base font-medium ring-2 ring-texto-secundario disabled:opacity-40"
            >
              Conectar
            </button>
          </div>

          {codigo && (
            <p className="mt-3 text-sm">
              Código deste aparelho: <code className="text-amarelo-sinal select-all">{codigo}</code>
            </p>
          )}
          <p className="mt-2 text-sm text-texto-secundario">Estado: {estadoRemoto}</p>
        </div>
      </section>
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs tracking-[0.2em] text-texto-secundario uppercase">{children}</h2>
  );
}

function Chave({
  rotulo,
  ligado,
  aoAlternar,
}: {
  rotulo: string;
  ligado: boolean;
  aoAlternar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={`min-h-14 rounded-lg px-5 text-base font-medium ${
        ligado ? 'bg-amarelo-sinal text-tinta-preta' : 'bg-superficie text-giz-branco'
      }`}
    >
      {rotulo}
    </button>
  );
}
