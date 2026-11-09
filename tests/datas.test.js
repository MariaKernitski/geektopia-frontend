import { describe, expect, it } from 'vitest';
import { formatarDataCivil } from '../src/utils/datas';

describe('data de calendário', () => {
  it('mostra o dia gravado, sem recuar por causa do fuso', () => {
    expect(formatarDataCivil('1990-01-01T00:00:00.000Z')).toBe('01/01/1990');
    expect(formatarDataCivil('2000-02-13T00:00:00.000Z')).toBe('13/02/2000');
    expect(formatarDataCivil('')).toBe('');
  });
});
