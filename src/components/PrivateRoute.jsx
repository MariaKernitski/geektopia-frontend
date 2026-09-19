import { Navigate } from 'react-router-dom';

export function PrivateRoute({ children }) {
  const token = localStorage.getItem('@Geektopia:token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}