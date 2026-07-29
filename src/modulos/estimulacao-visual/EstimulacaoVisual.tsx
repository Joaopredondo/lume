import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../dados/store';
import type { TokenDeCor } from '../../dados/tipos';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { criarLanterna, type Lanterna } from '../../nucleo/lanterna';
import { useMovimentoReduzido } from '../../nucleo/movimento';
import { DURACAO, emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import type { PropsDoModulo } from '../registro';

/**
 * Estimulação visual — módulo passivo.
 *
 * Uma forma sólida atravessa a tela devagar, trocando de cor a cada travessia.
 * A pessoa não precisa fazer nada; quem observa é o cuidador, que marca a
 * resposta com S/N.
 *
 * **Por que travessias encadeadas e não uma animação em laço**: a regra 4.1
 * permitiria um laço aqui (só `transform`, período de 12s), mas encadear é
 * melhor de qualquer forma — cada travessia termina de fato, e é nesse intervalo
 * que a cor troca por fade. Também mantém a lanterna como única animação
 * contínua do app, que é o que o teste de segurança verifica.
 */
export function EstimulacaoVisual({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const alvoDaLanterna = useRef<HTMLDivElement>(null);
  const lanterna = useRef<Lanterna | null>(null);

  const perfil = useStore((estado) => estado.perfil);
  const lanternaLigada = useStore((estado) => estado.configuracoes.lanternaLigada);
  const reduzido = useMovimentoReduzido();
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const cores = perfil.coresComResposta;
  const lado = tamanho();

  const [travessia, setTravessia] = useState(0);
  const [cor, setCor] = useState<TokenDeCor>(() => cores[0] ?? 'amarelo-sinal');

  // Uma travessia terminou: sorteia a próxima cor e recomeça. O `key` no
  // elemento reinicia a animação sem precisar de laço.
  const concluirTravessia = useCallback(() => {
    const proxima = cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal';
    setCor(proxima);
    setTravessia((n) => n + 1);
  }, [cores]);

  /**
   * O elemento roda duas animações ao mesmo tempo — a travessia e o fade de
   * entrada — e `animationend` dispara para cada uma. Sem filtrar pelo nome, o
   * fim do fade (2s) reiniciaria a travessia (12s): a forma nunca completaria o
   * percurso e a cor trocaria a cada 2s, que é 0,5 Hz e viola a regra 4.1.
   */
  const aoTerminarAnimacao = useCallback(
    (evento: { animationName: string }) => {
      if (evento.animationName !== 'atravessar') return;
      concluirTravessia();
    },
    [concluirTravessia],
  );

  /**
   * Com movimento reduzido não há travessia, então não há `animationend` de
   * onde encadear. A cor troca por tempo — e o intervalo é o mesmo da
   * travessia, nunca o do fade, para respeitar o teto de 0,33 Hz da regra 4.1.
   */
  useEffect(() => {
    if (!reduzido) return;
    const timer = window.setInterval(concluirTravessia, DURACAO.travessia);
    return () => window.clearInterval(timer);
  }, [reduzido, concluirTravessia]);

  useEffect(() => {
    definirEstimuloVigente({
      moduloId: 'estimulacao-visual',
      cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });
  }, [cor, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  useEffect(() => {
    const alvo = alvoDaLanterna.current;
    if (!alvo || !lanternaLigada) return;

    lanterna.current = criarLanterna(alvo, { raio: lado / 2, suavidadeDaBorda: 0.6 });
    return () => {
      lanterna.current?.parar();
      lanterna.current = null;
    };
  }, [lanternaLigada, lado]);

  // A trajetória é horizontal e passa pela altura da posição escolhida, para o
  // módulo respeitar a preferência de campo visual do perfil (seção 3.2).
  const alturaDaFaixa = faixaVertical(posicao, altura, lado);

  return (
    <div ref={container} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div ref={alvoDaLanterna} style={{ position: 'absolute', inset: 0 }}>
        <div
          key={travessia}
          aria-hidden
          onAnimationEnd={aoTerminarAnimacao}
          style={{
            position: 'absolute',
            top: alturaDaFaixa,
            left: 0,
            width: lado,
            height: lado,
            borderRadius: '50%',
            backgroundColor: `var(--color-${cor})`,
            // Só transform: nenhuma propriedade que force reflow, e nenhuma
            // mudança de luminância global (regra 4.1).
            //
            // Com movimento reduzido a forma não atravessa: fica parada e só
            // troca de cor por fade. Acelerar a travessia seria o oposto do
            // que o Modo calmo significa — ver nucleo/movimento.ts.
            animation: reduzido
              ? `entrar-por-fade ${emSegundos('fade')}s ease-out both`
              : `atravessar ${emSegundos('travessia')}s linear both,` +
                ` entrar-por-fade ${emSegundos('fade')}s ease-out both`,
            // A forma entra rente à borda esquerda e sai rente à direita.
            ['--entrada' as string]: `${-lado}px`,
            ['--saida' as string]: `${largura}px`,
          }}
        />
      </div>
    </div>
  );
}

/** Onde a faixa horizontal passa, dado o eixo vertical da posição preferida. */
function faixaVertical(posicao: PropsDoModulo['posicao'], altura: number, lado: number): number {
  const fracao = posicao.startsWith('q')
    ? posicao === 'q1' || posicao === 'q2'
      ? 0.25
      : 0.75
    : posicao === 'superior'
      ? 0.25
      : posicao === 'inferior'
        ? 0.75
        : 0.5;

  return Math.min(Math.max(altura * fracao - lado / 2, 0), Math.max(altura - lado, 0));
}
