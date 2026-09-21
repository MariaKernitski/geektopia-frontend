import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { CompetidorArea } from './pages/CompetidorArea';
import { CompeticaoDetalhe } from './pages/CompeticaoDetalhe';
import { Checkout } from './pages/Checkout';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Perfil } from './pages/Perfil';
import { Admin } from './pages/Admin';
import { AdminHub } from './pages/AdminHub';
import { AdminCriarEvento } from './pages/AdminCriarEvento';
import { AdminEventoTipoEscolha } from './pages/AdminEventoTipoEscolha';
import { AdminEventosHub } from './pages/AdminEventosHub';
import { GeektopiaPage } from './pages/GeektopiaPage';
import { GeektopiaDetalhe } from './pages/GeektopiaDetalhe';
import { AdminEventosLista } from './pages/AdminEventosLista';
import { AdminEdicao } from './pages/AdminEdicao';
import { PedidoConfirmacao } from './pages/PedidoConfirmacao';
import { Dashboard } from './pages/Dashboard';
import { AdminPaginas } from './pages/AdminPaginas';
import { AdminCheckin } from './pages/AdminCheckin';
import { AdminSolicitacoes } from './pages/AdminSolicitacoes';
import { AdminUsuarioForm } from './pages/AdminUsuarioForm';
import { Participar } from './pages/Participar';
import { ExpositorArea } from './pages/ExpositorArea';
import { ExpositorPerfil } from './pages/ExpositorPerfil';
import { ExpositorSolicitar } from './pages/ExpositorSolicitar';
import { ExpositorSolicitacao } from './pages/ExpositorSolicitacao';

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<PrivateRoute apenasCliente><Perfil /></PrivateRoute>} />
        <Route path="/pedido/:id/confirmacao" element={<PrivateRoute><PedidoConfirmacao /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
        <Route path="/admin/usuarios" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/usuarios/novo" element={<AdminRoute><AdminUsuarioForm /></AdminRoute>} />
        <Route path="/admin/usuarios/:id/editar" element={<AdminRoute><AdminUsuarioForm /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/eventos/criar" element={<AdminRoute><AdminEventoTipoEscolha /></AdminRoute>} />
        <Route path="/admin/eventos/criar/:tipo" element={<AdminRoute><AdminCriarEvento /></AdminRoute>} />
        <Route path="/admin/paginas" element={<AdminRoute><AdminPaginas /></AdminRoute>} />
        <Route path="/admin/checkin" element={<AdminRoute><AdminCheckin /></AdminRoute>} />
        <Route path="/admin/solicitacoes" element={<AdminRoute><AdminSolicitacoes /></AdminRoute>} />
        <Route path="/admin/espacos" element={<Navigate to="/admin/eventos/lista" replace />} />
        <Route path="/participar" element={<PrivateRoute apenasCliente><Participar /></PrivateRoute>} />
        <Route path="/expositor" element={<PrivateRoute apenasCliente><ExpositorArea /></PrivateRoute>} />
        <Route path="/expositor/perfil" element={<PrivateRoute apenasCliente><ExpositorPerfil /></PrivateRoute>} />
        <Route path="/expositor/solicitar" element={<PrivateRoute apenasCliente><ExpositorSolicitar /></PrivateRoute>} />
        <Route path="/expositor/solicitacoes/:id" element={<PrivateRoute apenasCliente><ExpositorSolicitacao /></PrivateRoute>} />
        <Route path="/admin/eventos" element={<AdminRoute><AdminEventosHub /></AdminRoute>} />
        <Route path="/admin/eventos/lista" element={<AdminRoute><AdminEventosLista /></AdminRoute>} />
        <Route path="/admin/eventos/:id/:aba?" element={<AdminRoute><AdminEdicao /></AdminRoute>} />
        <Route path="/competidor" element={<PrivateRoute apenasCliente><CompetidorArea /></PrivateRoute>} />
        <Route path="/competicoes/:id" element={<CompeticaoDetalhe />} />
        <Route path="/geektopia" element={<GeektopiaPage />} />
        <Route path="/geektopia/:id" element={<GeektopiaDetalhe />} />
        <Route path="/geektopia/:id/comprar" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}