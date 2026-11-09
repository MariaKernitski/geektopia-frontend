import { useState } from 'react';
import { FiMail } from 'react-icons/fi';
import api from '../services/api';
import '../style/AvisoEmail.css';

// Faixa abaixo do cabeçalho para quem ainda não confirmou o e-mail: sem confirmar, ingressos e avisos não chegam por e-mail.
export function AvisoEmail({ email }) {
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const reenviar = async () => {
    setEnviando(true);
    setMsg('');
    try {
      const r = await api.post('/auth/reenviar-confirmacao');
      setErro(false);
      setMsg(r.data.message);
    } catch (e) {
      setErro(true);
      setMsg(e.response?.data?.error || 'Não foi possível reenviar agora.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="ae-faixa" role="status">
      <FiMail aria-hidden="true" />
      <span>
        {msg ? <span className={erro ? 'ae-erro' : ''}>{msg}</span> : <>Confirme o seu e-mail{email ? <> (<strong>{email}</strong>)</> : null} para receber ingressos e avisos por e-mail. Enviamos um link quando você se cadastrou.</>}
      </span>
      <button type="button" className="ae-botao" onClick={reenviar} disabled={enviando}>{enviando ? 'Enviando...' : 'Reenviar e-mail'}</button>
    </div>
  );
}
