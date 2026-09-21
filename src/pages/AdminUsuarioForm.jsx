import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { FormUsuario } from '../components/usuario/FormUsuario';
import { useCarga } from '../hooks/useCarga';
import '../style/AdminEdicao.css';

// Criar (/admin/usuarios/novo) ou editar (/admin/usuarios/:id/editar) um
// usuário pelo painel do administrador.
export function AdminUsuarioForm() {
  const { id } = useParams();
  const editando = Boolean(id);

  const buscar = useCallback(
    () => (editando ? api.get(`/auth/admin/users/${id}`).then((r) => r.data) : Promise.resolve(null)),
    [editando, id]
  );
  const { dados, erro, carregando } = useCarga(buscar);

  if (carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;

  if (erro) {
    return (
      <div className="ed-pagina ed-pagina-estreita">
        <div className="ed-aviso is-erro" role="alert">{erro}</div>
        <Link to="/admin/usuarios" className="btn btn-secondary">← Voltar aos usuários</Link>
      </div>
    );
  }

  return <Formulario key={id || 'novo'} usuario={dados} />;
}

function Formulario({ usuario }) {
  const navigate = useNavigate();
  const editando = Boolean(usuario);

  const salvar = async (dados) => {
    const res = editando
      ? await api.put(`/auth/admin/users/${usuario.id_usuario}`, dados)
      : await api.post('/auth/admin/users', dados);
    navigate('/admin/usuarios', { state: { sucesso: res.data.message } });
  };

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <Link to="/admin/usuarios" className="btn btn-secondary ed-voltar">← Usuários</Link>
      <h1 className="ed-titulo-pagina" style={{ marginBottom: 20 }}>
        {editando ? `Editar ${usuario.nome_completo}` : 'Novo usuário'}
      </h1>

      <div className="ed-painel">
        <FormUsuario
          modo={editando ? 'admin-editar' : 'admin-criar'}
          inicial={usuario}
          rotuloEnvio={editando ? 'Salvar alterações' : 'Cadastrar usuário'}
          onSubmit={salvar}
          onCancelar={() => navigate('/admin/usuarios')}
        />
      </div>
    </div>
  );
}
