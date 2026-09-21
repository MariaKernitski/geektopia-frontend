import '../style/Paginacao.css';

// Números da paginação com reticências: 1 … 4 5 [6] 7 8 … 20
function janela(atual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 3) [2, 3, 4].forEach((p) => paginas.add(p));
  if (atual >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => paginas.add(p));

  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const saida = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) saida.push('...');
    saida.push(p);
  });
  return saida;
}

// Paginação de listas grandes: "‹ 1 2 … 10 ›" mais "Mostrando 21–40 de 2.000".
export function Paginacao({ pagina, paginas, total, limite, onMudar, rotuloItens = 'itens' }) {
  if (total === 0) return null;

  const de = (pagina - 1) * limite + 1;
  const ate = Math.min(pagina * limite, total);

  return (
    <nav className="pg" aria-label="Paginação">
      <p className="pg-resumo">
        Mostrando <strong>{de.toLocaleString('pt-BR')}–{ate.toLocaleString('pt-BR')}</strong> de{' '}
        <strong>{total.toLocaleString('pt-BR')}</strong> {rotuloItens}
      </p>

      {paginas > 1 && (
        <ul className="pg-lista">
          <li>
            <button type="button" className="pg-btn" onClick={() => onMudar(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">‹</button>
          </li>
          {janela(pagina, paginas).map((p, i) => (
            <li key={`${p}-${i}`}>
              {p === '...' ? (
                <span className="pg-reticencias" aria-hidden="true">…</span>
              ) : (
                <button
                  type="button" className={`pg-btn ${p === pagina ? 'is-atual' : ''}`}
                  onClick={() => onMudar(p)} aria-label={`Página ${p}`} aria-current={p === pagina ? 'page' : undefined}
                >
                  {p}
                </button>
              )}
            </li>
          ))}
          <li>
            <button type="button" className="pg-btn" onClick={() => onMudar(pagina + 1)} disabled={pagina >= paginas} aria-label="Próxima página">›</button>
          </li>
        </ul>
      )}
    </nav>
  );
}
