// Classificação indicativa (faixa etária) das edições.
// 0 = livre; nulo/indefinido = a diretoria não informou.

export const OPCOES_CLASSIFICACAO = [
  { valor: '', rotulo: 'Não informada' },
  { valor: '0', rotulo: 'Livre para todos os públicos' },
  { valor: '10', rotulo: '10 anos' },
  { valor: '12', rotulo: '12 anos' },
  { valor: '14', rotulo: '14 anos' },
  { valor: '16', rotulo: '16 anos' },
  { valor: '18', rotulo: '18 anos' }
];

// Texto curto para selos: "Livre" ou "14+". Devolve null se não houver.
export function seloClassificacao(faixa) {
  if (faixa === null || faixa === undefined) return null;
  return faixa === 0 ? 'Livre' : `${faixa}+`;
}

// Texto para leitores de tela e tooltips.
export function descricaoClassificacao(faixa) {
  if (faixa === null || faixa === undefined) return '';
  return faixa === 0 ? 'Classificação livre' : `Classificação indicativa: ${faixa} anos`;
}
