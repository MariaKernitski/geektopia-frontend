import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { usePendencias } from '../hooks/usePendencias';
import { Sininho } from './Sininho';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import '../style/Header.css';

export function Header() {
  const location = useLocation();

  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = !!user?.administrador;

  // Nome fixo no canto direito: primeiro nome + sobrenome abreviado, e a inicial num círculo. Leva ao perfil (ou ao painel, para o admin).
  const partesNome = (user?.nome_completo || '').trim().split(/\s+/).filter(Boolean);
  const nomeCurto = partesNome.length > 1 ? `${partesNome[0]} ${partesNome[partesNome.length - 1][0]}.` : partesNome[0] || '';

  // A foto de perfil não vem no login, então é buscada uma vez por sessão (e de novo ao sair da tela do perfil, onde ela pode ter mudado).
  const token = localStorage.getItem('@Geektopia:token');
  const noPerfil = location.pathname === '/perfil';
  const buscarFoto = useCallback(
    () => (token ? api.get('/auth/me').then((r) => r.data?.perfil?.avatar_url || null).catch(() => null) : Promise.resolve(null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, noPerfil]
  );
  const { dados: foto } = useCarga(buscarFoto);

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
        <Link to="/ajuda" className={linkClass('/ajuda')}>Ajuda</Link>
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            {nomeCurto && (() => {
              const conteudo = (
                <>
                  {foto ? <img className="header-usuario-foto" src={foto} alt="" /> : <span className="header-usuario-inicial" aria-hidden="true">{nomeCurto[0].toUpperCase()}</span>}
                  <span className="header-usuario-nome">{nomeCurto}</span>
                </>
              );
              // Cliente: o chip é o caminho para o perfil. Administrador não tem perfil de participante: só identifica (o painel tem o seu botão).
              return isAdmin
                ? <span className="header-usuario is-fixo" title={user.nome_completo} aria-label={`Conectado como ${user.nome_completo}`}>{conteudo}</span>
                : <Link to="/perfil" className="header-usuario" title="Meu perfil" aria-label={`Meu perfil: ${user.nome_completo}`}>{conteudo}</Link>;
            })()}
            <Sininho />
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