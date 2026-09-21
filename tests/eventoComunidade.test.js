import { describe, expect, it } from 'vitest';
import { validarEventoComunidade } from '../src/utils/eventoComunidade';

const ok = { nome_evento: 'Festival', data_evento: '2999-01-01', local: 'Ginásio', descricao: 'Legal', url_saiba_mais: 'https://x.com' };
const ano = new Date().getFullYear() + 1;

describe('validarEventoComunidade', () => {
  it('aceita evento válido', () => {
    expect(validarEventoComunidade({ ...ok, data_evento: `${ano}-06-10` })).toEqual({});
  });
  it('recusa datas irreais e passadas', () => {
    for (const d of ['0000-01-01', '131323-05-05', '2020-01-01', '2999-01-01']) {
      expect(validarEventoComunidade({ ...ok, data_evento: d }).data_evento, d).toBeTruthy();
    }
  });
  it('recusa término antes do início e link perigoso', () => {
    expect(validarEventoComunidade({ ...ok, data_evento: `${ano}-06-10`, data_fim: `${ano}-06-09` }).data_fim).toBeTruthy();
    expect(validarEventoComunidade({ ...ok, data_evento: `${ano}-06-10`, url_saiba_mais: 'javascript:alert(1)' }).url_saiba_mais).toBeTruthy();
  });
  it('exige o link para avaliação', () => {
    expect(validarEventoComunidade({ ...ok, data_evento: `${ano}-06-10`, url_saiba_mais: '' }).url_saiba_mais).toBeTruthy();
  });
  it('exige campos obrigatórios', () => {
    const e = validarEventoComunidade({});
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['nome_evento', 'data_evento', 'local', 'descricao']));
  });
});
