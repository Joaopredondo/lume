/**
 * Som sintetizado (regra 4.5).
 *
 * Nada de samples: transiente agudo é justamente o que precisa ser evitado, e
 * arquivo gravado traz o ataque que o gravador quis, não o que a regra exige.
 * Senoide e triangular geradas em runtime dão controle total do envelope.
 */

/**
 * Ataque mínimo da regra 4.5. Abaixo disto o som tem um "clique" de início —
 * exatamente o tipo de transiente que sobressalta.
 */
export const ATAQUE_MINIMO_S = 0.15;

/** Acima disto o som fica estridente para quem é sensível. */
export const FREQUENCIA_MAXIMA_HZ = 4000;

const GANHO_MAXIMO = 0.35;

let contexto: AudioContext | null = null;
let limitador: DynamicsCompressorNode | null = null;
let mudo = false;

/**
 * O AudioContext só pode nascer dentro de um gesto do usuário (política de
 * autoplay), então é criado na primeira reprodução e reaproveitado.
 */
function garantirContexto(): AudioContext | null {
  if (contexto) {
    // Suspenso acontece quando a aba volta do segundo plano.
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  }

  if (typeof AudioContext === 'undefined') return null;

  contexto = new AudioContext();

  // Limitador no destino: nenhum bug de envelope pode virar um estouro no
  // ouvido de quem já está com o resto dos sentidos sob demanda.
  limitador = contexto.createDynamicsCompressor();
  limitador.threshold.value = -12;
  limitador.ratio.value = 20;
  limitador.attack.value = 0.003;
  limitador.release.value = 0.25;
  limitador.connect(contexto.destination);

  return contexto;
}

export function definirMudo(valor: boolean): void {
  mudo = valor;
}

export function estaMudo(): boolean {
  return mudo;
}

export type OpcoesDeSom = {
  frequenciaHz?: number;
  duracaoS?: number;
  tipo?: 'sine' | 'triangle';
  ganho?: number;
};

/**
 * Toca uma nota macia. Devolve `false` quando nada soou — mudo, sem suporte,
 * ou contexto bloqueado —, para quem chama não fingir que houve retorno sonoro.
 */
export function tocar(opcoes: OpcoesDeSom = {}): boolean {
  if (mudo) return false;

  const ctx = garantirContexto();
  if (!ctx || !limitador) return false;

  const { frequenciaHz = 440, duracaoS = 0.9, tipo = 'sine', ganho = GANHO_MAXIMO } = opcoes;

  const oscilador = ctx.createOscillator();
  oscilador.type = tipo;
  oscilador.frequency.value = Math.min(frequenciaHz, FREQUENCIA_MAXIMA_HZ);

  const envelope = ctx.createGain();
  const agora = ctx.currentTime;

  // O ataque nunca pode comer mais que metade da nota, senão um som curto
  // acabaria antes de chegar ao volume e viraria um clique.
  const ataque = Math.min(ATAQUE_MINIMO_S, duracaoS / 2);
  const alvo = Math.min(ganho, GANHO_MAXIMO);

  envelope.gain.setValueAtTime(0, agora);
  envelope.gain.linearRampToValueAtTime(alvo, agora + ataque);
  // Decaimento exponencial nunca chega a zero: o valor final é um piso audível
  // mínimo, e o `setValueAtTime` seguinte é que corta de fato.
  envelope.gain.exponentialRampToValueAtTime(0.0001, agora + duracaoS);

  oscilador.connect(envelope);
  envelope.connect(limitador);

  oscilador.start(agora);
  oscilador.stop(agora + duracaoS);
  oscilador.onended = () => {
    oscilador.disconnect();
    envelope.disconnect();
  };

  return true;
}

/** Retorno de toque: nota grave e curta, sem brilho. */
export function somDeToque(): boolean {
  return tocar({ frequenciaHz: 320, duracaoS: 0.9, tipo: 'sine' });
}

/** Conclusão de atividade. Ainda macio — a regra 4.7 proíbe comemoração espalhafatosa. */
export function somDeConclusao(): boolean {
  return tocar({ frequenciaHz: 392, duracaoS: 1.2, tipo: 'triangle' });
}

/** Só para os testes: o contexto é global e vaza entre casos. */
export function reiniciarAudio(): void {
  void contexto?.close();
  contexto = null;
  limitador = null;
  mudo = false;
}
