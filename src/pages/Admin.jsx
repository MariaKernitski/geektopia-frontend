import { useEffect, useState } from 'react';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditUserModal } from '../components/EditUserModal';
import { PromoteModal } from '../components/PromoteModal';
import '../style/AdminUsuarios.css';

export function Admin() {
  const [users, setUsers] = useState([]);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null);
  const [usuarioParaPromover, setUsuarioParaPromover] = useState(null);
  const [mostrarCriar, setMostrarCriar] = useState(false);

  const [novoUsuario, setNovoUsuario] = useState({
    nome_completo: '', cpf: '', email: '', senha: '', data_nascimento: ''
  });

  const loadUsers = () => {
    api.get('/auth/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Acesso negado. Apenas administradores.' }));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const confirmarPromocao = async (nivel) => {
    try {
      const res = await api.post(`/auth/admin/promote/${usuarioParaPromover}`, { nivel_permissao: nivel });
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadUsers();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao promover.' });
    } finally {
      setUsuarioParaPromover(null);
    }
  };

  const handleDemote = async (id) => {
    try {
      const res = await api.patch(`/auth/admin/demote/${id}`);
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadUsers();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao rebaixar.' });
    }
  };

  const confirmarExclusao = async () => {
    try {
      const res = await api.delete(`/auth/admin/users/${idParaExcluir}`);
      setMensagem({ tipo: 'sucesso', texto: res.data.message });
      loadUsers();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao deletar.' });
    } finally {
      setIdParaExcluir(null);
    }
  };

  const salvarEdicao = async (id, dados) => {
    const res = await api.put(`/auth/admin/users/${id}`, dados);
    setMensagem({ tipo: 'sucesso', texto: res.data.message });
    setUsuarioParaEditar(null);
    loadUsers();
  };

  const criarUsuario = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', novoUsuario);
      setMensagem({ tipo: 'sucesso', texto: res.data.message || 'Usuário criado com sucesso!' });
      setNovoUsuario({ nome_completo: '', cpf: '', email: '', senha: '', data_nascimento: '' });
      setMostrarCriar(false);
      loadUsers();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao criar usuário.' });
    }
  };

  return (
    <div className="admin-list-page">
      <div className="admin-list-header">
        <h1 className="admin-list-title">Painel Administrativo — Usuários</h1>
        <button className="btn btn-primary" onClick={() => setMostrarCriar(!mostrarCriar)}>
          {mostrarCriar ? 'Cancelar' : '+ Criar Usuário'}
        </button>
      </div>

      {mensagem.texto && (
        <div className={`admin-list-feedback is-${mensagem.tipo}`} role="status">
          {mensagem.texto}
        </div>
      )}

      {mostrarCriar && (
        <form onSubmit={criarUsuario} className="admin-create-form">
          <div className="admin-create-row">
            <input
              placeholder="Nome completo"
              value={novoUsuario.nome_completo}
              onChange={e => setNovoUsuario({ ...novoUsuario, nome_completo: e.target.value })}
              required
            />
            <input
              placeholder="CPF (somente números)"
              value={novoUsuario.cpf}
              onChange={e => setNovoUsuario({ ...novoUsuario, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              maxLength={11}
              required
            />
          </div>
          <div className="admin-create-row">
            <input
              type="email"
              placeholder="E-mail"
              value={novoUsuario.email}
              onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
              required
            />
            <input
              type="date"
              value={novoUsuario.data_nascimento}
              onChange={e => setNovoUsuario({ ...novoUsuario, data_nascimento: e.target.value })}
              required
            />
          </div>
          <div className="admin-create-row">
            <input
              type="password"
              placeholder="Senha temporária"
              value={novoUsuario.senha}
              onChange={e => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">Salvar Usuário</button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {users.map(u => (
          <div className="admin-list-row" key={u.id_usuario}>
            <div className="admin-list-info">
              <span className="admin-list-name">{u.nome_completo}</span>
              <span className="admin-list-email">{u.email}</span>
            </div>

            <span className={`admin-role-badge ${u.administrador ? 'is-admin' : ''}`}>
              {u.administrador ? 'Admin' : 'Cliente'}
            </span>

            <div className="admin-list-actions">
              <button className="btn btn-secondary" onClick={() => setUsuarioParaEditar(u)}>Editar</button>
              {u.administrador ? (
                <button className="btn btn-secondary" onClick={() => handleDemote(u.id_usuario)}>Rebaixar</button>
              ) : (
                <button className="btn btn-secondary" onClick={() => setUsuarioParaPromover(u.id_usuario)}>
                  Promover a Admin
                </button>
              )}
              <button className="btn btn-danger" onClick={() => setIdParaExcluir(u.id_usuario)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <EditUserModal
        isOpen={usuarioParaEditar !== null}
        usuario={usuarioParaEditar}
        onSave={salvarEdicao}
        onCancel={() => setUsuarioParaEditar(null)}
      />

      <PromoteModal
        isOpen={usuarioParaPromover !== null}
        onConfirm={confirmarPromocao}
        onCancel={() => setUsuarioParaPromover(null)}
      />

      <ConfirmModal
        isOpen={idParaExcluir !== null}
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </div>
  );
}