import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiBookOpen, FiCalendar, FiCheckCircle, FiCompass, FiFilm, FiInstagram, FiMapPin, FiMonitor,
  FiMusic, FiPenTool, FiShield, FiShoppingBag, FiTag, FiUserPlus, FiAward, FiSmartphone
} from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { Contagem } from '../components/publico/Contagem';
import { eventoPassou, periodoEvento } from '../utils/evento';
import ccpopLogo from '../assets/LOGO_CCPOP.png';
import geektopiaTitle from '../assets/GEEKTOPIA-title.png';
import '../style/Publico.css';
import '../style/LandingPage.css';

const RECURSOS = [
  { Icone: FiTag, titulo: 'Ingressos com QR code', texto: 'Compre online, receba na hora e mostre o QR code na entrada. Sem fila para retirar.' },
  { Icone: FiAward, titulo: 'Competições', texto: 'Cosplay, K-pop, Just Dance e mais. Inscreva-se, acompanhe a análise e garanta a vaga.' },
  { Icone: FiShoppingBag, titulo: 'Espaço para expositores', texto: 'Peça o seu espaço, cadastre ajudantes e veja o andamento do pedido em tempo real.' },
  { Icone: FiShield, titulo: 'Pagamento seguro', texto: 'Pix, cartão e mais pelo Mercado Pago. A confirmação aparece sozinha no seu perfil.' }
];

const PASSOS = [
  { Icone: FiUserPlus, titulo: 'Crie a sua conta', texto: 'Leva poucos minutos e serve para tudo: ingressos, competições e exposição.' },
  { Icone: FiCompass, titulo: 'Escolha como participar', texto: 'Visitar, competir ou expor. Você pode fazer mais de um.' },
  { Icone: FiCheckCircle, titulo: 'Acompanhe pelo perfil', texto: 'Ingressos, inscrições e pagamentos num só lugar, sempre atualizados.' }
];

const CENA = [
  { Icone: FiMonitor, nome: 'Games' }, { Icone: FiFilm, nome: 'Animes' }, { Icone: FiMusic, nome: 'K-pop' },
  { Icone: FiBookOpen, nome: 'RPG' }, { Icone: FiPenTool, nome: 'Artes visuais' }
];

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const partesDaData = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return { dia: String(d.getUTCDate()).padStart(2, '0'), mes: MESES[d.getUTCMonth()] };
};

function CartaoProximo({ edicao, ano, temPockets }) {
  if (edicao) {
    return (
      <aside className="lp-proximo" aria-label="Próximo evento">
        <p className="lp-proximo-rotulo">Próximo evento</p>
        <h2 className="lp-proximo-nome">{edicao.nome_edicao}</h2>
        {edicao.data_inicio && <Contagem dataAlvo={edicao.data_inicio} />}
        <ul className="lp-proximo-fatos">
          {edicao.data_inicio && <li><FiCalendar aria-hidden="true" /> {periodoEvento(edicao.data_inicio, edicao.data_fim)}</li>}
          {edicao.local && <li><FiMapPin aria-hidden="true" /> {edicao.local}</li>}
        </ul>
        <Link to={`/geektopia/${edicao.id_geektopia}`} className="btn btn-primary lp-proximo-cta">Ver detalhes e ingressos <FiArrowRight aria-hidden="true" /></Link>
      </aside>
    );
  }
  return (
    <aside className="lp-proximo" aria-label="Próxima edição">
      <p className="lp-proximo-rotulo">Próxima edição</p>
      <p className="lp-proximo-ano">{ano}</p>
      <p className="lp-proximo-texto">A próxima Geektopia chega em {ano}. Data, local e ingressos serão divulgados aqui assim que forem definidos.</p>
      <Link to={temPockets ? '/geektopia#pockets' : '/geektopia'} className="btn btn-primary lp-proximo-cta">
        {temPockets ? 'Ver os próximos Pockets' : 'Conhecer a Geektopia'} <FiArrowRight aria-hidden="true" />
      </Link>
    </aside>
  );
}

export function LandingPage() {
  const buscar = useCallback(() => api.get('/geektopia/vitrine').then((r) => r.data), []);
  const { dados } = useCarga(buscar);

  const destaque = dados?.destaque && !eventoPassou(dados.destaque) ? dados.destaque : null;
  // Do mais próximo ao mais distante (a API devolve o mais recente primeiro).
  const pockets = [...(dados?.pockets ?? [])].filter((p) => !eventoPassou(p)).sort((a, b) => new Date(a.data_inicio || 8.64e15) - new Date(b.data_inicio || 8.64e15));
  const fotos = (dados?.galeria ?? []).slice(0, 5);
  const ano = dados?.proxima_edicao_ano || new Date().getFullYear() + 1;

  const eventos = [...(destaque ? [{ ...destaque, principal: true }] : []), ...pockets].slice(0, 3);

  const token = localStorage.getItem('@Geektopia:token');
  let ehAdmin = false;
  try { ehAdmin = Boolean(JSON.parse(localStorage.getItem('@Geektopia:user') || 'null')?.administrador); } catch { /* ignora */ }
  const destinoConta = ehAdmin ? '/admin' : '/participar';

  return (
    <div className="lp">
      {/* ------------------------------------------------------------ HERO */}
      <section className="lp-hero" aria-labelledby="lp-titulo">
        <span className="lp-pixels" aria-hidden="true" />
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-texto">
            <p className="lp-selo"><img src={ccpopLogo} alt="" /> Conselho de Cultura POP de Ponta Grossa</p>
            <h1 id="lp-titulo" className="lp-titulo">
              A cena <span>geek e pop</span> de Ponta Grossa começa aqui.
            </h1>
            <p className="lp-lead">
              Ingressos, competições e espaço para expositores da <img src={geektopiaTitle} alt="Geektopia" className="lp-lead-logo" /> e dos Pockets, tudo num só lugar.
            </p>
            <div className="lp-hero-acoes">
              <Link to="/geektopia" className="btn btn-primary lp-btn-grande">Ver a Geektopia <FiArrowRight aria-hidden="true" /></Link>
              {token
                ? <Link to={destinoConta} className="btn lp-btn-claro lp-btn-grande">{ehAdmin ? 'Ir para o painel' : 'Como participar'}</Link>
                : <Link to="/cadastro" className="btn lp-btn-claro lp-btn-grande">Criar conta grátis</Link>}
            </div>
            <ul className="lp-confianca">
              <li><FiCheckCircle aria-hidden="true" /> Compra segura</li>
              <li><FiSmartphone aria-hidden="true" /> Ingresso no celular</li>
              <li><FiCheckCircle aria-hidden="true" /> Acompanhe tudo online</li>
            </ul>
          </div>

          <CartaoProximo edicao={destaque} ano={ano} temPockets={pockets.length > 0} />
        </div>
      </section>

      {/* ---------------------------------------------------------- NÚMEROS */}
      <section className="lp-container lp-numeros-faixa" aria-label="O CCPOP em números">
        <ul className="lp-numeros">
          <li><strong>3</strong><span>edições realizadas desde 2023</span></li>
          <li><strong>+5 mil</strong><span>visitantes na última edição</span></li>
          <li><strong>40+</strong><span>expositores e competidores</span></li>
        </ul>
      </section>

      {/* -------------------------------------------------------- RECURSOS */}
      <section className="lp-secao" aria-labelledby="lp-recursos-t">
        <div className="lp-container">
          <header className="lp-cabecalho">
            <p className="lp-sobretitulo">Plataforma NEXUS</p>
            <h2 id="lp-recursos-t">Tudo o que você precisa para viver a Geektopia</h2>
            <p>Do ingresso à inscrição numa competição, sem planilha, sem fila e sem depender de mensagem.</p>
          </header>
          <ul className="lp-recursos">
            {RECURSOS.map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="lp-recurso">
                <span className="lp-icone"><Icone aria-hidden="true" /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------- COMO FUNCIONA */}
      <section className="lp-secao lp-secao-alt" aria-labelledby="lp-passos-t">
        <div className="lp-container">
          <header className="lp-cabecalho lp-centro">
            <p className="lp-sobretitulo">Como funciona</p>
            <h2 id="lp-passos-t">Três passos e você está dentro</h2>
          </header>
          <ol className="lp-passos">
            {PASSOS.map(({ Icone, titulo, texto }, i) => (
              <li key={titulo} className="lp-passo">
                <span className="lp-passo-num" aria-hidden="true">{i + 1}</span>
                <span className="lp-icone"><Icone aria-hidden="true" /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
          <div className="lp-centro-acao">
            <Link to={token ? destinoConta : '/cadastro'} className="btn btn-primary lp-btn-grande">{token ? (ehAdmin ? 'Ir para o painel' : 'Escolher como participar') : 'Começar agora'} <FiArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- PRÓXIMOS EVENTOS */}
      {eventos.length > 0 && (
        <section className="lp-secao" aria-labelledby="lp-eventos-t">
          <div className="lp-container">
            <header className="lp-cabecalho lp-linha">
              <div>
                <p className="lp-sobretitulo">Agenda</p>
                <h2 id="lp-eventos-t">Próximos eventos</h2>
              </div>
              <Link to="/geektopia" className="lp-link">Ver todos <FiArrowRight aria-hidden="true" /></Link>
            </header>
            <ul className="lp-eventos">
              {eventos.map((e) => {
                const d = partesDaData(e.data_inicio);
                return (
                  <li key={e.id_geektopia}>
                    <Link to={`/geektopia/${e.id_geektopia}`} className="lp-evento">
                      <span className="lp-data" aria-hidden="true">{d ? <><strong>{d.dia}</strong>{d.mes}</> : <strong>?</strong>}</span>
                      <span className="lp-evento-info">
                        <strong>{e.nome_edicao}</strong>
                        <small>{e.data_inicio ? periodoEvento(e.data_inicio, e.data_fim) : 'Data a definir'}{e.local ? ` · ${e.local}` : ''}</small>
                      </span>
                      {e.principal && <span className="lp-chip">Principal</span>}
                      <FiArrowRight className="lp-evento-seta" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- GALERIA */}
      {fotos.length >= 3 && (
        <section className="lp-secao lp-secao-escura" aria-labelledby="lp-galeria-t">
          <div className="lp-container">
            <header className="lp-cabecalho lp-linha">
              <div>
                <p className="lp-sobretitulo">Momentos</p>
                <h2 id="lp-galeria-t">Um gostinho do que já rolou</h2>
              </div>
              <Link to="/geektopia#galeria" className="lp-link">Ver a galeria <FiArrowRight aria-hidden="true" /></Link>
            </header>
            <ul className="lp-mosaico">
              {fotos.map((f) => (
                <li key={f.id_foto}><img src={f.url_foto} alt={f.legenda || `Foto da ${f.edicao}`} loading="lazy" /></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------- CCPOP */}
      <section className="lp-secao" aria-labelledby="lp-ccpop-t">
        <div className="lp-container lp-sobre">
          <img src={ccpopLogo} alt="Selo do CCPOP" className="lp-sobre-selo" />
          <div>
            <p className="lp-sobretitulo">Quem somos</p>
            <h2 id="lp-ccpop-t">Quem é o CCPOP?</h2>
            <p>
              O CCPOP (Conselho de Cultura Pop de Ponta Grossa) é uma entidade organizadora voltada a fomentar, estruturar e expandir a cena geek,
              nerd e pop nos Campos Gerais. Nosso objetivo é inserir Ponta Grossa de vez na rota dos grandes eventos estaduais do setor,
              valorizando a economia criativa e unindo a comunidade entusiasta.
            </p>
            <ul className="lp-cena" aria-label="O que a cena reúne">
              {CENA.map(({ Icone, nome }) => <li key={nome}><Icone aria-hidden="true" /> {nome}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- CTA FINAL */}
      <section className="lp-cta" aria-labelledby="lp-cta-t">
        <span className="lp-pixels" aria-hidden="true" />
        <div className="lp-container lp-cta-conteudo">
          <h2 id="lp-cta-t">Quer expor ou competir na próxima Geektopia?</h2>
          <p>As solicitações de espaço e as inscrições em competições são feitas pela plataforma. A organização analisa e você acompanha o resultado.</p>
          <div className="lp-hero-acoes">
            {token
              ? <Link to={destinoConta} className="btn btn-primary lp-btn-grande">{ehAdmin ? 'Ir para o painel' : 'Escolher como participar'} <FiArrowRight aria-hidden="true" /></Link>
              : <>
                  <Link to="/cadastro" className="btn btn-primary lp-btn-grande">Criar conta grátis <FiArrowRight aria-hidden="true" /></Link>
                  <Link to="/login" className="btn lp-btn-claro lp-btn-grande">Já tenho conta</Link>
                </>}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- RODAPÉ */}
      <footer className="lp-rodape">
        <div className="lp-container lp-rodape-grid">
          <div className="lp-rodape-marca">
            <img src={ccpopLogo} alt="" />
            <span>Conselho de Cultura POP de Ponta Grossa</span>
          </div>
          <nav aria-label="Links do rodapé">
            <Link to="/geektopia">Geektopia</Link>
            {token ? <Link to={ehAdmin ? '/admin' : '/perfil'}>{ehAdmin ? 'Painel' : 'Meu perfil'}</Link> : <Link to="/login">Entrar</Link>}
            <a href="https://instagram.com/ccpop.pg" target="_blank" rel="noopener noreferrer"><FiInstagram aria-hidden="true" /> Instagram</a>
          </nav>
        </div>
        <p className="lp-rodape-copy">© {new Date().getFullYear()} CCPOP — Ponta Grossa, Paraná</p>
      </footer>
    </div>
  );
}
