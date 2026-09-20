import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../style/GeektopiaDetalhe.css';

export function GeektopiaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [quantidades, setQuantidades] = useState({});
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(true);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/geektopia/${id}`),
      api.get(`/geektopia/${id}/lotes`)
    ])
      .then(([evRes, lotesRes]) => {
        setEvento(evRes.data);
        setLotes(lotesRes.data);
      })
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Evento não encontrado.' }))
      .finally(() => setCarregando(false));
  }, [id]);

  const alterarQuantidade = (idLote, valor) => {
    const n = Math.max(0, Number(valor) || 0);
    setQuantidades({ ...quantidades, [idLote]: n });
  };

  const totalSelecionado = Object.values(quantidades).reduce((soma, q) => soma + q, 0);

  const finalizarCompra = async () => {
    setMensagem({ tipo: '', texto: '' });
    const itens = Object.entries(quantidades)
      .filter(([, qtd]) => qtd > 0)
      .map(([id_lote, quantidade]) => ({ id_lote: Number(id_lote), quantidade }));

    if (itens.length === 0) return;

    setComprando(true);
    try {
      const res = await api.post('/pedidos', { itens });
      window.location.href = res.data.init_point;
    } catch (err) {
      if (err.response?.status === 401) {
        setMensagem({ tipo: 'erro', texto: 'Faça login para comprar seu ingresso.' });
      } else {
        setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao iniciar a compra.' });
      }
      setComprando(false);
    }
  };

  if (carregando) {
    return <div className="geektopia-detalhe-page"><p className="geektopia-loading">Carregando...</p></div>;
  }

  if (!evento) {
    return (
      <div className="geektopia-detalhe-page">
        <p className="geektopia-erro">{mensagem.texto || 'Evento não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="geektopia-detalhe-page">
      {evento.banner_url && (
        <img src={evento.banner_url} alt={evento.nome_edicao} className="geektopia-detalhe-banner" />
      )}

      <div className="geektopia-detalhe-content">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/geektopia')} style={{ marginBottom: '20px' }}>
          ← Voltar
        </button>

        <h1 className="geektopia-detalhe-title">{evento.nome_edicao}</h1>

        <div className="geektopia-detalhe-meta">
          {evento.local && <span>{evento.local}</span>}
          {evento.data_inicio && (
            <span>
              {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
              {evento.data_fim && ` a ${new Date(evento.data_fim).toLocaleDateString('pt-BR')}`}
            </span>
          )}
        </div>

        {evento.descricao && <p className="geektopia-detalhe-descricao">{evento.descricao}</p>}

        <h2 className="geektopia-detalhe-subtitulo">Ingressos</h2>

        <div className={`admin-list-feedback is-${mensagem.tipo} ${!mensagem.texto ? 'is-hidden' : ''}`} role="status">
          {mensagem.texto}
        </div>

        {lotes.length === 0 ? (
          <p className="geektopia-vazio">Nenhum lote de ingresso disponível ainda para este evento.</p>
        ) : (
          <div className="geektopia-lotes">
            {lotes.map(lote => (
              <div className="geektopia-lote-row" key={lote.id_lote}>
                <div className="geektopia-lote-info">
                  <span className="geektopia-lote-nome">{lote.nome_lote}</span>
                  <span className="geektopia-lote-preco">
                    {lote.valor_ingresso != null
                      ? `R$ ${lote.valor_ingresso.toFixed(2)}`
                      : 'Preço a definir'}
                  </span>
                  {lote.esgotado && <span className="geektopia-lote-esgotado">Esgotado</span>}
                </div>
                <input
                  type="number"
                  min="0"
                  disabled={lote.esgotado}
                  value={quantidades[lote.id_lote] || ''}
                  onChange={(e) => alterarQuantidade(lote.id_lote, e.target.value)}
                  className="geektopia-lote-qtd"
                  placeholder="0"
                />
              </div>
            ))}

            <div className="geektopia-lote-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={totalSelecionado === 0 || comprando}
                onClick={finalizarCompra}
              >
                {comprando ? 'Redirecionando...' : 'Finalizar compra'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}