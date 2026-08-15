import { useState } from 'react';
import api from '../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, senha });
      
      localStorage.setItem('@Geektopia:token', response.data.token);
      localStorage.setItem('@Geektopia:user', JSON.stringify(response.data.user));

      setMensagem(`Sucesso! Bem-vindo, ${response.data.user.nome_completo}`);
    } catch (error) {
      setMensagem(error.response?.data?.error || 'Erro ao realizar login.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Login - Geektopia</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>E-mail: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <br />
        <div>
          <label>Senha: </label>
          <input 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            required 
          />
        </div>
        <br />
        <button type="submit">Entrar</button>
      </form>

      {mensagem && <p><strong>{mensagem}</strong></p>}
    </div>
  );
}