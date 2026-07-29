import { useEffect, useState } from 'react';
import { definirVoz, vozesDisponiveis } from '../nucleo/fala';

/**
 * Vozes em pt-BR instaladas no aparelho.
 *
 * O navegador carrega a lista de forma assíncrona e dispara `voiceschanged`
 * quando termina — perguntar uma vez só costuma devolver lista vazia.
 */
export function useVozes(): {
  vozes: SpeechSynthesisVoice[];
  escolhida: string;
  escolher: (nome: string) => void;
} {
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);
  const [escolhida, setEscolhida] = useState('');

  useEffect(() => {
    const atualizar = () => setVozes(vozesDisponiveis());
    atualizar();

    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.addEventListener('voiceschanged', atualizar);
    return () => speechSynthesis.removeEventListener('voiceschanged', atualizar);
  }, []);

  useEffect(() => {
    if (escolhida || vozes.length === 0) return;
    setEscolhida(vozes[0]?.name ?? '');
  }, [vozes, escolhida]);

  return {
    vozes,
    escolhida,
    escolher: (nome) => {
      setEscolhida(nome);
      definirVoz(vozes.find((v) => v.name === nome) ?? null);
    },
  };
}
