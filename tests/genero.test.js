import { describe, expect, it } from 'vitest';
import { comporGenero, comporSexualidade, separarGenero, separarSexualidade } from '../src/utils/genero';

describe('gênero e sexualidade', () => {
  it('separa e compõe o gênero', () => {
    expect(separarGenero('Feminino')).toEqual({ genero: 'Feminino', generoOutro: '' });
    expect(separarGenero('Outro: agênero')).toEqual({ genero: 'Outro', generoOutro: 'agênero' });
    expect(separarGenero('Cisgênero')).toEqual({ genero: 'Outro', generoOutro: 'Cisgênero' });
    expect(separarGenero(null)).toEqual({ genero: '', generoOutro: '' });
    expect(comporGenero('Outro', ' agênero  fluido ')).toBe('Outro: agênero fluido');
    expect(comporGenero('Outro', '')).toBe('Outro');
    expect(comporGenero('Feminino', 'x')).toBe('Feminino');
    expect(comporGenero('', '')).toBe(null);
    expect(comporGenero('Outro', '<b>oi</b>')).toBe('Outro: boi/b');
  });
  it('separa e compõe a sexualidade (opcional)', () => {
    expect(separarSexualidade('Bissexual').sexualidade).toBe('Bissexual');
    expect(separarSexualidade('Outra: demissexual')).toEqual({ sexualidade: 'Outra', sexualidadeOutra: 'demissexual' });
    expect(comporSexualidade('', '')).toBe('');
    expect(comporSexualidade('Outra', 'demissexual')).toBe('Outra: demissexual');
  });
});
