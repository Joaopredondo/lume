import type { TokenDeCor } from '../dados/tipos';

/** Formas geométricas sólidas da Camada Estímulo — sem contorno, sem detalhe. */
export type Formato = 'circulo' | 'quadrado' | 'triangulo';

export const FORMATOS: Formato[] = ['circulo', 'quadrado', 'triangulo'];

export const NOMES_DE_FORMA: Record<Formato, string> = {
  circulo: 'círculo',
  quadrado: 'quadrado',
  triangulo: 'triângulo',
};

export const NOMES_DE_COR: Record<TokenDeCor, string> = {
  'amarelo-sinal': 'amarelo',
  'laranja-sinal': 'laranja',
  'ciano-sinal': 'azul claro',
  'verde-sinal': 'verde',
  'magenta-sinal': 'rosa',
  'vermelho-sinal': 'vermelho',
  'azul-sinal': 'azul',
};

export function FormaGeometrica({
  formato,
  cor,
  lado,
}: {
  formato: Formato;
  cor: TokenDeCor;
  lado: number;
}) {
  const preenchimento = `var(--color-${cor})`;

  if (formato === 'triangulo') {
    return (
      <svg viewBox="0 0 100 100" width={lado} height={lado} aria-hidden>
        <path d="M50 6 96 92H4L50 6Z" fill={preenchimento} />
      </svg>
    );
  }

  return (
    <span
      aria-hidden
      style={{
        width: lado,
        height: lado,
        backgroundColor: preenchimento,
        borderRadius: formato === 'circulo' ? '50%' : 0,
      }}
    />
  );
}
