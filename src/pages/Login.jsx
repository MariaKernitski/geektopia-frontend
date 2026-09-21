import { useState } from 'react';
import api from '../services/api';
import '../style/Login.css';
import ccpopLogo from '../assets/LOGO_CCPOP.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export function Login() {
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState(''); // 'success' | 'error'
  const [carregando, setCarregando] = useState(false);
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.emailCadastrado || '');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem('');

    try {
      const response = await api.post('/auth/login', { email, senha });

      localStorage.setItem('@Geektopia:token', response.data.token);
      localStorage.setItem('@Geektopia:user', JSON.stringify(response.data.user));

      // Volta para onde a pessoa estava (ex.: a competição que queria disputar);
      // administrador não tem perfil de participante, vai direto ao painel.
      const destino = response.data.user.administrador ? '/admin' : (location.state?.from || '/perfil');
      navigate(destino, { replace: true });

      setTipoMensagem('success');
      setMensagem(`Sucesso! Bem-vindo, ${response.data.user.nome_completo}`);
    } catch (error) {
      setTipoMensagem('error');
      setMensagem(error.response?.data?.error || 'Erro ao realizar login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* -------- Formulário -------- */}
        <div className="login-form-side">
          <h1 className="login-title">Bem-vindo de volta</h1>

          {location.state?.cadastroSucesso && (
            <div className="login-feedback is-success" role="status" style={{ marginTop: '0', marginBottom: '20px' }}>
              Cadastro realizado com sucesso! Faça login para continuar.
            </div>
          )}

          <p className="login-subtitle">Entre com sua conta para acessar o NEXUS.</p>
          <p className="login-required-hint"><span>*</span> Campos obrigatórios</p>

          <form onSubmit={handleLogin} noValidate>
            <div className="login-field">
              <label htmlFor="email">
                E-mail<span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Seu email (ex: email@exemplo.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="senha">
                Senha<span className="required">*</span>
              </label>
              <input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className="login-form-foot">
              <a href="/esqueci-senha" className="login-forgot-link">Esqueci minha senha</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            {mensagem && (
              <div
                className={`login-feedback ${tipoMensagem === 'error' ? 'is-error' : 'is-success'}`}
                role="alert"
              >
                {mensagem}
              </div>
            )}
          </form>
        </div>

        {/* -------- Painel de marca -------- */}
        <div className="login-side">
          <div className="login-side-badge">
            <img src={ccpopLogo} alt="Logo CCPOP" />
          </div>
          <h2 className="login-side-title">NÃO POSSUI UMA CONTA?</h2>
          <ul className="login-side-list">
            <li>Adquira ingressos para a GEEKTOPIA</li>
            <li>Participe de competições</li>
            <li>Exponha seus produtos nos eventos</li>
            <li>Acompanhe o status das suas inscrições</li>
          </ul>
          <Link to="/cadastro" state={{ from: location.state?.from }} className="btn btn-outline-accent login-side-cta">Cadastrar</Link>
        </div>
      </div>
    </div>
  );
}