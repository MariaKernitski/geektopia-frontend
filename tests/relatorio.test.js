import { describe, expect, it } from 'vitest';
import { comPercentual, contarFiltros, descricaoFiltros, filtrosAtivos, montarConsulta, paraCsv } from '../src/utils/relatorio';

describe('relatório', () => {
  it('monta a consulta só com o que foi preenchido', () => {
    expect(montarConsulta({ id_geektopia: '3', cidade: 'Castro', estado: '', base: 'participantes' })).toBe('id_geektopia=3&cidade=Castro');
    expect(montarConsulta({ base: 'cadastros' })).toBe('base=cadastros');
  });
  it('conta filtros ativos ignorando a base', () => {
    expect(contarFiltros({ cidade: 'X', estado: '', base: 'cadastros' })).toBe(1);
  });
  it('gera CSV de planilha: BOM, ponto e vírgula, vírgula decimal e sem fórmula', () => {
    const csv = paraCsv([['a', 'b'], ['=1+1', 2.5], ['x;y', 'z']]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain("'=1+1;2,5");
    expect(csv).toContain('"x;y";z');
  });
  it('descreve os filtros no cabeçalho do arquivo', () => {
    const l = descricaoFiltros({ id_geektopia: '3', cidade: 'Castro', base: 'participantes' }, { edicoes: [{ id: 3, nome: 'Geektopia 5' }] });
    expect(l.flat()).toContain('Geektopia 5');
    expect(l.flat()).toContain('Castro');
  });
  it('lista os filtros ativos com nome legível e formata percentuais', () => {
    const a = filtrosAtivos({ id_geektopia: '3', genero: 'Feminino', cidade: '', base: 'participantes' }, { edicoes: [{ id: 3, nome: 'Geektopia 5' }] });
    expect(a).toEqual([{ chave: 'id_geektopia', rotulo: 'Edição', valor: 'Geektopia 5' }, { chave: 'genero', rotulo: 'Gênero', valor: 'Feminino' }]);
    expect(comPercentual([{ rotulo: 'Feminino', percentual: 52.34 }])).toEqual(['Feminino · 52,3%']);
  });
});
