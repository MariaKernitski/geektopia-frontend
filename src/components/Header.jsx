import { Link, useLocation } from 'react-router-dom';
import { usePendencias } from '../hooks/usePendencias';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import '../style/Header.css';

export function Header() {
  const location = useLocation();

  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = !!user?.administrador;

  const { total: pendentes } = usePendencias(isAdmin, location.pathname);

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
              <Link to="/admin" className="btn btn-secondary header-admin">
                Painel ADM
                {pendentes > 0 && <span className="header-pendente" aria-label={`${pendentes} solicitações em análise`}>{pendentes}</span>}
              </Link>
            )}
            {/* Administrador só tem o painel: participar e perfil são de conta cliente. */}
            {!isAdmin && (
              <>
                <Link to="/participar" className="btn btn-secondary">Participar</Link>
                <Link to="/perfil" className="btn btn-secondary">Meu Perfil</Link>
              </>
            )}
            <button onClick={handleLogout} className="btn btn-primary">Sair</button>
          </>
        ) : (
          <>
            {location.pathname !== '/login' && (
              <Link to="/login" className="btn btn-secondary">Entrar</Link>
            )}
            {location.pathname !== '/cadastro' && (
              <Link to="/cadastro" className="btn btn-primary">Cadastrar</Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}