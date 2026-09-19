import { Link, useNavigate, useLocation } from 'react-router-dom';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import '../style/Header.css';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = !!user?.administrador;

  const handleLogout = () => {
    localStorage.removeItem('@Geektopia:token');
    localStorage.removeItem('@Geektopia:user');
    window.location.href = '/';
  };

  const linkClass = (path) =>
    `header-link ${location.pathname === path ? 'is-active' : ''}`;

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <img src={ccpopLogo} alt="Logo CCPOP" className="header-logo" />
      </Link>

      <nav className="header-nav">
        <Link to="/" className={linkClass('/')}>CCPOP</Link>
        <Link to="/geektopia" className={linkClass('/geektopia')}>Geektopia</Link>
        <Link to="/eventos" className={linkClass('/eventos')}>Eventos da comunidade</Link>
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="btn btn-secondary">Painel ADM</Link>
            )}
            <Link to="/perfil" className="btn btn-secondary">Meu Perfil</Link>
            <button onClick={handleLogout} className="btn btn-primary">Sair</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary">Entrar</Link>
            <Link to="/cadastro" className="btn btn-primary">Cadastrar</Link>
          </>
        )}
      </div>
    </header>
  );
}