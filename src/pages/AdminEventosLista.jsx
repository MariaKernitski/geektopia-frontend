import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import '../style/AdminUsuarios.css';

export function AdminEventosLista() {
  const [eventos, setEventos] = useState([]);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [idParaExcluir, setIdParaExcluir] = useState(null);

  const loadEventos = () => {
    api.get('/geektopia/admin/todas')
      .then(res => setEventos(res.data))
      .catch(err => setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao carregar eventos.' }));
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const tornarPrincipal = async (id) => {
    try {
      const res = await api.patch(`/geektopia/${id}/tornar-principal`);
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadEventos();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao definir edição principal.' });
    }
  };

  const alterarStatus = async (id, novoStatus) => {
    try {
      const res = await api.patch(`/geektopia/${id}/status`, { status_evento: novoStatus });
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadEventos();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao alterar status do evento.' });
    }
  };

  const confirmarExclusao = async () => {
    try {
      const res = await api.delete(`/geektopia/${idParaExcluir}`);
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadEventos();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao excluir evento.' });
    } finally {
      setIdParaExcluir(null);
    }
  };

  return (
    <div className="admin-list-page">
      <Link to="/admin/eventos" className="btn btn-secondary" style={{ marginBottom: '16px', display: 'inline-block' }}>
        ← Voltar
      </Link>

      <div className="admin-list-header">
        <h1 className="admin-list-title">Gerenciar Eventos</h1>
        <Link to="/admin/eventos/criar" className="btn btn-primary">+ Criar evento</Link>
      </div>

      <div className={`admin-list-feedback is-${mensagem.tipo} ${!mensagem.texto ? 'is-hidden' : ''}`} role="status">
        {mensagem.texto}
      </div>

      <div className="admin-list">
        {eventos.length === 0 && (
          <div className="admin-eventos-empty">Nenhum evento cadastrado ainda.</div>
        )}

        {eventos.map(ev => (
          <div className="admin-list-row" key={ev.id_geektopia}>
            <div className="admin-list-info">
              <span className="admin-list-name">{ev.nome_edicao}</span>
              <span className="admin-list-email">
                {ev.local || 'Local não definido'}
                {ev.data_inicio && ` · ${new Date(ev.data_inicio).toLocaleDateString('pt-BR')}`}
                {` · ${ev._count?.lotes || 0} lote(s)`}
              </span>
            </div>

            <span className={`admin-role-badge ${ev.tipo_edicao === 'Principal' ? 'is-admin' : ''}`}>
              {ev.tipo_edicao === 'Principal' ? 'Principal' : 'Pocket'}
            </span>

            <span className="admin-status-badge">{ev.status_evento}</span>

            <div className="admin-list-actions">
              {ev.tipo_edicao !== 'Principal' && (
                <button className="btn btn-secondary" onClick={() => tornarPrincipal(ev.id_geektopia)}>
                  Tornar Principal
                </button>
              )}

              {ev.status_evento === 'VendasAbertas' ? (
                <button className="btn btn-secondary" onClick={() => alterarStatus(ev.id_geektopia, 'VendasEncerradas')}>
                  Encerrar vendas
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => alterarStatus(ev.id_geektopia, 'VendasAbertas')}>
                  Abrir vendas
                </button>
              )}

              <button className="btn btn-danger" onClick={() => setIdParaExcluir(ev.id_geektopia)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={idParaExcluir !== null}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </div>
  );
}