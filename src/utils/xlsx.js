// Gerador mínimo de planilha .xlsx (Excel / LibreOffice / Google Planilhas), sem biblioteca.
// Números vão como números de verdade (não dependem do idioma do programa, ao contrário do CSV com vírgula decimal)
// e textos como texto literal: nada é interpretado como fórmula.
//
//   planilhas: [{ nome, linhas }]   linha = array de células
//   célula: texto | número | null | { v, b: true }  (b = negrito)

const enc = new TextEncoder();

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const CODIGOS_INVALIDOS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`, 'g');
const xml = (t) => String(t).replace(/[&<>"]/g, (c) => ESCAPES[c]).replace(CODIGOS_INVALIDOS, '');

const coluna = (i) => {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// Estilos: 0 normal, 1 negrito, 2 número 0,00, 3 negrito (texto).
const ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>';

function celulaXml(valor, ref) {
  const obj = valor !== null && typeof valor === 'object' ? valor : { v: valor };
  const v = obj.v;
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    const estilo = obj.b ? 1 : Number.isInteger(v) ? 0 : 2;
    return `<c r="${ref}" s="${estilo}"><v>${v}</v></c>`;
  }
  return `<c r="${ref}" s="${obj.b ? 3 : 0}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
}

function planilhaXml(linhas) {
  const larguras = [];
  const corpo = linhas.map((linha, r) => {
    const cels = linha.map((c, i) => {
      const t = c !== null && typeof c === 'object' ? c.v : c;
      larguras[i] = Math.min(60, Math.max(larguras[i] || 8, String(t ?? '').length + 2));
      return celulaXml(c, `${coluna(i)}${r + 1}`);
    }).join('');
    return `<row r="${r + 1}">${cels}</row>`;
  }).join('');
  const cols = larguras.length ? `<cols>${larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${corpo}</sheetData></worksheet>`;
}

const nomeAba = (nome, i) => (String(nome).replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Planilha ${i + 1}`);

function zip(arquivos) {
  const partes = [];
  const central = [];
  let deslocamento = 0;
  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  for (const { nome, dados } of arquivos) {
    const nomeB = enc.encode(nome);
    const crc = crc32(dados);
    const cab = Uint8Array.from([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(dados.length), ...u32(dados.length), ...u16(nomeB.length), ...u16(0)]);
    partes.push(cab, nomeB, dados);
    central.push(Uint8Array.from([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(dados.length), ...u32(dados.length), ...u16(nomeB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(deslocamento)]), nomeB);
    deslocamento += cab.length + nomeB.length + dados.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fim = Uint8Array.from([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(arquivos.length), ...u16(arquivos.length), ...u32(tamCentral), ...u32(deslocamento), ...u16(0)]);
  const todas = [...partes, ...central, fim];
  const saida = new Uint8Array(todas.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of todas) {
    saida.set(p, pos);
    pos += p.length;
  }
  return saida;
}

export function gerarXlsx(planilhas) {
  const abas = planilhas.map((p, i) => ({ ...p, nome: nomeAba(p.nome, i) }));
  const cabecalhoXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const arquivos = [
    { nome: '[Content_Types].xml', texto: `${cabecalhoXml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { nome: '_rels/.rels', texto: `${cabecalhoXml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { nome: 'xl/workbook.xml', texto: `${cabecalhoXml}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas.map((a, i) => `<sheet name="${xml(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { nome: 'xl/_rels/workbook.xml.rels', texto: `${cabecalhoXml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { nome: 'xl/styles.xml', texto: ESTILOS },
    ...abas.map((a, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, texto: planilhaXml(a.linhas) }))
  ].map((a) => ({ nome: a.nome, dados: enc.encode(a.texto) }));
  return zip(arquivos);
}

export function baixarXlsx(nomeBase, planilhas) {
  const blob = new Blob([gerarXlsx(planilhas)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeBase}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
