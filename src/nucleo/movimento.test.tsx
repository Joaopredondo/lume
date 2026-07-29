import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EstimulacaoVisual } from '../modulos/estimulacao-visual/EstimulacaoVisual';
import { CausaEEfeito } from '../modulos/causa-e-efeito/CausaEEfeito';
import { useStore } from '../dados/store';
import { CONFIGURACOES_PADRAO } from '../dados/tipos';

afterEach(() => {
  useStore.setState({ configuracoes: { ...CONFIGURACOES_PADRAO } });
  vi.unstubAllGlobals();
});

function ligarModoCalmo() {
  useStore.setState({ configuracoes: { ...CONFIGURACOES_PADRAO, modoCalmo: true } });
}

describe('Modo calmo não pode acelerar animação', () => {
  it('o CSS global não impõe animation-duration', () => {
    // Foi um bug real: `animation-duration: 1s !important` em `*` transformava
    // a travessia de 12s em 1s — uma forma cruzando a tela a cada segundo, que
    // é o oposto de um modo calmo e um risco de estímulo repetitivo.
    // Em CSS só dá para impor duração fixa, e duração fixa acelera o que era
    // mais lento. Por isso a supressão de movimento vive em JS.
    const css = readFileSync(join(import.meta.dirname, '..', 'index.css'), 'utf8');

    const blocos = css.split('prefers-reduced-motion').slice(1).join('\n');
    const calmo = css.split("data-calmo='true'").slice(1).join('\n');

    expect(blocos).not.toMatch(/animation-duration/);
    expect(calmo).not.toMatch(/animation-duration/);
  });

  it('Estimulação visual não atravessa com Modo calmo ligado', () => {
    ligarModoCalmo();
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    const estilo = container.querySelector('[aria-hidden]')?.getAttribute('style') ?? '';

    expect(estilo).not.toContain('atravessar');
    expect(estilo).toContain('entrar-por-fade');
  });

  it('Estimulação visual atravessa normalmente sem Modo calmo', () => {
    const { container } = render(<EstimulacaoVisual posicao="centro" aoSair={() => {}} />);
    const estilo = container.querySelector('[aria-hidden]')?.getAttribute('style') ?? '';

    expect(estilo).toContain('atravessar');
  });

  it('Causa e efeito troca o crescimento por fade puro no Modo calmo', () => {
    ligarModoCalmo();
    const { container } = render(<CausaEEfeito posicao="centro" aoSair={() => {}} />);
    const area = container.firstElementChild;
    if (!area) throw new Error('container ausente');

    fireEvent.pointerDown(area);

    const estilo = area.firstElementChild?.getAttribute('style') ?? '';
    expect(estilo).toContain('surgir-e-sumir-calmo');
  });
});
