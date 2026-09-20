import { Cronometro } from '../components/Cronometro';
import '../style/LandingPage.css';
import ccpopLogo from '../assets/LOGO_CCPOP.png';
import geektopiaTitle from '../assets/GEEKTOPIA-title.png';

export function LandingPage() {
  return (
    <div className="landing-page">

      <section className="landing-hero">
        <div className="landing-hero-grid">
          <div>
            <p className="landing-eyebrow">Conselho de Cultura POP de Ponta Grossa</p>
            <img src={geektopiaTitle} alt="GEEKTOPIA" className="landing-title-img" />
            <h1 className="landing-title">O maior encontro geek da região tem data marcada</h1>
            <p className="landing-sub">
              Ingressos, competições, exposições e credenciamento da{' '}
              <span className="landing-pixel-word">GEEKTOPIA</span> — tudo em um só lugar.
            </p>
            <div className="landing-hero-ctas">
              <a href="/geektopia" className="btn btn-primary">Garantir ingresso</a>
              <a href="/eventos" className="btn btn-secondary">Ver programação</a>
            </div>
          </div>

          <div className="landing-hero-divider" />

          <div className="landing-panel">
            <div className="landing-panel-label">Contagem regressiva</div>
            <Cronometro />
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div className="landing-stat">
          <div className="landing-stat-num">3 edições</div>
          <div className="landing-stat-label">realizadas desde 2023</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">+5 mil</div>
          <div className="landing-stat-label">visitantes na última edição</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">40+</div>
          <div className="landing-stat-label">expositores e competidores</div>
        </div>
      </section>

      <section className="landing-section landing-bordered">
        <h2 className="landing-section-title">Edições anteriores</h2>
        <div className="landing-gallery">
          <div className="landing-gallery-card">Cosplay — Ed. 2025</div>
          <div className="landing-gallery-card">Competições — Ed. 2025</div>
          <div className="landing-gallery-card">Expositores — Ed. 2024</div>
          <div className="landing-gallery-card">Público — Ed. 2024</div>
        </div>
      </section>

      <section className="landing-section landing-about landing-bordered">
        <div className="landing-about-grid">
          <div>
            <h3 className="landing-about-title">Quem é o CCPOP</h3>
            <p className="landing-about-text">
              O Conselho de Cultura POP de Ponta Grossa é uma empresa promotora e organizadora de eventos geek, nerd e otaku na cidade de Ponta Grossa, Paraná.
              O CCPOP-PG é responsável pela organização do maior evento geek de Ponta Grossa, o GEEKTOPIA.
            </p>
          </div>
          <img src={ccpopLogo} alt="Logo CCPOP" className="landing-about-badge" />
        </div>
      </section>

      <section className="landing-section landing-bordered">
        <div className="landing-cta-panel">
          <div>
            <h3 className="landing-cta-title">Quer expor ou competir?</h3>
            <p className="landing-cta-sub">Submissões para expositores e competidores da próxima GEEKTOPIA estão abertas.</p>
          </div>
          <a href="/perfil" className="btn btn-secondary">Fazer submissão</a>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Conselho de Cultura POP de Ponta Grossa — 2026</span>
        <a href="https://instagram.com/ccpop.pg" target="_blank" rel="noreferrer">Instagram</a>
      </footer>

    </div>
  );
}