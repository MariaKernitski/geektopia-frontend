// Apoio do painel de relatórios: filtros da URL/consulta e exportação para planilha (CSV).

export const FILTROS_VAZIOS = { id_geektopia: '', de: '', ate: '', base: 'participantes', estado: '', cidade: '', genero: '', sexualidade: '', faixa: '' };

// Só manda para a API o que foi preenchido.
export function montarConsulta(filtros) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => { if (v && !(k === 'base' && v === 'participantes')) p.set(k, v); });
  return p.toString();
}

export const contarFiltros = (filtros) => Object.entries(filtros).filter(([k, v]) => v && k !== 'base').length;

const celula = (v) => {
  let t = v === null || v === undefined ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  if (/^[=+\-@\t\r]/.test(t) && typeof v !== 'number') t = `'${t}`;
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// CSV para Excel/Sheets em português: separador ";", BOM UTF-8, decimais com vírgula, sem risco de fórmula.
export const paraCsv = (linhas) => `\uFEFF${linhas.map((l) => l.map(celula).join(';')).join('\r\n')}\r\n`;

export function baixarCsv(nomeBase, linhas) {
  const blob = new Blob([paraCsv(linhas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeBase}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Linhas de "cabeçalho de contexto" que acompanham todo arquivo exportado, para o relatório dizer com quais filtros foi gerado.
export function descricaoFiltros(filtros, opcoes) {
  const ed = opcoes?.edicoes?.find((e) => String(e.id) === String(filtros.id_geektopia));
  const partes = [
    ['Base', filtros.base === 'cadastros' ? 'Todos os usuários cadastrados' : 'Participantes (quem tem ingresso)'],
    ['Edição', ed ? ed.nome : 'Todas'],
    ['Período da compra', filtros.de || filtros.ate ? `${filtros.de || 'início'} a ${filtros.ate || 'hoje'}` : 'Todo o período'],
    ['Estado', filtros.estado || 'Todos'],
    ['Cidade', filtros.cidade || 'Todas'],
    ['Gênero', filtros.genero || 'Todos'],
    ['Sexualidade', filtros.sexualidade || 'Todas'],
    ['Faixa etária', filtros.faixa || 'Todas']
  ];
  return [['Relatório NEXUS / CCPOP', `Gerado em ${new Date().toLocaleString('pt-BR')}`], ...partes.map(([a, b]) => [a, b]), []];
}

export const ROTULO_FILTRO = { id_geektopia: 'Edição', de: 'Compra de', ate: 'Compra até', estado: 'Estado', cidade: 'Cidade', genero: 'Gênero', sexualidade: 'Sexualidade', faixa: 'Faixa etária' };

// Filtros ativos como lista [{ chave, rotulo, valor }] para mostrar como etiquetas removíveis.
export function filtrosAtivos(filtros, opcoes) {
  return Object.entries(ROTULO_FILTRO)
    .filter(([k]) => filtros[k])
    .map(([k, rotulo]) => ({ chave: k, rotulo, valor: k === 'id_geektopia' ? (opcoes?.edicoes?.find((e) => String(e.id) === String(filtros[k]))?.nome || filtros[k]) : filtros[k] }));
}

// "Feminino · 52,3%": nome com o percentual, para a legenda dos gráficos de pizza.
export const comPercentual = (lista) => lista.map((x) => `${x.rotulo} · ${Number(x.percentual).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
