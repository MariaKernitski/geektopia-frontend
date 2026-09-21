import { describe, expect, it } from 'vitest';
import { contrasteComBranco, cssDoFundo, fundoInicial, fundoParaTexto, lerFundo, montarFundo } from '../src/utils/fundo';
import { partesDoTitulo } from '../src/utils/landingPadrao';

describe('fundo do banner (cor ou gradiente)', () => {
  it('lê cor lisa, gradiente e ângulo', () => {
    expect(lerFundo('#1D1C22')).toEqual({ cor1: '#1D1C22', cor2: null, angulo: 135 });
    expect(lerFundo('#0e7c78,#1d1c22,180')).toEqual({ cor1: '#0E7C78', cor2: '#1D1C22', angulo: 180 });
    expect(lerFundo('vermelho')).toBeNull();
    expect(lerFundo(null)).toBeNull();
  });
  it('gera o CSS e o texto guardado', () => {
    expect(cssDoFundo('#112233')).toBe('#112233');
    expect(cssDoFundo('#112233,#445566,90')).toBe('linear-gradient(90deg, #112233, #445566)');
    expect(montarFundo({ cor1: '#112233', cor2: null })).toBe('#112233');
    expect(fundoParaTexto({ modo: 'imagem', cor1: '#1', cor2: '#2', gradiente: true, angulo: 135 })).toBeNull();
    expect(fundoInicial({ banner_fundo: '#112233,#445566,90' }).modo).toBe('cor');
  });
  it('avisa quando as cores são claras demais para texto branco', () => {
    expect(contrasteComBranco('#FFFFFF')).toBeLessThan(3);
    expect(contrasteComBranco('#16151A')).toBeGreaterThan(10);
  });
});

describe('título da landing com destaque', () => {
  it('separa o trecho entre asteriscos', () => {
    expect(partesDoTitulo('A cena *geek e pop* de PG')).toEqual([
      { texto: 'A cena ', destaque: false }, { texto: 'geek e pop', destaque: true }, { texto: ' de PG', destaque: false }
    ]);
    expect(partesDoTitulo('Sem destaque')).toEqual([{ texto: 'Sem destaque', destaque: false }]);
  });
});
