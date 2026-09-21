import { FiDownload } from 'react-icons/fi';

// Cartão do painel: título, gráfico (filhos) e a mesma informação em tabela, para leitura por leitor de tela e para conferência.
//   colunas [{ chave, rotulo, formato? }]   linhas [{...}]   aoBaixar: baixa esta tabela em Excel
export function CartaoDados({ titulo, subtitulo, colunas, linhas, aoBaixar, larga = false, filtravel = false, children }) {
  return (
    <section className={`dash-cartao ${larga ? 'is-larga' : ''}`} aria-label={titulo}>
      <header className="dash-cartao-topo">
        <div>
          <h3>{titulo}</h3>
          {subtitulo && <p>{subtitulo}</p>}
          {filtravel && linhas.length > 0 && <p className="dash-dica-clique">Clique numa barra ou fatia para filtrar todo o relatório.</p>}
        </div>
        {aoBaixar && linhas.length > 0 && (
          <button type="button" className="dash-btn-icone" onClick={aoBaixar} aria-label={`Baixar planilha: ${titulo}`} title="Baixar planilha (Excel)">
            <FiDownload aria-hidden="true" />
          </button>
        )}
      </header>

      {linhas.length === 0 ? <p className="dash-vazio">Sem dados para estes filtros.</p> : (
        <>
          {children}
          <details className="dash-tabela-detalhe">
            <summary>Ver em tabela ({linhas.length})</summary>
            <div className="dash-tabela-rolagem">
              <table>
                <thead><tr>{colunas.map((c) => <th key={c.chave} scope="col">{c.rotulo}</th>)}</tr></thead>
                <tbody>
                  {linhas.map((l, i) => <tr key={i}>{colunas.map((c) => <td key={c.chave}>{c.formato ? c.formato(l[c.chave]) : l[c.chave]}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
