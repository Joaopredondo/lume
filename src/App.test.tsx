import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { beforeAll, describe, expect, it } from 'vitest';
import App from './App';
import { MODULOS } from './modulos/registro';

/**
 * Fumaça das duas camadas. O que importa aqui não é o visual, é o contrato:
 * entrar num módulo tem que apagar todo o chrome do cuidador, e `Esc` tem que
 * devolver o controle — é a única saída garantida para quem opera no escuro.
 */

beforeAll(() => {
  // jsdom não implementa nenhuma das APIs de tela. Elas já falham em silêncio
  // no código (ver nucleo/tela.ts), então basta não explodir aqui.
  Element.prototype.requestFullscreen = () => Promise.resolve();
  document.exitFullscreen = () => Promise.resolve();
});

function abrirPrimeiroModulo() {
  const primeiro = MODULOS[0];
  if (!primeiro) throw new Error('nenhum módulo registrado');
  fireEvent.click(screen.getByRole('button', { name: new RegExp(primeiro.nome) }));
  return primeiro;
}

describe('App', () => {
  it('abre na Camada Cuidador', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Início' })).toBeDefined();
  });

  it('lista os módulos que se registraram sozinhos', () => {
    render(<App />);
    for (const modulo of MODULOS) {
      expect(screen.getByRole('button', { name: new RegExp(modulo.nome) })).toBeDefined();
    }
    expect(MODULOS.length).toBeGreaterThan(0);
  });

  it('entra na Camada Estímulo sem nenhum chrome do cuidador', async () => {
    // Abrir um módulo abre a sessão antes, e isso é assíncrono (Dexie).
    render(<App />);
    abrirPrimeiroModulo();

    // Nada da interface do cuidador pode atravessar: nem título, nem lista de
    // módulos, nem ajustes.
    await waitFor(() => expect(screen.queryByRole('heading')).toBeNull());

    // A ÚNICA exceção é a saída. No teclado `Esc` resolve, mas no celular não
    // existe `Esc` — sem ela o módulo vira um beco sem saída (seção 6).
    const botoes = screen.queryAllByRole('button');
    expect(botoes).toHaveLength(1);
    expect(botoes[0]?.getAttribute('aria-label')).toMatch(/Sair da atividade/);
  });

  it('a saída no toque exige segurar, para a pessoa atendida não sair sem querer', async () => {
    render(<App />);
    abrirPrimeiroModulo();
    await waitFor(() => expect(screen.queryByRole('heading')).toBeNull());

    const sair = screen.getByRole('button', { name: /Sair da atividade/ });
    fireEvent.pointerDown(sair);
    fireEvent.pointerUp(sair);

    // Toque de relance não tira ninguém do módulo.
    expect(screen.queryByRole('heading', { name: 'Início' })).toBeNull();
  });

  it('volta para o cuidador com Esc', async () => {
    render(<App />);
    abrirPrimeiroModulo();
    await waitFor(() => expect(screen.queryByRole('heading')).toBeNull());

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('heading', { name: 'Início' })).toBeDefined();
  });

  it('reflete o Modo calmo no <html>, que é onde o CSS global lê', () => {
    render(<App />);
    expect(document.documentElement.dataset['calmo']).toBe('false');

    // A configuração fica atrás do botão de segurar; no teclado ele abre direto,
    // porque a trava é contra toque acidental da criança, não contra o cuidador.
    fireEvent.keyDown(screen.getByRole('button', { name: /Configuração/ }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('switch', { name: 'Modo calmo' }));

    expect(document.documentElement.dataset['calmo']).toBe('true');
  });

  it('a configuração não abre com um toque simples', () => {
    // É a razão de existir do botão: a criança mexendo no tablet não pode cair
    // na tela de ajustes sem querer.
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Configuração/ }));

    expect(screen.getByRole('heading', { name: 'Início' })).toBeDefined();
  });

  it('avisa quando o perfil ainda não foi calibrado', () => {
    render(<App />);
    expect(screen.getByText(/ainda não foi calibrado/)).toBeDefined();
  });
});
