import { useEffect, useState } from 'react';
import { listarConteudo, type CategoriaDeConteudo, type ConteudoProprio } from './db';
import { useStore } from './store';

/**
 * Conteúdo cadastrado pelo cuidador, pronto para os módulos consumirem.
 *
 * O cadastro existia desde a etapa 8, mas nenhum módulo lia — era uma tela que
 * gravava no banco e parava ali. Palavra do repertório da pessoa atendida só
 * vira estímulo quando o Alfabeto e os Animais a incluem no rodízio.
 */
export type ItemProprio = ConteudoProprio & { url: string };

export function useConteudoProprio(categoria?: CategoriaDeConteudo): ItemProprio[] {
  const perfilId = useStore((estado) => estado.perfil.id);
  const [itens, setItens] = useState<ItemProprio[]>([]);

  useEffect(() => {
    let vivo = true;
    const urls: string[] = [];

    void listarConteudo(perfilId, categoria).then((registros) => {
      if (!vivo) return;
      setItens(
        registros.map((registro) => {
          const url = URL.createObjectURL(registro.imagem);
          urls.push(url);
          return { ...registro, url };
        }),
      );
    });

    return () => {
      vivo = false;
      // Blob sem revoke vaza memória a cada troca de perfil ou de módulo.
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [perfilId, categoria]);

  return itens;
}
