// Filtro de status em botões (em vez de um menu): mostra quantos há em cada situação
// e deixa trocar com um clique. Usado nas telas de análise de expositores e competidores.
const OPCOES = [
  { valor: 'EmAnalise', rotulo: 'Em análise' },
  { valor: 'Aprovado', rotulo: 'Aprovadas' },
  { valor: 'Reprovado', rotulo: 'Reprovadas' },
  { valor: '', rotulo: 'Todas' }
];

export function FiltroStatus({ valor, onChange, contagens }) {
  return (
    <div className="sol-filtro" role="group" aria-label="Filtrar por situação">
      {OPCOES.map((o) => (
        <button key={o.rotulo} type="button" className={`sol-filtro-btn ${valor === o.valor ? 'is-ativo' : ''}`} aria-pressed={valor === o.valor} onClick={() => onChange(o.valor)}>
          {o.rotulo}
          <span className="sol-filtro-qtd">{o.valor ? contagens[o.valor] || 0 : contagens.todas || 0}</span>
        </button>
      ))}
    </div>
  );
}
