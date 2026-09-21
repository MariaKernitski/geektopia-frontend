import { Link } from 'react-router-dom';
import { FiPlusCircle, FiList } from 'react-icons/fi';
import '../style/AdminHub.css';

const OPCOES = [
  { to: '/admin/eventos/criar', Icone: FiPlusCircle, titulo: 'Criar evento' },
  { to: '/admin/eventos/lista', Icone: FiList, titulo: 'Gerenciar eventos' },
];

export function AdminEventosHub() {
  return (
    <div className="admin-hub-page">
      <div className="admin-hub-shell">
        <Link to="/admin" className="btn btn-secondary" style={{ marginBottom: '16px', display: 'inline-block' }}>
          ← Voltar ao Painel
        </Link>

        <div className="admin-hub-header">
          <div>
            <h1 className="admin-hub-greeting">Administrar Eventos</h1>
            <p className="admin-hub-sub">Crie novas edições da Geektopia ou gerencie as que já existem.</p>
          </div>
        </div>

        <div className="admin-hub-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '720px' }}>
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