import { describe, expect, it } from 'vitest';
import {
  LARGURA_CARTAO_MM,
  LIMIAR_PADRAO_GRAUS,
  calibracaoEhPlausivel,
  grausParaPx,
  pxParaGraus,
  pxPorMmDoCartao,
  tamanhoDoEstimulo,
} from './escala';
import { PERFIL_PADRAO, type CalibracaoDeAparelho, type Perfil } from '../dados/tipos';

/** Tablet comum: ~264 ppi ≈ 10,4 px/mm. */
const TABLET: CalibracaoDeAparelho = { pxPorMm: 10.4, calibradoEm: 0 };
/** TV 55" 4K: ~80 ppi ≈ 3,15 px/mm. */
const TV: CalibracaoDeAparelho = { pxPorMm: 3.15, calibradoEm: 0 };

function perfilCom(mudanca: Partial<Perfil>): Perfil {
  return { ...PERFIL_PADRAO, ...mudanca };
}

describe('calibração do aparelho pelo cartão', () => {
  it('converte a largura medida do cartão em px/mm', () => {
    // Cartão medindo 890px de largura num aparelho de ~10,4 px/mm.
    expect(pxPorMmDoCartao(890)).toBeCloseTo(890 / LARGURA_CARTAO_MM, 5);
  });

  it('rejeita medida implausível, que é arrasto acidental e não calibração', () => {
    expect(calibracaoEhPlausivel(pxPorMmDoCartao(5))).toBe(false);
    expect(calibracaoEhPlausivel(pxPorMmDoCartao(890))).toBe(true);
    expect(calibracaoEhPlausivel(Number.NaN)).toBe(false);
  });
});

describe('conversão de ângulo visual', () => {
  it('ida e volta são consistentes', () => {
    const px = grausParaPx(8, 45, TABLET.pxPorMm);
    expect(pxParaGraus(px, 45, TABLET.pxPorMm)).toBeCloseTo(8, 6);
  });

  it('dobrar a distância dobra o tamanho em pixels (ângulo pequeno)', () => {
    const perto = grausParaPx(5, 45, TABLET.pxPorMm);
    const longe = grausParaPx(5, 90, TABLET.pxPorMm);
    expect(longe / perto).toBeCloseTo(2, 6);
  });

  it('é o mesmo estímulo no tablet a 45cm e na TV a 200cm', () => {
    // O ponto inteiro de guardar em graus: o mesmo limiar produz tamanhos
    // físicos equivalentes em aparelhos completamente diferentes.
    const graus = 6;
    const noTablet = grausParaPx(graus, 45, TABLET.pxPorMm);
    const naTv = grausParaPx(graus, 200, TV.pxPorMm);

    // Tamanho físico em mm, que é o que o olho enxerga na sua distância.
    const mmNoTablet = noTablet / TABLET.pxPorMm;
    const mmNaTv = naTv / TV.pxPorMm;

    expect(mmNaTv / mmNoTablet).toBeCloseTo(200 / 45, 6);
    expect(pxParaGraus(naTv, 200, TV.pxPorMm)).toBeCloseTo(graus, 6);

    // E em pixels são números bem diferentes — por isso px não serve de baseline.
    expect(Math.round(noTablet)).not.toBe(Math.round(naTv));
  });
});

/** Menor dimensão de uma tela qualquer — o valor vem do viewport reativo. */
const TELA = 768;

describe('tamanhoDoEstimulo', () => {
  it('usa o limiar do perfil quando há calibração', () => {
    const perfil = perfilCom({ limiarAngular: 3, distanciaUsoCm: 45 });
    const esperado = grausParaPx(3, 45, TABLET.pxPorMm);
    expect(tamanhoDoEstimulo(perfil, TABLET, TELA)).toBeCloseTo(esperado, 6);
  });

  it('aplica o múltiplo sobre o ângulo, não sobre o pixel', () => {
    // Ângulo pequeno de propósito: dobrar não pode encostar no limite da tela,
    // senão o teste mediria o clamp em vez do múltiplo.
    const perfil = perfilCom({ limiarAngular: 3, distanciaUsoCm: 45 });
    const dobro = tamanhoDoEstimulo(perfil, TABLET, TELA, 2);
    expect(dobro).toBeCloseTo(grausParaPx(6, 45, TABLET.pxPorMm), 6);

    // E não é o mesmo que dobrar o pixel: a relação ângulo→px não é linear.
    const simples = tamanhoDoEstimulo(perfil, TABLET, TELA);
    expect(dobro).not.toBeCloseTo(simples * 2, 3);
  });

  it('cai no fallback conservador sem calibração de aparelho', () => {
    const perfil = perfilCom({ limiarAngular: null });

    // Errar para grande é seguro; errar para pequeno faz a pessoa parecer
    // não responsiva quando o problema é do app.
    expect(tamanhoDoEstimulo(perfil, null, TELA)).toBeCloseTo(TELA * 0.4, 6);
  });

  it('acompanha a tela: girar o tablet muda o tamanho', () => {
    // O motivo de a dimensão ser parâmetro e não leitura de window: lida uma
    // vez, o estímulo ficaria com o tamanho da orientação anterior.
    const perfil = perfilCom({ limiarAngular: null });
    const retrato = tamanhoDoEstimulo(perfil, null, 768);
    const paisagem = tamanhoDoEstimulo(perfil, null, 1024);

    expect(paisagem).toBeGreaterThan(retrato);
  });

  it('ignora calibração implausível e cai no fallback', () => {
    const perfil = perfilCom({ limiarAngular: 6 });
    const quebrada: CalibracaoDeAparelho = { pxPorMm: 0.01, calibradoEm: 0 };
    expect(tamanhoDoEstimulo(perfil, quebrada, TELA)).toBe(tamanhoDoEstimulo(perfil, null, TELA));
  });

  it('nunca devolve estímulo maior que a tela', () => {
    const perfil = perfilCom({ limiarAngular: 90, distanciaUsoCm: 200 });
    expect(tamanhoDoEstimulo(perfil, TABLET, TELA)).toBeLessThanOrEqual(TELA);
  });

  it('o padrão sem calibração nenhuma é o limiar conservador', () => {
    expect(PERFIL_PADRAO.limiarAngular).toBeNull();
    expect(LIMIAR_PADRAO_GRAUS).toBeGreaterThan(0);
  });
});
