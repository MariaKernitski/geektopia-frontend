<<<<<<< HEAD
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
=======
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../style/PedidoConfirmacao.css';

// Tenta confirmar automaticamente algumas vezes antes de deixar só no botão
// manual — o Mercado Pago às vezes leva alguns segundos para processar.
const TENTATIVAS_AUTOMATICAS = 4;
const INTERVALO_MS = 4000;

export function PedidoConfirmacao() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(true);
  const tentativasFeitas = useRef(0);

  const sincronizar = useCallback(async () => {
    setVerificando(true);
    setErro('');
    try {
      const res = await api.get(`/pedidos/${id}/sincronizar`);
      setStatus(res.data.status_pedido);
      setMensagem(res.data.mensagem || '');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível consultar este pedido.');
    } finally {
      setVerificando(false);
    }
  }, [id]);

  useEffect(() => {
    sincronizar();
  }, [sincronizar]);

  useEffect(() => {
    if (status === 'Pago' || erro) return undefined;
    if (tentativasFeitas.current >= TENTATIVAS_AUTOMATICAS) return undefined;

    const temporizador = setTimeout(() => {
      tentativasFeitas.current += 1;
      sincronizar();
    }, INTERVALO_MS);

    return () => clearTimeout(temporizador);
  }, [status, erro, mensagem, sincronizar]);

  return (
    <div className="confirmacao-page">
      <div className="confirmacao-card pixel-cut">

        {verificando && status !== 'Pago' && (
          <>
            <div className="confirmacao-spinner" aria-hidden="true" />
            <h2 className="confirmacao-title">Confirmando seu pagamento...</h2>
            <p className="confirmacao-sub">Isso pode levar alguns segundos.</p>
          </>
        )}

        {!verificando && erro && (
          <>
            <h2 className="confirmacao-title is-erro">Não conseguimos confirmar</h2>
            <p className="confirmacao-sub">{erro}</p>
            <button className="btn btn-primary" onClick={sincronizar}>Tentar novamente</button>
          </>
        )}

        {!erro && status === 'Pago' && (
          <>
            <h2 className="confirmacao-title is-sucesso">Pagamento confirmado! 🎉</h2>
            <p className="confirmacao-sub">{mensagem || 'Seu pedido foi aprovado.'}</p>
            <Link to="/perfil" className="btn btn-primary">Ver meus ingressos</Link>
          </>
        )}

        {!erro && !verificando && status && status !== 'Pago' && (
          <>
            <h2 className="confirmacao-title">Ainda aguardando confirmação</h2>
            <p className="confirmacao-sub">
              {mensagem || 'O Mercado Pago ainda não confirmou este pagamento.'}
            </p>
            <button className="btn btn-secondary" onClick={sincronizar}>Verificar novamente</button>
          </>
        )}
>>>>>>> 1fab20a83644f24304743ae75d39b0105be11ef4

      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 1fab20a83644f24304743ae75d39b0105be11ef4
