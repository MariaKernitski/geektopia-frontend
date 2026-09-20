import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { descricaoClassificacao, seloClassificacao } from '../utils/idade';
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

  const valorTotalSelecionado = lotes.reduce((soma, lote) => {
    const qtd = quantidades[lote.id_lote] || 0;
    const preco = lote.valor_ingresso || 0;
    return soma + qtd * preco;
  }, 0);

  const finalizarCompra = async () => {
    setMensagem({ tipo: '', texto: '' });
    const itens = Object.entries(quantidades)
      .filter(([, qtd]) => qtd > 0)
      .map(([id_lote, quantidade]) => ({ id_lote: Number(id_lote), quantidade }));

    if (itens.length === 0) return;

    setComprando(true);

    // Abre a aba (ainda vazia) já aqui, dentro do clique do usuário — se
    // esperássemos a resposta do servidor pra abrir, o navegador trata como
    // pop-up "não pedido pelo usuário" e bloqueia. Só trocamos o endereço
    // dela depois que o Mercado Pago responder.
    const abaPagamento = window.open('', '_blank');

    try {
      const res = await api.post('/pedidos', { itens });

      if (!abaPagamento) {
        // Pop-up bloqueado mesmo assim: usa a aba atual como reserva.
        window.location.href = res.data.init_point;
        return;
      }

      abaPagamento.location.href = res.data.init_point;
      // A aba do site fica esperando a confirmação — ela mesma consulta o
      // pagamento sozinha, sem precisar que o Mercado Pago redirecione de volta.
      navigate(`/pedido/${res.data.id_pedido}/confirmacao`);
    } catch (err) {
      if (abaPagamento) abaPagamento.close();

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
      <div className="geektopia-detalhe-hero">
        {evento.banner_url ? (
          <img src={evento.banner_url} alt={evento.nome_edicao} className="geektopia-detalhe-banner" />
        ) : (
          <div className="geektopia-detalhe-banner geektopia-detalhe-banner-vazio" />
        )}
        <div className="geektopia-detalhe-hero-overlay" />

        <button type="button" className="btn btn-secondary geektopia-detalhe-voltar" onClick={() => navigate('/geektopia')}>
          ← Voltar
        </button>

        <div className="geektopia-detalhe-hero-info">
          <h1 className="geektopia-detalhe-title">{evento.nome_edicao}</h1>
          <div className="geektopia-detalhe-meta">
            {seloClassificacao(evento.classificacao_etaria) && (
              <span className="selo-idade" title={descricaoClassificacao(evento.classificacao_etaria)} aria-label={descricaoClassificacao(evento.classificacao_etaria)}>
                {seloClassificacao(evento.classificacao_etaria)}
              </span>
            )}
            {evento.local && <span>📍 {evento.local}</span>}
            {evento.data_inicio && (
              <span>
                🗓️ {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                {evento.data_fim && ` a ${new Date(evento.data_fim).toLocaleDateString('pt-BR')}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="geektopia-detalhe-content">
        {evento.descricao && <p className="geektopia-detalhe-descricao">{evento.descricao}</p>}

        <h2 className="geektopia-detalhe-subtitulo">Ingressos</h2>

        <div className={`admin-list-feedback is-${mensagem.tipo} ${!mensagem.texto ? 'is-hidden' : ''}`} role="status">
          {mensagem.texto}
        </div>

        {lotes.length === 0 ? (
          <p className="geektopia-vazio">Nenhum lote de ingresso disponível ainda para este evento.</p>
        ) : (
          <div className="geektopia-lotes pixel-cut">
            {lotes.map(lote => {
              const qtd = quantidades[lote.id_lote] || 0;
              return (
                <div className={`geektopia-lote-row ${lote.esgotado ? 'is-esgotado' : ''}`} key={lote.id_lote}>
                  <div className="geektopia-lote-info">
                    <span className="geektopia-lote-nome">{lote.nome_lote}</span>
                    <span className="geektopia-lote-preco">
                      {lote.valor_ingresso != null
                        ? `R$ ${lote.valor_ingresso.toFixed(2)}`
                        : 'Preço a definir'}
                    </span>
                    {lote.esgotado && <span className="geektopia-lote-esgotado-badge">Esgotado</span>}
                  </div>

                  <div className="geektopia-lote-stepper">
                    <button
                      type="button"
                      className="geektopia-stepper-btn"
                      disabled={lote.esgotado || qtd === 0}
                      onClick={() => alterarQuantidade(lote.id_lote, qtd - 1)}
                    >
                      −
                    </button>
                    <span className="geektopia-stepper-valor">{qtd}</span>
                    <button
                      type="button"
                      className="geektopia-stepper-btn"
                      disabled={lote.esgotado}
                      onClick={() => alterarQuantidade(lote.id_lote, qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="geektopia-lote-resumo">
              <div className="geektopia-lote-resumo-texto">
                <span>
                  {totalSelecionado} ingresso{totalSelecionado === 1 ? '' : 's'} selecionado{totalSelecionado === 1 ? '' : 's'}
                </span>
                <strong>Total: R$ {valorTotalSelecionado.toFixed(2)}</strong>
              </div>
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