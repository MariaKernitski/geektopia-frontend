import { useEffect, useState } from 'react';
import api from '../services/api';

export function Admin() {
  const [users, setUsers] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const loadUsers = () => {
    api.get('/auth/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => setMensagem(err.response?.data?.error || 'Acesso negado. Apenas administradores.'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePromote = async (id) => {
    try {
      const res = await api.post(`/auth/admin/promote/${id}`, { nivel_acesso: 'STAFF' });
      setMensagem(res.data.message);
      loadUsers();
    } catch (err) {
      setMensagem(err.response?.data?.error || 'Erro ao promover.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const res = await api.delete(`/auth/admin/users/${id}`);
      setMensagem(res.data.message);
      loadUsers();
    } catch (err) {
      setMensagem(err.response?.data?.error || 'Erro ao deletar.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Painel Administrativo - Usuários</h2>
      {mensagem && <p style={{ color: 'red' }}><strong>{mensagem}</strong></p>}

      <ul>
        {users.map(u => (
          <li key={u.id_usuario} style={{ marginBottom: '10px' }}>
            <strong>{u.nome_completo}</strong> ({u.email}) - {u.administrador ? 'ADMIN' : 'CLIENTE'} 
            {' '}
            {!u.administrador && (
              <button onClick={() => handlePromote(u.id_usuario)}>Promover a Admin</button>
            )}
            {' '}
            <button onClick={() => handleDelete(u.id_usuario)} style={{ color: 'red' }}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}