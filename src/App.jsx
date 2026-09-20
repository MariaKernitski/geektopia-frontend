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

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
        <Route path="/admin/usuarios" element={<AdminRoute><Admin /></AdminRoute>} /> 
      </Routes>
    </BrowserRouter>
  );
}