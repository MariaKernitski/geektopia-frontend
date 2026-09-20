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

      </div>
    </div>
  );
}
