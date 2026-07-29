import { useEffect, useRef, type ReactNode } from 'react';
import { ProvedorDeAcoes } from './ProvedorDeAcoes';
import { FimDaVolta } from './FimDaVolta';
import { PainelDoCuidador } from './PainelDoCuidador';
import { definirEstimuloVigente, ouvirAtalhoDeMarcacao } from '../nucleo/eventos';
import { pararFala } from '../nucleo/fala';
import {
  bloquearGestos,
  entrarEmTelaCheia,
  manterTelaAcesa,
  sairDeTelaCheia,
  travarOrientacao,
} from '../nucleo/tela';

type Props = {
  aoSair: () => void;
  nomeDoModulo?: string;
  children: ReactNode;
};

/**
 * A tela que a pessoa atendida vê: fundo preto absoluto, tela cheia, sem chrome
 * nenhum. Entrar aqui é uma transição explícita de camada — nada da interface
 * do cuidador atravessa.
 *
 * O marcador de resposta (seção 8.1) é só tecla física: botão visível aqui
 * seria tocado sem querer pela própria pessoa atendida e contaminaria o dado.
 */
export function CamadaEstimulo({ aoSair, nomeDoModulo = '', children }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = container.current;
    if (!elemento) return;

    const liberarTela = manterTelaAcesa();
    const liberarGestos = bloquearGestos(elemento);
    // Marcação por tecla mora aqui, não em cada módulo: é a única forma de
    // registrar resposta com uma tela só, e vale para todos igualmente.
    const pararMarcacao = ouvirAtalhoDeMarcacao();
    void entrarEmTelaCheia(elemento);
    // Evita o giro acidental com o tablet na mão (seção 6). Falha em silêncio
    // no desktop e em boa parte do iOS, que não implementam.
    void travarOrientacao('landscape');

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoSair();
    };
    window.addEventListener('keydown', aoTeclar);

    return () => {
      liberarTela();
      liberarGestos();
      pararMarcacao();
      window.removeEventListener('keydown', aoTeclar);
      // Sair não pode deixar uma fala pendente falando por cima da tela seguinte,
      // nem um estímulo fantasma sendo marcado depois de fechado.
      pararFala();
      definirEstimuloVigente(null);
      void sairDeTelaCheia();
    };
  }, [aoSair]);

  return (
    <div
      ref={container}
      // touch-action e overscroll ficam SÓ aqui: a Camada Cuidador
      // continua zoomável e rolável (ver nucleo/tela.ts).
      className="fixed inset-0 touch-none select-none overscroll-none bg-tinta-preta font-estimulo"
      style={{ fontWeight: 800 }}
    >
      {/*
        No teclado, `Esc` sai e `S`/`N` marcam resposta. No celular não existe
        teclado — sem o painel, o módulo é um beco sem saída e o cuidador não
        registra nada, o que esvazia o histórico inteiro.
      */}
      <ProvedorDeAcoes>
        {children}
        <PainelDoCuidador aoSair={aoSair} />
        <FimDaVolta nomeDoModulo={nomeDoModulo} aoSair={aoSair} />
      </ProvedorDeAcoes>
    </div>
  );
}
