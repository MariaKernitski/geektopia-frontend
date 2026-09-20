import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../style/AdminUsuarios.css';
import '../style/PedidoConfirmacao.css';

export function PedidoConfirmacao() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [statusFinal, setStatusFinal] = useState(null);
  const [mensagemStatus, setMensagemStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [verificando, setVerificando] = useState(false);

  const verificarPagamento = () => {
    setVerificando(true);
    api.get(`/pedidos/${id}/sincronizar`)
      .then(res => {
        setStatusFinal(res.data.status_pedido);
        setMensagemStatus(res.data.mensagem);
      })
      .catch(() => setMensagemStatus('Não foi possível verificar o pagamento agora.'))
      .finally(() => setVerificando(false));
  };

  useEffect(() => {
    api.get(`/pedidos/${id}`)
      .then(res => {
        setPedido(res.data);
        setStatusFinal(res.data.status_pedido);
      })
      .catch(() => setMensagemStatus('Pedido não encontrado.'))
      .finally(() => setCarregando(false));

    verificarPagamento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (carregando) {
    return <div className="pedido-confirmacao-page"><p className="geektopia-loading">Carregando pedido...</p></div>;
  }

  const pago = statusFinal === 'Pago';

  return (
    <div className="pedido-confirmacao-page">
      <div className="pedido-confirmacao-card">

        <div className={`pedido-confirmacao-icone ${pago ? 'is-sucesso' : 'is-pendente'}`}>
          {pago ? '✓' : '⏳'}
        </div>

        <h1 className="pedido-confirmacao-titulo">
          {pago ? 'Pagamento aprovado!' : 'Pagamento em processamento'}
        </h1>

        <p className="pedido-confirmacao-sub">
          {pago
            ? 'Seu ingresso já foi gerado e está disponível no seu perfil.'
            : mensagemStatus || 'Estamos aguardando a confirmação do Mercado Pago. Isso pode levar alguns instantes.'}
        </p>

        {pedido && (
          <div className="pedido-confirmacao-resumo">
            <div className="pedido-confirmacao-linha">
              <span>Pedido</span>
              <span>#{pedido.id_pedido}</span>
            </div>
            <div className="pedido-confirmacao-linha">
              <span>Total</span>
              <span>R$ {Number(pedido.valor_total_bruto).toFixed(2)}</span>
            </div>
            {pedido.itens?.map((item, i) => (
              <div className="pedido-confirmacao-linha" key={i}>
                <span>{item.lote?.nome_lote || 'Item'} × {item.quantidade}</span>
                <span>R$ {Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pedido-confirmacao-actions">
          {!pago && (
            <button className="btn btn-secondary" onClick={verificarPagamento} disabled={verificando}>
              {verificando ? 'Verificando...' : 'Verificar novamente'}
            </button>
          )}
          <Link to="/perfil" className="btn btn-primary">
            {pago ? 'Ver meus ingressos' : 'Ir para meu perfil'}
          </Link>
        </div>

      </div>
    </div>
  );
}