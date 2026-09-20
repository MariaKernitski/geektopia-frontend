import { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import api from '../services/api';
import '../style/Dashboard.css';

// Uma barra horizontal simples (sem biblioteca de gráfico) para cada linha
// do relatório: nome, quantidade, percentual e uma barrinha proporcional.
function BarraLista({ titulo, itens }) {
  return (
    <div className="dash-card">
      <h3 className="dash-card-title">{titulo}</h3>

      {itens.length === 0 && <p className="dash-vazio">Sem dados suficientes ainda.</p>}

      {itens.map((item) => (
        <div className="dash-linha" key={item.chave}>
          <div className="dash-linha-topo">
            <span className="dash-linha-label">{item.chave}</span>
            <span className="dash-linha-valor">{item.quantidade} ({item.percentual}%)</span>
          </div>
          <div className="dash-barra-fundo">
            <div className="dash-barra-preenchida" style={{ width: `${item.percentual}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/auth/admin/relatorio-demografico')
      .then((res) => setDados(res.data))
      .catch((err) => setErro(err.response?.data?.error || 'Erro ao carregar o relatório.'));
  }, []);

  return (
    <div className="dash-page">
      <div className="dash-shell">

        <div className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard e Relatórios</h1>
            <p className="dash-sub">Perfil demográfico dos usuários cadastrados no NEXUS.</p>
          </div>

          <div className="dash-header-direita">
            {dados && (
              <div className="dash-total">
                <span className="dash-total-num">{dados.total_usuarios}</span>
                <span className="dash-total-label">usuários cadastrados</span>
              </div>
            )}

            {dados && (
              <button type="button" className="btn btn-secondary dash-btn-exportar" onClick={() => window.print()}>
                <FiDownload /> Exportar para PDF
              </button>
            )}
          </div>
        </div>

        {erro && <div className="dash-erro" role="status">{erro}</div>}

        {!dados && !erro && <p className="dash-carregando">Carregando relatório...</p>}

        {dados && (
          <div className="dash-grid">
            <BarraLista titulo="Faixa etária" itens={dados.por_faixa_etaria} />
            <BarraLista titulo="Gênero" itens={dados.por_genero} />
            <BarraLista titulo="Sexualidade" itens={dados.por_sexualidade} />
            <BarraLista titulo="Cidade" itens={dados.por_cidade} />
          </div>
        )}

      </div>
    </div>
  );
}
