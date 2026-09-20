import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiFileText, FiBarChart2 } from 'react-icons/fi';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import '../style/AdminHub.css';

const OPCOES = [
  { to: '/admin/usuarios', Icone: FiUsers, titulo: 'Administrar Usuários' },
  { to: '/admin/eventos', Icone: FiCalendar, titulo: 'Administrar Eventos' },
  { to: '/admin/paginas', Icone: FiFileText, titulo: 'Administrar Páginas Informativas' },
  { to: '/admin/dashboard', Icone: FiBarChart2, titulo: 'Dashboards e Relatórios' },
];

export function AdminHub() {
  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const primeiroNome = user?.nome_completo?.split(' ')[0] || 'Admin';

  return (
    <div className="admin-hub-page">
      <div className="admin-hub-shell">

        <div className="admin-hub-header">
          <div>
            <h1 className="admin-hub-greeting">Bem-vindo(a), {primeiroNome}!</h1>
            <p className="admin-hub-sub">O que gostaria de fazer hoje?</p>
          </div>
          <img src={ccpopLogo} alt="Logo CCPOP" className="admin-hub-badge" />
        </div>

        <div className="admin-hub-grid">
          {OPCOES.map(({ to, Icone, titulo }) => (
            <Link to={to} key={to} className="admin-hub-card">
              <Icone className="admin-hub-card-icon" />
              <span className="admin-hub-card-label">{titulo}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}