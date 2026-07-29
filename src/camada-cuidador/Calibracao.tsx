import { useState } from 'react';
import { useStore } from '../dados/store';
import { CORES, type TokenDeCor } from '../dados/tipos';
import {
  LARGURA_CARTAO_MM,
  calibracaoEhPlausivel,
  grausParaPx,
  pxParaGraus,
  pxPorMmDoCartao,
} from '../nucleo/escala';
import { emSegundos } from '../nucleo/seguranca';
import { useDimensoes } from '../nucleo/useEscala';

/**
 * Calibração por perfil (seção 3.1).
 *
 * Sem isto, "gigante" é chute e o app não é instrumento nenhum. O objetivo é
 * descobrir o **menor tamanho em que houve resposta** e quais cores funcionam,
 * e guardar isso em graus de ângulo visual para valer em qualquer aparelho.
 *
 * Restrições herdadas da seção 4 e que valem aqui como em qualquer outra tela:
 * cada degrau entra com transição ≥800ms, a figura permanece visível entre
 * degraus (não pisca, não some e volta), e não há cronômetro, escore nem erro.
 * É observação do cuidador, não teste da pessoa atendida.
 */

type Passo = 'cartao' | 'distancia' | 'limiar' | 'cores' | 'fim';

/** Degraus de ângulo visual, do menor ao maior. */
const DEGRAUS_GRAUS = [1, 1.5, 2, 3, 4, 6, 8, 10, 12, 16, 20];

type Props = { aoConcluir: () => void };

export function Calibracao({ aoConcluir }: Props) {
  const [passo, setPasso] = useState<Passo>('cartao');

  const perfil = useStore((estado) => estado.perfil);
  const aparelho = useStore((estado) => estado.calibracaoAparelho);
  const definirCalibracaoAparelho = useStore((estado) => estado.definirCalibracaoAparelho);
  const atualizarPerfil = useStore((estado) => estado.atualizarPerfil);

  return (
    <section>
      <ol className="mb-8 flex flex-wrap gap-2 text-xs tracking-wide uppercase">
        {(['cartao', 'distancia', 'limiar', 'cores'] as const).map((nome, i) => (
          <li
            key={nome}
            className={`rounded px-3 py-1 ${
              passo === nome
                ? 'bg-amarelo-sinal text-tinta-preta'
                : 'bg-superficie text-texto-secundario'
            }`}
          >
            {i + 1}. {rotuloDoPasso(nome)}
          </li>
        ))}
      </ol>

      {passo === 'cartao' && (
        <PassoDoCartao
          pxPorMmAtual={aparelho?.pxPorMm ?? null}
          aoConfirmar={async (pxPorMm) => {
            await definirCalibracaoAparelho({ pxPorMm, calibradoEm: Date.now() });
            setPasso('distancia');
          }}
        />
      )}

      {passo === 'distancia' && (
        <PassoDaDistancia
          atual={perfil.distanciaUsoCm}
          aoConfirmar={async (distanciaUsoCm) => {
            await atualizarPerfil({ distanciaUsoCm });
            setPasso('limiar');
          }}
        />
      )}

      {passo === 'limiar' && (
        <PassoDoLimiar
          distanciaCm={perfil.distanciaUsoCm}
          pxPorMm={aparelho?.pxPorMm ?? null}
          aoConfirmar={async (limiarAngular) => {
            await atualizarPerfil({ limiarAngular });
            setPasso('cores');
          }}
        />
      )}

      {passo === 'cores' && (
        <PassoDasCores
          selecionadas={perfil.coresComResposta}
          aoConfirmar={async (coresComResposta) => {
            await atualizarPerfil({ coresComResposta });
            setPasso('fim');
          }}
        />
      )}

      {passo === 'fim' && (
        <div>
          <p className="text-lg">
            Calibração salva. O limiar vale para qualquer aparelho — em outra tela, refaça só o
            passo do cartão.
          </p>
          <Botao onClick={aoConcluir}>Voltar ao início</Botao>
        </div>
      )}
    </section>
  );
}

function rotuloDoPasso(passo: Passo): string {
  if (passo === 'cartao') return 'Tela';
  if (passo === 'distancia') return 'Distância';
  if (passo === 'limiar') return 'Tamanho';
  return 'Cores';
}

/**
 * Passo 1 — régua física.
 *
 * O navegador não expõe o tamanho real da tela e `devicePixelRatio` não
 * resolve isso. Encostar um cartão de banco (85,6 mm, padrão ISO/IEC 7810
 * ID-1) e ajustar até bater é o método confiável, e todo mundo tem um.
 */
function PassoDoCartao({
  pxPorMmAtual,
  aoConfirmar,
}: {
  pxPorMmAtual: number | null;
  aoConfirmar: (pxPorMm: number) => void;
}) {
  const [larguraPx, setLarguraPx] = useState(() =>
    Math.round((pxPorMmAtual ?? 3.8) * LARGURA_CARTAO_MM),
  );
  const pxPorMm = pxPorMmDoCartao(larguraPx);
  const valido = calibracaoEhPlausivel(pxPorMm);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Encoste um cartão na tela</h2>
      <p className="mt-2 max-w-prose text-texto-secundario">
        Qualquer cartão de banco serve — todos têm a mesma largura. Ajuste até a barra ficar
        exatamente do tamanho dele.
      </p>

      <div
        className="mt-8 rounded-lg bg-giz-branco"
        style={{ width: larguraPx, height: larguraPx / 1.586 }}
        aria-hidden
      />

      <input
        type="range"
        min={100}
        max={1400}
        value={larguraPx}
        onChange={(e) => setLarguraPx(Number(e.target.value))}
        className="mt-6 w-full max-w-lg"
        aria-label="Largura do cartão"
      />

      <p className="mt-3 text-sm text-texto-secundario tabular-nums">
        {pxPorMm.toFixed(2)} px por milímetro
        {!valido && ' — fora do esperado, confira o ajuste'}
      </p>

      <Botao onClick={() => aoConfirmar(pxPorMm)} desabilitado={!valido}>
        Confirmar
      </Botao>
    </div>
  );
}

/** Passo 2 — a que distância a pessoa fica da tela. Entra na conta do ângulo. */
function PassoDaDistancia({
  atual,
  aoConfirmar,
}: {
  atual: number;
  aoConfirmar: (cm: number) => void;
}) {
  const [cm, setCm] = useState(atual);

  return (
    <div>
      <h2 className="text-2xl font-semibold">Distância até a tela</h2>
      <p className="mt-2 max-w-prose text-texto-secundario">
        Meça do olho até a tela, na posição em que a sessão acontece de verdade.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <input
          type="range"
          min={15}
          max={300}
          value={cm}
          onChange={(e) => setCm(Number(e.target.value))}
          className="w-full max-w-lg"
          aria-label="Distância em centímetros"
        />
        <span className="text-2xl font-medium tabular-nums">{cm} cm</span>
      </div>

      <Botao onClick={() => aoConfirmar(cm)}>Confirmar</Botao>
    </div>
  );
}

/**
 * Passo 3 — o limiar.
 *
 * A figura cresce em degraus e o cuidador marca onde houve resposta. A figura
 * **permanece na tela** entre degraus: some-e-volta seria piscar, e piscar é
 * exatamente o que a regra 4.1 proíbe.
 */
function PassoDoLimiar({
  distanciaCm,
  pxPorMm,
  aoConfirmar,
}: {
  distanciaCm: number;
  pxPorMm: number | null;
  aoConfirmar: (graus: number) => void;
}) {
  const [indice, setIndice] = useState(0);
  const { menorDimensao } = useDimensoes();

  const graus = DEGRAUS_GRAUS[indice] ?? 1;
  const lado = pxPorMm
    ? Math.min(grausParaPx(graus, distanciaCm, pxPorMm), menorDimensao)
    : menorDimensao * 0.2;
  const grausReais = pxPorMm ? pxParaGraus(lado, distanciaCm, pxPorMm) : graus;
  const noMaximo = indice >= DEGRAUS_GRAUS.length - 1 || lado >= menorDimensao;

  return (
    <div>
      <h2 className="text-2xl font-semibold">Menor tamanho com resposta</h2>
      <p className="mt-2 max-w-prose text-texto-secundario">
        Aumente até perceber uma reação — olhar, virar a cabeça, aquietar. Sem pressa e sem certo ou
        errado: quem observa é você.
      </p>

      <div className="mt-8 grid min-h-64 place-items-center rounded-xl bg-tinta-preta ring-1 ring-superficie">
        <div
          className="rounded-full bg-amarelo-sinal"
          style={{
            width: lado,
            height: lado,
            // A figura nunca some entre degraus: só cresce, devagar.
            transitionProperty: 'width, height',
            transitionDuration: `${emSegundos('padrao')}s`,
            transitionTimingFunction: 'ease-out',
          }}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-sm text-texto-secundario tabular-nums">
        {grausReais.toFixed(1)}° · {Math.round(lado)} px
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Botao onClick={() => setIndice((i) => Math.max(0, i - 1))} secundario>
          Menor
        </Botao>
        <Botao
          onClick={() => setIndice((i) => Math.min(DEGRAUS_GRAUS.length - 1, i + 1))}
          secundario
          desabilitado={noMaximo}
        >
          Maior
        </Botao>
        <Botao onClick={() => aoConfirmar(grausReais)}>Houve resposta aqui</Botao>
      </div>
    </div>
  );
}

/** Passo 4 — quais cores tiveram resposta, já no tamanho calibrado. */
function PassoDasCores({
  selecionadas,
  aoConfirmar,
}: {
  selecionadas: TokenDeCor[];
  aoConfirmar: (cores: TokenDeCor[]) => void;
}) {
  const [marcadas, setMarcadas] = useState<TokenDeCor[]>(selecionadas);

  const alternar = (cor: TokenDeCor) =>
    setMarcadas((atuais) =>
      atuais.includes(cor) ? atuais.filter((c) => c !== cor) : [...atuais, cor],
    );

  return (
    <div>
      <h2 className="text-2xl font-semibold">Cores com resposta</h2>
      <p className="mt-2 max-w-prose text-texto-secundario">
        Marque as que provocaram reação. Só elas serão sorteadas nos módulos.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CORES.map((cor) => {
          const ativa = marcadas.includes(cor);
          return (
            <li key={cor}>
              <button
                type="button"
                aria-pressed={ativa}
                onClick={() => alternar(cor)}
                className={`flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-xl bg-tinta-preta ring-2 ${
                  ativa ? 'ring-giz-branco' : 'ring-superficie'
                }`}
              >
                <span
                  className="size-16 rounded-full"
                  style={{ backgroundColor: `var(--color-${cor})` }}
                />
                <span className="text-sm text-texto-secundario">{ativa ? 'sim' : 'não'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Botao onClick={() => aoConfirmar(marcadas)} desabilitado={marcadas.length === 0}>
        Concluir calibração
      </Botao>
    </div>
  );
}

function Botao({
  children,
  onClick,
  desabilitado,
  secundario,
}: {
  children: React.ReactNode;
  onClick: () => void;
  desabilitado?: boolean;
  secundario?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={`mt-6 min-h-14 rounded-lg px-6 text-base font-semibold disabled:opacity-40 ${
        secundario ? 'bg-superficie text-giz-branco' : 'bg-amarelo-sinal text-tinta-preta'
      }`}
    >
      {children}
    </button>
  );
}
