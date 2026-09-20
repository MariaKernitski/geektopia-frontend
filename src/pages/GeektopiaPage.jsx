import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Cronometro } from '../components/Cronometro';
import '../style/GeektopiaPage.css';

export function GeektopiaPage() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/geektopia')
      .then(res => setEventos(res.data))
      .catch(() => setErro('Não foi possível carregar os eventos agora.'))
      .finally(() => setCarregando(false));
  }, []);

  const principal = eventos.find(ev => ev.tipo_edicao === 'Principal');
  const pockets = eventos.filter(ev => ev.tipo_edicao !== 'Principal');

  if (carregando) {
    return <div className="geektopia-page"><p className="geektopia-loading">Carregando eventos...</p></div>;
  }

  return (
    <div className="geektopia-page">

      {principal ? (
        <section className="geektopia-hero">
          <div className="geektopia-hero-grid">
            <div>
              <p className="geektopia-eyebrow">GEEKTOPIA Principal</p>
              <h1 className="geektopia-hero-title">{principal.nome_edicao}</h1>
              {principal.local && <p className="geektopia-hero-local">{principal.local}</p>}
              <Link to={`/geektopia/${principal.id_geektopia}`} className="btn btn-primary">
                Ver detalhes e ingressos
              </Link>
            </div>
            <div className="geektopia-hero-divider" />
            <div className="geektopia-panel">
              <div className="geektopia-panel-label">Contagem regressiva</div>
              <Cronometro dataAlvo={principal.data_inicio ? new Date(principal.data_inicio) : undefined} />
            </div>
          </div>
        </section>
      ) : (
        <section className="geektopia-hero geektopia-hero-empty">
          <p>Nenhuma edição principal disponível no momento. Volte em breve!</p>
        </section>
      )}

      <section className="geektopia-section">
        <h2 className="geektopia-section-title">Geektopia Pocket</h2>
        <p className="geektopia-section-sub">Edições menores, ao longo do ano.</p>

        {erro && <p className="geektopia-erro">{erro}</p>}

        {pockets.length === 0 && !erro && (
          <p className="geektopia-vazio">Nenhuma edição Pocket disponível no momento.</p>
        )}

        <div className="geektopia-pocket-grid">
          {pockets.map(ev => (
            <Link to={`/geektopia/${ev.id_geektopia}`} key={ev.id_geektopia} className="geektopia-pocket-card">
              {ev.banner_url ? (
                <img src={ev.banner_url} alt={ev.nome_edicao} className="geektopia-pocket-img" />
              ) : (
                <div className="geektopia-pocket-img geektopia-pocket-img-placeholder" />
              )}
              <div className="geektopia-pocket-info">
                <span className="geektopia-pocket-name">{ev.nome_edicao}</span>
                {ev.local && <span className="geektopia-pocket-local">{ev.local}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}