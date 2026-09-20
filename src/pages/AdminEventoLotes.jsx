import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import '../style/AdminUsuarios.css';
import '../style/AdminEventoForm.css';

export function AdminEventoLotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [evento, setEvento] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [form, setForm] = useState({ nome_lote: '', valor_ingresso: '', quantidade_total: '' });
  const [mensagem, setMensagem] = useState(
    location.state?.criado
      ? { tipo: 'sucesso', texto: `Evento "${location.state.nomeEvento}" criado! Agora cadastre os lotes de ingresso.` }
      : { tipo: '', texto: '' }
  );
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = () => {
    Promise.all([
      api.get(`/geektopia/admin/${id}`),
      api.get(`/geektopia/admin/${id}/lotes`)
    ]).then(([evRes, lotesRes]) => {
      setEvento(evRes.data);
      setLotes(lotesRes.data);
    });
  };

  useEffect(() => { carregar(); }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const criarLote = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post('/lotes', {
        id_geektopia: Number(id),
        nome_lote: form.nome_lote,
        valor_ingresso: Number(form.valor_ingresso),
        quantidade_total: Number(form.quantidade_total)
      });
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      setForm({ nome_lote: '', valor_ingresso: '', quantidade_total: '' });
      carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao criar lote.' });
    } finally {
      setEnviando(false);
    }
  };

  const confirmarExclusao = async () => {
    try {
      const res = await api.delete(`/lotes/${idParaExcluir}`);
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao excluir lote.' });
    } finally {
      setIdParaExcluir(null);
    }
  };

  return (
    <div className="admin-list-page">
      <Link to="/admin/eventos/lista" className="btn btn-secondary" style={{ marginBottom: '16px', display: 'inline-block' }}>
        ← Voltar para eventos
      </Link>

      <h1 className="admin-list-title">
        Lotes de ingresso {evento && `— ${evento.nome_edicao}`}
      </h1>

      <div className={`admin-list-feedback is-${mensagem.tipo} ${!mensagem.texto ? 'is-hidden' : ''}`} role="status">
        {mensagem.texto}
      </div>

      <form onSubmit={criarLote} className="evento-form" style={{ marginBottom: '24px' }}>
        <div className="evento-field-row">
          <div className="evento-field">
            <label>Nome do lote *</label>
            <input
              name="nome_lote"
              value={form.nome_lote}
              onChange={handleChange}
              placeholder="Ex: Inteira - 1º Lote"
              required
            />
          </div>
          <div className="evento-field">
            <label>Valor (R$) *</label>
            <input
              type="number" step="0.01" min="0.01"
              name="valor_ingresso"
              value={form.valor_ingresso}
              onChange={handleChange}
              placeholder="25.00"
              required
            />
          </div>
          <div className="evento-field">
            <label>Quantidade *</label>
            <input
              type="number" min="1"
              name="quantidade_total"
              value={form.quantidade_total}
              onChange={handleChange}
              placeholder="100"
              required
            />
          </div>
        </div>

        <div className="evento-form-actions">
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Adicionando...' : '+ Adicionar lote'}
          </button>
        </div>
      </form>

      <div className="admin-list">
        {lotes.length === 0 && (
          <div className="admin-eventos-empty">Nenhum lote cadastrado ainda.</div>
        )}

        {lotes.map(lote => (
          <div className="admin-list-row" key={lote.id_lote}>
            <div className="admin-list-info">
              <span className="admin-list-name">{lote.nome_lote}</span>
              <span className="admin-list-email">
                R$ {lote.valor_ingresso?.toFixed(2)} · {lote.quantidade_total} ingresso(s)
                {lote.esgotado && ' · Esgotado'}
              </span>
            </div>
            <div className="admin-list-actions">
              <button className="btn btn-danger" onClick={() => setIdParaExcluir(lote.id_lote)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {evento && lotes.length > 0 && (
        <div className="evento-form-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/admin/eventos/lista')}>
            Concluir e ir para a lista de eventos
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={idParaExcluir !== null}
        title="Excluir lote"
        message="Tem certeza que deseja excluir este lote de ingressos?"
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </div>
  );
}