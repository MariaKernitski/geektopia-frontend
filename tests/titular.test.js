import { describe, expect, it } from 'vitest';
import { documentoCanonico, idadeExigida, limiteDoLote, validarTitular } from '../src/utils/titular';

const valido = { nome: 'Ana Souza', tipoDoc: 'cpf', doc: '529.982.247-25', nasc: '1995-03-10' };

describe('validarTitular', () => {
  it('aceita um titular correto', () => {
    expect(validarTitular(valido)).toEqual({});
  });
  it('exige nome e sobrenome', () => {
    expect(validarTitular({ ...valido, nome: 'Ana' }).nome).toMatch(/sobrenome/);
    expect(validarTitular({ ...valido, nome: '' }).nome).toBeTruthy();
  });
  it('confere CPF e passaporte', () => {
    expect(validarTitular({ ...valido, doc: '123' }).documento).toMatch(/11 dígitos/);
    expect(validarTitular({ ...valido, tipoDoc: 'passaporte', doc: 'AB1234567' })).toEqual({});
    expect(validarTitular({ ...valido, tipoDoc: 'passaporte', doc: 'A1' }).documento).toBeTruthy();
  });
  it('recusa anos irreais (0000, 5+ dígitos, anos 1 a 3 dígitos)', () => {
    for (const nasc of ['0000-01-01', '0001-05-05', '131323-05-05', '1899-12-31', '95-03-10', '1995-02-30']) {
      expect(validarTitular({ ...valido, nasc }).nascimento, nasc).toBeTruthy();
    }
    expect(validarTitular({ ...valido, nasc: '1995-03-10' }).nascimento).toBeUndefined();
  });

  it('recusa nascimento no futuro, absurdo ou abaixo da idade mínima', () => {
    expect(validarTitular({ ...valido, nasc: '2999-01-01' }).nascimento).toMatch(/futuro/);
    expect(validarTitular({ ...valido, nasc: '1800-01-01' }).nascimento).toBeTruthy();
    expect(validarTitular({ ...valido, nasc: '2018-01-01' }, { minIdade: 14 }).nascimento).toMatch(/exige 14\+/);
    expect(validarTitular(valido, { minIdade: 14 })).toEqual({});
  });
});

describe('regras do lote', () => {
  it('meia-entrada tem limite 1 por padrão; o limite configurado vence', () => {
    expect(limiteDoLote({ categoria: 'Meia' })).toBe(1);
    expect(limiteDoLote({ categoria: 'Meia', limite_por_pessoa: 3 })).toBe(3);
    expect(limiteDoLote({ categoria: 'Inteira' })).toBeNull();
  });
  it('idade do lote ou, se não houver, a classificação da edição', () => {
    expect(idadeExigida({ idade_minima: 16 }, { classificacao_etaria: 12 })).toBe(16);
    expect(idadeExigida({ idade_minima: null }, { classificacao_etaria: 12 })).toBe(12);
    expect(idadeExigida({ idade_minima: null }, { classificacao_etaria: 0 })).toBeNull();
  });
  it('documento em forma canônica', () => {
    expect(documentoCanonico('cpf', '529.982.247-25')).toBe('52998224725');
    expect(documentoCanonico('passaporte', 'ab-123 45')).toBe('AB12345');
  });
});
