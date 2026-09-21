import { describe, expect, it } from 'vitest';
import { crc32, gerarXlsx } from '../src/utils/xlsx';

const texto = (b) => new TextDecoder().decode(b);

describe('xlsx', () => {
  it('calcula o CRC32 padrão', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('gera um zip com as partes obrigatórias e uma aba por planilha', () => {
    const bin = gerarXlsx([{ nome: 'Cidades', linhas: [['Grupo', 'Pessoas'], ['Ponta Grossa - PR', 20]] }, { nome: 'Gênero', linhas: [['x', 1.5]] }]);
    expect(bin[0]).toBe(0x50);
    expect(bin[1]).toBe(0x4b);
    const t = texto(bin);
    for (const parte of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']) expect(t).toContain(parte);
    expect(t).toContain('name="Cidades"');
    expect(t).toContain('<v>20</v>');
    expect(t).toContain('<v>1.5</v>');
  });

  it('não interpreta texto como fórmula nem quebra o XML', () => {
    const t = texto(gerarXlsx([{ nome: 'A/B:C', linhas: [['=CMD()', '<b>&"x"</b>']] }]));
    expect(t).toContain('t="inlineStr"');
    expect(t).not.toContain('<f>');
    expect(t).toContain('&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
    expect(t).toContain('name="A B C"');
  });
});
