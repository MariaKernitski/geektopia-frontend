import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Perfil } from './pages/Perfil';
import { Admin } from './pages/Admin';

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem('@Geektopia:token');
    localStorage.removeItem('@Geektopia:user');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', gap: '15px' }}>
        <Link to="/">Login</Link>
        <Link to="/cadastro">Cadastre-se</Link>
        <Link to="/perfil">Meu Perfil</Link>
        <Link to="/admin">Painel ADM</Link>
        <button onClick={handleLogout}>Sair</button>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}