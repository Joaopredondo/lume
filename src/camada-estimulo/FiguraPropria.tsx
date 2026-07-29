import type { TokenDeCor } from '../dados/tipos';

type Props = {
  url: string;
  palavra: string;
  cor: TokenDeCor;
  tamanho: number;
};

/**
 * Silhueta vinda de uma foto cadastrada pelo cuidador.
 *
 * A imagem foi limiarizada em branco sobre transparente no cadastro. Aqui ela
 * é usada como **máscara**, não como `<img>`: assim a mesma figura é pintada
 * com a cor que o perfil confirmou, em vez de existir uma cópia por cor.
 */
export function FiguraPropria({ url, palavra, cor, tamanho }: Props) {
  return (
    <div
      role="img"
      aria-label={palavra}
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: `var(--color-${cor})`,
        maskImage: `url(${url})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${url})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
