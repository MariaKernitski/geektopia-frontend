import { Navigate } from 'react-router-dom';

export function AdminRoute({ children }) {
  const token = localStorage.getItem('@Geektopia:token');
  const userRaw = localStorage.getItem('@Geektopia:user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.administrador) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}