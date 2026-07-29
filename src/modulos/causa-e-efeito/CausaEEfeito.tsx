import { useCallback, useEffect, useRef, useState } from 'react';
import { Forma } from '../../camada-estimulo/Forma';
import { useStore } from '../../dados/store';
import type { TokenDeCor } from '../../dados/tipos';
import { somDeToque } from '../../nucleo/audio';
import { definirEstimuloVigente } from '../../nucleo/eventos';
import { ouvirAtivacao } from '../../nucleo/entrada';
import { useMovimentoReduzido } from '../../nucleo/movimento';
import { DURACAO, emSegundos } from '../../nucleo/seguranca';
import { useDimensoes, useTamanhoDoEstimulo } from '../../nucleo/useEscala';
import type { PropsDoModulo } from '../registro';

type Aparicao = { id: number; cor: TokenDeCor };

/**
 * Causa e efeito — o módulo mais simples e o mais importante.
 *
 * Tocar em qualquer lugar faz surgir uma forma gigante colorida com som macio,
 * que cresce e some.
 *
 * **A latência é o produto aqui.** A forma é inserida no DOM no mesmo tick do
 * `pointerdown`, com a animação de crescimento partindo dali. Se o aparecimento
 * esperasse a animação (regra 4.2: início ≤100ms, duração ≥800ms), a pessoa
 * não ligaria o toque ao efeito e o módulo perderia o sentido clínico.
 */
export function CausaEEfeito({ posicao }: PropsDoModulo) {
  const container = useRef<HTMLDivElement>(null);
  const [aparicoes, setAparicoes] = useState<Aparicao[]>([]);
  const proximoId = useRef(0);

  const perfil = useStore((estado) => estado.perfil);
  const reduzido = useMovimentoReduzido();
  const tamanho = useTamanhoDoEstimulo();
  const { largura, altura } = useDimensoes();

  const cores = perfil.coresComResposta;
  const lado = tamanho();

  const surgir = useCallback(() => {
    const cor = cores[Math.floor(Math.random() * cores.length)] ?? 'amarelo-sinal';
    const id = proximoId.current;
    proximoId.current += 1;

    setAparicoes((atuais) => [...atuais, { id, cor }]);
    somDeToque();

    definirEstimuloVigente({
      moduloId: 'causa-e-efeito',
      cor,
      tamanhoAngular: perfil.limiarAngular ?? 0,
      posicao,
      pesoFonte: perfil.pesoFonte,
    });

    window.setTimeout(() => {
      setAparicoes((atuais) => atuais.filter((a) => a.id !== id));
    }, DURACAO.fade);
  }, [cores, perfil.limiarAngular, perfil.pesoFonte, posicao]);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;
    // O container inteiro é o alvo: "tocar em qualquer lugar" da seção 6.
    return ouvirAtivacao(elemento, surgir);
  }, [surgir]);

  return (
    <div ref={container} tabIndex={-1} style={{ position: 'absolute', inset: 0 }}>
      {aparicoes.map((aparicao) => (
        <Forma
          key={aparicao.id}
          cor={aparicao.cor}
          tamanho={lado}
          posicao={posicao}
          largura={largura}
          altura={altura}
          estilo={{
            // Com movimento reduzido, a mesma aparição sem o `scale`: só fade.
            // O tempo é o mesmo, para o retorno ao toque não mudar de ritmo.
            animation: `${reduzido ? 'surgir-e-sumir-calmo' : 'surgir-e-sumir'} ${emSegundos(
              'fade',
            )}s ease-out both`,
          }}
        />
      ))}
    </div>
  );
}
