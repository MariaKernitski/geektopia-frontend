import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheck, FiCircle } from 'react-icons/fi';
import api from '../services/api';
import * as v from '../utils/validacao';
import '../style/Login.css';
import '../style/RecuperarSenha.css';

const REQUISITOS = [
  ['tamanho', 'Mínimo de 8 caracteres'], ['maiuscula', 'Uma letra maiúscula'], ['minuscula', 'Uma letra minúscula'],
  ['numero', 'Um número'], ['especial', 'Um caractere especial']
];

// Tela aberta pelo link do e-mail (/redefinir-senha?token=...): define a nova senha.
export function RedefinirSenha() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const req = v.requisitosSenha(nova);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    const problema = v.senha(nova) || v.confirmarSenha(confirmar, nova);
    if (problema) { setErro(problema); return; }
    setEnviando(true);
    try {
      await api.post('/auth/reset-password', { token, nova_senha: nova });
      navigate('/login', { replace: true, state: { senhaRedefinida: true } });
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível alterar a senha. Tente de novo.');
      setEnviando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card rs-card">
        <div className="login-form-side">
          <h1 className="login-title">Criar nova senha</h1>
          {!token ? (
            <>
              <div className="login-feedback is-error" role="alert">Este link está incompleto. Abra o link do e-mail de novo ou peça outro.</div>
              <Link to="/esqueci-senha" className="btn btn-primary">Pedir novo link</Link>
            </>
          ) : (
            <form onSubmit={salvar} noValidate>
              <div className="login-field">
                <label htmlFor="rs-nova">Nova senha<span className="required">*</span></label>
                <input id="rs-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
              </div>
              <ul className="rs-requisitos" aria-label="Requisitos da nova senha">
                {REQUISITOS.map(([k, t]) => (
                  <li key={k} className={req[k] ? 'is-ok' : ''}>{req[k] ? <FiCheck aria-hidden="true" /> : <FiCircle aria-hidden="true" />} {t}<span className="ed-sr-only">{req[k] ? ' (atendido)' : ' (pendente)'}</span></li>
                ))}
              </ul>
              <div className="login-field">
                <label htmlFor="rs-conf">Repita a nova senha<span className="required">*</span></label>
                <input id="rs-conf" type="password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </div>
              {erro && (
                <div className="login-feedback is-error" role="alert">
                  {erro} {/inválido|expirou/.test(erro) && <Link to="/esqueci-senha">Pedir novo link</Link>}
                </div>
              )}
              <div className="rs-acoes">
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar nova senha'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
