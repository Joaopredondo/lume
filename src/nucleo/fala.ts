/**
 * Fala (seção 7).
 *
 * Toda instrução do app é falada e curta — texto explicativo na Camada
 * Estímulo não serve para quem tem baixa visão extrema.
 */

export const VELOCIDADE_MINIMA = 0.6;
export const VELOCIDADE_MAXIMA = 1.2;
export const VELOCIDADE_PADRAO = 0.8;

let velocidade = VELOCIDADE_PADRAO;
let mudo = false;
let vozEscolhida: SpeechSynthesisVoice | null = null;

/** Fila própria: duas falas sobrepostas viram ruído ininteligível. */
const fila: string[] = [];
let falando = false;

function suportado(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function limitarVelocidade(valor: number): number {
  return Math.min(VELOCIDADE_MAXIMA, Math.max(VELOCIDADE_MINIMA, valor));
}

export function definirVelocidade(valor: number): void {
  velocidade = limitarVelocidade(valor);
}

export function velocidadeAtual(): number {
  return velocidade;
}

export function definirMudoDaFala(valor: boolean): void {
  mudo = valor;
  if (valor) pararFala();
}

/** Vozes em pt-BR disponíveis. Pode vir vazio até o navegador carregar a lista. */
export function vozesDisponiveis(): SpeechSynthesisVoice[] {
  if (!suportado()) return [];
  return speechSynthesis.getVoices().filter((voz) => voz.lang.toLowerCase().startsWith('pt'));
}

export function definirVoz(voz: SpeechSynthesisVoice | null): void {
  vozEscolhida = voz;
}

function proximaDaFila(): void {
  const texto = fila.shift();
  if (texto === undefined) {
    falando = false;
    return;
  }

  const enunciado = new SpeechSynthesisUtterance(texto);
  enunciado.lang = 'pt-BR';
  enunciado.rate = velocidade;
  if (vozEscolhida) enunciado.voice = vozEscolhida;

  // Sem voz pt-BR instalada o navegador simplesmente não fala. Degradar em
  // silêncio é melhor que travar a fila esperando um `end` que não vem.
  enunciado.onend = proximaDaFila;
  enunciado.onerror = proximaDaFila;

  speechSynthesis.speak(enunciado);
}

/** Enfileira uma fala. Devolve `false` se nada será dito. */
export function falar(texto: string): boolean {
  if (mudo || !suportado() || texto.trim() === '') return false;

  fila.push(texto);
  if (!falando) {
    falando = true;
    proximaDaFila();
  }
  return true;
}

/** Interrompe e esvazia a fila — usado ao sair de um módulo. */
export function pararFala(): void {
  fila.length = 0;
  falando = false;
  if (suportado()) speechSynthesis.cancel();
}

/** Só para os testes. */
export function reiniciarFala(): void {
  pararFala();
  velocidade = VELOCIDADE_PADRAO;
  mudo = false;
  vozEscolhida = null;
}

export function tamanhoDaFila(): number {
  return fila.length;
}
