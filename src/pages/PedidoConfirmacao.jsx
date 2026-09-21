import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { BotaoPdf } from '../components/BotaoPdf';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../style/PedidoConfirmacao.css';

// Tenta confirmar automaticamente algumas vezes antes de deixar só no botão
// manual — o Mercado Pago às vezes leva alguns segundos para processar.
const TENTATIVAS_AUTOMATICAS = 15;
const INTERVALO_MS = 4000;

export function PedidoConfirmacao() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [status, setStatus] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(true);
  const tentativasFeitas = useRef(0);

  // Busca os itens/valor do pedido só para exibir o resumo — não decide o
  // status (isso é sempre papel do /sincronizar, que fala com o Mercado Pago).
  useEffect(() => {
    api.get(`/pedidos/${id}`)
      .then((res) => setPedido(res.data))
      .catch(() => {});
  }, [id]);

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

  // Pedido de ingresso volta ao perfil; taxa de espaço volta à área do expositor.
  const destino = pedido?._count?.inscricoesCompeticao > 0
    ? { to: '/competidor', rotulo: 'Ver minhas inscrições' }
    : pedido?._count?.solicitacoesEspaco > 0
    ? { to: '/expositor', rotulo: 'Voltar à área do expositor' }
    : { to: '/perfil', rotulo: 'Ver meus ingressos' };

  const ehPedidoDeIngresso = Boolean(pedido) && !(pedido._count?.inscricoesCompeticao > 0) && !(pedido._count?.solicitacoesEspaco > 0);

  const resumo = pedido && (
    <div className="confirmacao-resumo">
      <div className="confirmacao-linha">
        <span>Pedido</span>
        <span>#{pedido.id_pedido}</span>
      </div>
      {pedido.itens?.map((item) => (
        <div className="confirmacao-linha" key={item.id_item}>
          <span>{item.lote?.nome_lote || 'Item'} × {item.quantidade}</span>
          <span>R$ {Number(item.subtotal).toFixed(2)}</span>
        </div>
      ))}
      <div className="confirmacao-linha confirmacao-linha-total">
        <span>Total</span>
        <span>R$ {Number(pedido.valor_total_bruto).toFixed(2)}</span>
      </div>
    </div>
  );

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
            <h2 className="confirmacao-title is-sucesso"><FiCheckCircle aria-hidden="true" className="confirmacao-icone" /> Pagamento confirmado!</h2>
            <p className="confirmacao-sub">{mensagem || 'Seu pedido foi aprovado.'}</p>
            {resumo}
            {ehPedidoDeIngresso && (
              <div className="confirmacao-ingressos">
                <p>Seus ingressos estão prontos, cada um em nome do titular. Baixe o PDF e guarde no celular: na entrada, basta mostrar o QR code e um documento com foto.</p>
                <BotaoPdf secundario={false} url={`/ingressos/pedido/${id}/pdf`} nome={`ingressos-compra-${id}.pdf`}>Baixar ingressos (PDF)</BotaoPdf>
              </div>
            )}
            <Link to={destino.to} className={`btn ${ehPedidoDeIngresso ? 'btn-secondary' : 'btn-primary'}`}>{destino.rotulo}</Link>
          </>
        )}

        {!erro && !verificando && status && status !== 'Pago' && (
          <>
            <h2 className="confirmacao-title">Ainda aguardando confirmação</h2>
            <p className="confirmacao-sub">
              {mensagem || 'O Mercado Pago ainda não confirmou este pagamento.'}
            </p>
            {resumo}
            <button className="btn btn-secondary" onClick={sincronizar}>Verificar novamente</button>
          </>
        )}

      </div>
    </div>
  );
}
