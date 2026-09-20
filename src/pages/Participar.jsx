import { Link } from 'react-router-dom';
import { FiAward, FiShoppingBag } from 'react-icons/fi';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

// Porta de entrada para quem quer participar da Geektopia além de visitar.
export function Participar() {
  return (
    <div className="ed-pagina ed-pagina-estreita">
      <h1 className="ed-titulo-pagina" style={{ marginBottom: 6 }}>Participe da Geektopia</h1>
      <p className="ed-subtitulo" style={{ marginBottom: 24 }}>Além de visitar, você pode expor o seu trabalho ou competir. Escolha como quer participar.</p>

      <div className="pt-cartoes-participar">
        <Link to="/expositor" className="pt-cartao pt-cartao-link">
          <FiShoppingBag size={28} aria-hidden="true" />
          <span className="pt-cartao-titulo">Quero expor</span>
          <span className="pt-cartao-texto">Tenha uma loja, um estande ou uma mesa de artista nas edições. Crie o perfil, peça o espaço e acompanhe a análise.</span>
        </Link>

        <div className="pt-cartao pt-cartao-link is-desabilitado is-bloqueado" aria-disabled="true">
          <FiAward size={28} aria-hidden="true" />
          <span className="pt-cartao-titulo">Quero competir</span>
          <span className="pt-cartao-texto">Inscreva-se nas competições das edições. <strong>Em breve.</strong></span>
        </div>
      </div>
    </div>
  );
}
