import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import '../style/Login.css';
import '../style/RecuperarSenha.css';

// Tela aberta pelo link do e-mail (/confirmar-email?token=...): confirma o endereço e explica o resultado.
export function ConfirmarEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [estado, setEstado] = useState(token ? { tipo: 'carregando' } : { tipo: 'erro', texto: 'Este link está incompleto. Abra o link do e-mail de novo.' });

  useEffect(() => {
    if (!token) return undefined;
    let ativo = true;
    api.post('/auth/confirmar-email', { token })
      .then((r) => { if (ativo) setEstado({ tipo: 'ok', texto: r.data.message }); })
      .catch((e) => { if (ativo) setEstado({ tipo: 'erro', texto: e.response?.data?.error || 'Não foi possível confirmar agora. Tente de novo.' }); });
    return () => { ativo = false; };
  }, [token]);

  const logado = Boolean(localStorage.getItem('@Geektopia:token'));
  return (
    <div className="login-page">
      <div className="login-card rs-card">
        <div className="login-form-side">
          <h1 className="login-title">Confirmação de e-mail</h1>
          <div className="rs-sucesso">
            {estado.tipo === 'carregando' && <p className="login-subtitle" aria-busy="true">Confirmando o seu e-mail...</p>}
            {estado.tipo === 'ok' && <div className="login-feedback is-success" role="status">{estado.texto}</div>}
            {estado.tipo === 'erro' && <div className="login-feedback is-error" role="alert">{estado.texto}</div>}
            {estado.tipo !== 'carregando' && (
              <Link to={logado ? '/perfil' : '/login'} className="btn btn-primary">{logado ? 'Ir para o meu perfil' : 'Entrar'}</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
