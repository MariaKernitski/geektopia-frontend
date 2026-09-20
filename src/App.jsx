import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Perfil } from './pages/Perfil';
import { Admin } from './pages/Admin';
import { AdminHub } from './pages/AdminHub';
<<<<<<< HEAD
import { AdminCriarEvento } from './pages/AdminCriarEvento';
import { AdminEventosHub } from './pages/AdminEventosHub';
import { GeektopiaPage } from './pages/GeektopiaPage';
import { GeektopiaDetalhe } from './pages/GeektopiaDetalhe';
import { AdminEventosLista } from './pages/AdminEventosLista';
import { AdminEventoLotes } from './pages/AdminEventoLotes';
import { PedidoConfirmacao } from './pages/PedidoConfirmacao';
=======
import { PedidoConfirmacao } from './pages/PedidoConfirmacao';
import { Dashboard } from './pages/Dashboard';
>>>>>>> 1fab20a83644f24304743ae75d39b0105be11ef4

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="/pedido/:id/confirmacao" element={<PrivateRoute><PedidoConfirmacao /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
<<<<<<< HEAD
        <Route path="/admin/usuarios" element={<AdminRoute><Admin /></AdminRoute>} /> 
        <Route path="/admin/eventos/criar" element={<AdminRoute><AdminCriarEvento /></AdminRoute>} />
        <Route path="/admin/eventos" element={<AdminRoute><AdminEventosHub /></AdminRoute>} />
        <Route path="/geektopia" element={<GeektopiaPage />} />
        <Route path="/geektopia/:id" element={<GeektopiaDetalhe />} />
        <Route path="/admin/eventos/lista" element={<AdminRoute><AdminEventosLista /></AdminRoute>} />
        <Route path="/admin/eventos/:id/lotes" element={<AdminRoute><AdminEventoLotes /></AdminRoute>} />
        <Route path="/pedido/:id/confirmacao" element={<PrivateRoute><PedidoConfirmacao /></PrivateRoute>} />
=======
        <Route path="/admin/usuarios" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
>>>>>>> 1fab20a83644f24304743ae75d39b0105be11ef4
      </Routes>
    </BrowserRouter>
  );
}