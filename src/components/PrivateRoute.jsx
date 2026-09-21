import { Navigate, useLocation } from 'react-router-dom';

// apenasCliente: rotas de participante (perfil, participar...). Administrador vai para o painel.
export function PrivateRoute({ children, apenasCliente = false }) {
  const token = localStorage.getItem('@Geektopia:token');
  const location = useLocation();

  if (!token) {
    // Guarda de onde a pessoa veio: depois do login ela volta para lá.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  let ehAdmin = false;
  if (apenasCliente) {
    try { ehAdmin = Boolean(JSON.parse(localStorage.getItem('@Geektopia:user') || 'null')?.administrador); } catch { /* ignora */ }
  }
  if (ehAdmin) return <Navigate to="/admin" replace />;

  return children;
}