import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FormUsuario } from '../components/usuario/FormUsuario';
import '../style/AdminEdicao.css';

// Cadastro público. Todo o formulário (etapas, validação na hora, máscaras)
// vive em FormUsuario, o mesmo usado pelo painel do administrador.
export function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();

  const cadastrar = async (dados) => {
    await api.post('/auth/register', dados);
    navigate('/login', { state: { cadastroSucesso: true, emailCadastrado: dados.email, from: location.state?.from } });
  };

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <h1 className="ed-titulo-pagina" style={{ marginBottom: 6 }}>Criar conta</h1>
      <p className="ed-subtitulo" style={{ marginBottom: 20 }}>
        Preencha as três etapas. Você pode voltar e ajustar o que quiser antes de finalizar.
        Já tem conta? <Link to="/login" state={{ from: location.state?.from }}>Entrar</Link>.
      </p>

      <div className="ed-painel">
        <FormUsuario modo="cadastro" rotuloEnvio="Finalizar cadastro" onSubmit={cadastrar} />
      </div>
    </div>
  );
}
