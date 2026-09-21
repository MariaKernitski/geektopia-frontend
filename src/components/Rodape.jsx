import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { LANDING_PADRAO } from '../utils/landingPadrao';
import ccpopLogo from '../assets/LOGO_CCPOP.png';
import '../style/Rodape.css';

// Rodapé do site, o mesmo na landing page e na página da Geektopia. Nome e Instagram
// vêm do que o admin editou em "Página inicial" (com o padrão como reserva).
export function Rodape() {
  const buscar = useCallback(() => api.get('/conteudo/landing').then((r) => r.data), []);
  const { dados } = useCarga(buscar);
  const info = (dados || LANDING_PADRAO).rodape;

  const token = localStorage.getItem('@Geektopia:token');
  let ehAdmin = false;
  try { ehAdmin = Boolean(JSON.parse(localStorage.getItem('@Geektopia:user') || 'null')?.administrador); } catch { /* ignora */ }

  return (
    <footer className="rd">
      <div className="rd-container rd-grid">
        <div className="rd-marca">
          <img src={ccpopLogo} alt="" />
          <span>{info.nome}</span>
        </div>
        <nav aria-label="Links do rodapé">
          <Link to="/">Início</Link>
          <Link to="/geektopia">Geektopia</Link>
          {token ? <Link to={ehAdmin ? '/admin' : '/perfil'}>{ehAdmin ? 'Painel' : 'Meu perfil'}</Link> : <Link to="/login">Entrar</Link>}
          {info.instagram && <a href={info.instagram} target="_blank" rel="noopener noreferrer"><FiInstagram aria-hidden="true" /> Instagram</a>}
        </nav>
      </div>
      <p className="rd-copy">© {new Date().getFullYear()} CCPOP — Ponta Grossa, Paraná</p>
    </footer>
  );
}
