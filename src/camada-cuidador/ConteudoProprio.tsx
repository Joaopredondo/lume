import { useEffect, useState } from 'react';
import { db, listarConteudo, type ConteudoProprio as Registro } from '../dados/db';
import { useStore } from '../dados/store';
import { fotoParaSilhueta } from '../nucleo/silhueta-de-foto';

/**
 * Conteúdo próprio: palavras do repertório da pessoa atendida, com a figura
 * que faz sentido para ela.
 *
 * A foto **nunca entra crua**. Detalhe fino, textura e gradiente são o que a
 * baixa visão extrema não resolve, então a imagem é limiarizada em massa sólida
 * de cor única antes de ser guardada — a mesma linguagem dos cartões físicos.
 */
export function ConteudoProprio() {
  const perfil = useStore((estado) => estado.perfil);
  const [itens, setItens] = useState<Registro[]>([]);
  const [palavra, setPalavra] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = () => void listarConteudo(perfil.id).then(setItens);

  useEffect(recarregar, [perfil.id]);

  const cadastrar = async (arquivo: File) => {
    setProcessando(true);
    setErro(null);

    try {
      const imagem = await fotoParaSilhueta(arquivo);
      await db.conteudo.put({
        id: crypto.randomUUID(),
        perfilId: perfil.id,
        palavra: palavra.trim(),
        imagem,
        criadoEm: Date.now(),
      });
      setPalavra('');
      recarregar();
    } catch {
      setErro('Não consegui gerar a silhueta dessa foto. Tente outra.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-base text-texto-secundario">
        Palavras do repertório da pessoa atendida, com a figura que faz sentido para ela. Depois de
        cadastradas, entram no rodízio dos módulos <span className="text-giz-branco">Alfabeto</span>{' '}
        e <span className="text-giz-branco">Animais</span> do perfil{' '}
        <span className="text-giz-branco">{perfil.nome}</span>.
      </p>

      <div className="rounded-xl bg-superficie/60 p-5 ring-1 ring-texto-secundario/20 sm:p-6">
        <label className="block">
          <span className="text-base font-medium">Palavra</span>
          <input
            type="text"
            value={palavra}
            onChange={(e) => {
              setPalavra(e.target.value);
              // Sem isto, o aviso continuava na tela depois de corrigido —
              // parecia que o cadastro estava travado.
              if (erro) setErro(null);
            }}
            placeholder="mamãe, cachorro, mamadeira…"
            className="mt-2 min-h-14 w-full max-w-md rounded-lg bg-tinta-preta px-4 text-lg text-giz-branco ring-2 ring-texto-secundario/40 focus:ring-amarelo-sinal"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label
            className={`inline-flex min-h-14 items-center rounded-lg px-6 text-base font-semibold ${
              palavra.trim() && !processando
                ? 'cursor-pointer bg-amarelo-sinal text-tinta-preta'
                : 'cursor-not-allowed bg-superficie text-texto-secundario'
            }`}
          >
            {processando ? 'Processando…' : 'Escolher foto'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={processando || !palavra.trim()}
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) void cadastrar(arquivo);
                e.target.value = '';
              }}
            />
          </label>

          {!palavra.trim() && (
            <span className="text-sm text-texto-secundario">
              Escreva a palavra para liberar a foto.
            </span>
          )}
        </div>

        {erro && <p className="mt-4 text-base text-vermelho-sinal">{erro}</p>}

        <p className="mt-4 max-w-prose text-sm text-texto-secundario">
          A foto é convertida em silhueta de cor única, sem detalhe interno — foto crua não serve
          para baixa visão extrema. Imagens com o objeto bem separado do fundo funcionam melhor.
        </p>
      </div>

      {itens.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {itens.map((item) => (
            <li key={item.id} className="rounded-xl bg-superficie p-4">
              <div className="grid h-28 place-items-center rounded-lg bg-tinta-preta">
                <Previa imagem={item.imagem} palavra={item.palavra} />
              </div>
              <p className="mt-3 text-base font-medium">{item.palavra}</p>
              <button
                type="button"
                onClick={() => void db.conteudo.delete(item.id).then(recarregar)}
                className="mt-2 min-h-14 text-sm text-texto-secundario underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A silhueta é guardada em branco e pintada na hora — a mesma imagem serve
 * qualquer cor que o perfil tenha confirmado.
 */
function Previa({ imagem, palavra }: { imagem: Blob; palavra: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const endereco = URL.createObjectURL(imagem);
    setUrl(endereco);
    return () => URL.revokeObjectURL(endereco);
  }, [imagem]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={palavra}
      className="max-h-24 max-w-full"
      style={{
        // A máscara pinta a silhueta com o token, em vez de guardar uma cópia
        // por cor.
        backgroundColor: 'var(--color-amarelo-sinal)',
        maskImage: `url(${url})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  );
}
