import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Calibracao } from './Calibracao';
import { BotaoSegurar, TEMPO_DE_ESPERA_MS } from './BotaoSegurar';
import { db } from '../dados/db';
import { useStore } from '../dados/store';
import { PERFIL_PADRAO } from '../dados/tipos';
import { LARGURA_CARTAO_MM } from '../nucleo/escala';

beforeEach(async () => {
  await db.perfis.clear();
  await db.aparelhos.clear();
  useStore.setState({
    perfil: { ...PERFIL_PADRAO, id: 'teste', nome: 'Teste' },
    perfis: [],
    calibracaoAparelho: null,
  });
});

afterEach(async () => {
  await db.perfis.clear();
  await db.aparelhos.clear();
});

function ajustarFaixa(rotulo: RegExp | string, valor: number) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: String(valor) } });
}

describe('calibração', () => {
  it('percorre os quatro passos e persiste o resultado', async () => {
    render(<Calibracao aoConcluir={() => {}} />);

    // 1. Cartão de banco → px/mm do aparelho.
    ajustarFaixa(/Largura do cartão/, 400);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    // 2. Distância de uso.
    await screen.findByText('Distância até a tela');
    ajustarFaixa(/Distância em centímetros/, 60);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    // 3. Limiar em graus.
    await screen.findByText('Menor tamanho com resposta');
    fireEvent.click(screen.getByRole('button', { name: 'Maior' }));
    fireEvent.click(screen.getByRole('button', { name: /Houve resposta aqui/ }));

    // 4. Cores com resposta.
    await screen.findByText('Cores com resposta');
    fireEvent.click(screen.getByRole('button', { name: /Concluir calibração/ }));

    await screen.findByText(/Calibração salva/);

    const estado = useStore.getState();
    expect(estado.calibracaoAparelho?.pxPorMm).toBeCloseTo(400 / LARGURA_CARTAO_MM, 5);
    expect(estado.perfil.distanciaUsoCm).toBe(60);
    expect(estado.perfil.limiarAngular).toBeGreaterThan(0);

    // Persistiu de verdade, não só no estado da tela.
    await waitFor(async () => {
      const salvo = await db.perfis.get('teste');
      expect(salvo?.limiarAngular).toBeGreaterThan(0);
    });
  });

  it('a calibração do aparelho é do aparelho, não do perfil', async () => {
    // px/mm descreve a tela. Guardar junto ao perfil faria o limiar viajar
    // errado quando a mesma pessoa fosse atendida na TV.
    render(<Calibracao aoConcluir={() => {}} />);
    ajustarFaixa(/Largura do cartão/, 400);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(async () => {
      expect(await db.aparelhos.get('este')).toBeDefined();
    });
    expect(Object.keys(useStore.getState().perfil)).not.toContain('pxPorMm');
  });

  it('recusa medida implausível do cartão', () => {
    render(<Calibracao aoConcluir={() => {}} />);
    ajustarFaixa(/Largura do cartão/, 100);

    const botao = screen.getByRole('button', { name: 'Confirmar' });
    expect(botao).toHaveProperty('disabled', true);
    expect(screen.getByText(/fora do esperado/)).toBeDefined();
  });

  it('a figura do limiar cresce sem nunca sumir entre degraus (regra 4.1)', async () => {
    render(<Calibracao aoConcluir={() => {}} />);
    ajustarFaixa(/Largura do cartão/, 400);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Distância até a tela');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await screen.findByText('Menor tamanho com resposta');

    const figura = () => document.querySelector('.bg-amarelo-sinal.rounded-full');
    const antes = figura();
    expect(antes).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Maior' }));

    // Mesmo nó, redimensionado por transição — não um nó novo, que seria piscar.
    expect(figura()).toBe(antes);
    expect(figura()?.getAttribute('style')).toContain('transition-duration');
  });

  it('não tem cronômetro, escore nem erro (regra 4.7)', async () => {
    const { container } = render(<Calibracao aoConcluir={() => {}} />);
    const texto = container.textContent ?? '';
    expect(texto).not.toMatch(/errou|erro|acerto|pontos|segundos restantes/i);
  });
});

describe('BotaoSegurar', () => {
  it('não dispara com um toque simples', () => {
    let chamou = false;
    render(<BotaoSegurar rotulo="Abrir" aoCompletar={() => (chamou = true)} />);

    fireEvent.pointerDown(screen.getByRole('button'));
    fireEvent.pointerUp(screen.getByRole('button'));

    expect(chamou).toBe(false);
  });

  it('teclado e acionador abrem direto', () => {
    // A trava é contra toque acidental da criança. Quem chega pelo teclado é o
    // cuidador, e "segurar" não é um gesto que acionador consiga fazer.
    let chamou = false;
    render(<BotaoSegurar rotulo="Abrir" aoCompletar={() => (chamou = true)} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(chamou).toBe(true);
  });

  it('a espera é de 3 segundos', () => {
    expect(TEMPO_DE_ESPERA_MS).toBe(3000);
  });
});
