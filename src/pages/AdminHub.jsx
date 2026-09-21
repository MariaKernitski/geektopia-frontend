import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiFileText, FiBarChart2, FiInbox, FiCheckSquare } from 'react-icons/fi';
import { usePendencias } from '../hooks/usePendencias';
import ccpopLogo from '../assets/CCPOP_NAME.png';
import '../style/AdminHub.css';

const OPCOES = [
  { to: '/admin/usuarios', Icone: FiUsers, titulo: 'Administrar Usuários' },
  { to: '/admin/eventos', Icone: FiCalendar, titulo: 'Administrar Eventos' },
  { to: '/admin/solicitacoes', Icone: FiInbox, titulo: 'Solicitações (expositores e competições)', pendencias: true },
  { to: '/admin/checkin', Icone: FiCheckSquare, titulo: 'Check-in de ingressos (portaria)' },
  { to: '/admin/paginas', Icone: FiFileText, titulo: 'Página inicial e textos do site' },
  { to: '/admin/dashboard', Icone: FiBarChart2, titulo: 'Dashboards e Relatórios' },
];

export function AdminHub() {
  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const { total: pendentes } = usePendencias();
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
          {OPCOES.map(({ to, Icone, titulo, pendencias }) => (
            <Link to={to} key={to} className="admin-hub-card">
              <Icone className="admin-hub-card-icon" />
              <span className="admin-hub-card-label">{titulo}</span>
              {pendencias && pendentes > 0 && <span className="admin-hub-pendente">{pendentes} em análise</span>}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}