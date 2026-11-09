import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import * as v from '../utils/validacao';
import '../style/Login.css';
import '../style/RecuperarSenha.css';

// A recuperação por e-mail já está pronta no servidor, mas só é liberada quando o envio de e-mail (SMTP) estiver configurado.
// Enquanto for false, a tela avisa que o recurso ainda não está disponível. Para liberar, mude para true.
const RECUPERACAO_DISPONIVEL = false;

// Pede o e-mail e manda o link de redefinição. A resposta é sempre a mesma, exista a conta ou não.
export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    const problema = v.email(email);
    if (problema) { setErro(problema); return; }
    setEnviando(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setEnviado(res.data.message);
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível enviar agora. Tente de novo em instantes.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card rs-card">
        <div className="login-form-side">
          <h1 className="login-title">Esqueci minha senha</h1>
          {!RECUPERACAO_DISPONIVEL ? (
            <div className="rs-sucesso">
              <div className="login-feedback is-info" role="status">Este recurso ainda não foi implementado, mas estará disponível em breve.</div>
              <p className="login-subtitle">Por enquanto, se você esqueceu a senha, fale com a organização do CCPOP.</p>
              <Link to="/login" className="btn btn-primary">Voltar ao login</Link>
            </div>
          ) : enviado ? (
            <div className="rs-sucesso">
              <div className="login-feedback is-success" role="status">{enviado}</div>
              <p className="login-subtitle">O e-mail pode levar alguns minutos para chegar.</p>
              <Link to="/login" className="btn btn-primary">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <p className="login-subtitle">Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
              <form onSubmit={enviar} noValidate>
                <div className="login-field">
                  <label htmlFor="rs-email">E-mail<span className="required">*</span></label>
                  <input id="rs-email" type="email" autoComplete="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={erro ? true : undefined} />
                </div>
                {erro && <div className="login-feedback is-error" role="alert">{erro}</div>}
                <div className="rs-acoes">
                  <Link to="/login" className="btn btn-secondary">Voltar</Link>
                  <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar link'}</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
