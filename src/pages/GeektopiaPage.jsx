import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiImage, FiInfo, FiMapPin, FiShoppingBag, FiTag, FiAward, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { CartaoCompeticao } from '../components/publico/CartaoCompeticao';
import { Rodape } from '../components/Rodape';
import { AvisoMenores } from '../components/publico/AvisoMenores';
import { Carrossel } from '../components/publico/Carrossel';
import { Contagem } from '../components/publico/Contagem';
import { NavInterna } from '../components/publico/NavInterna';
import { descricaoClassificacao, seloClassificacao } from '../utils/idade';
import { eventoPassou, horarioEvento, linkMapa, moeda, periodoEvento, seloDeData } from '../utils/evento';
import { COR_PADRAO, ehHexValido } from '../utils/cores';
import { cssDoFundo } from '../utils/fundo';
import letreiro from '../assets/GEEKTOPIA-title.png';
import '../style/Publico.css';
import '../style/GeektopiaPage.css';

const iniciais = (nome = '') => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function CabecalhoSecao({ id, titulo, texto }) {
  return (
    <header className="pb-cabecalho">
      <h2 className="pb-titulo" id={id}>{titulo}</h2>
      {texto && <p className="pb-lead">{texto}</p>}
    </header>
  );
}

// Situação de venda em linguagem de visitante.
function situacaoDeVenda(edicao) {
  const ing = edicao.ingressos;
  if (eventoPassou(edicao)) return { texto: 'Evento encerrado', tipo: 'neutro' };
  if (edicao.status_evento === 'VendasEncerradas') return { texto: 'Vendas encerradas', tipo: 'aviso' };
  if (!ing || ing.qtd_lotes === 0) return { texto: 'Ingressos em breve', tipo: 'neutro' };
  if (ing.esgotado) return { texto: 'Ingressos esgotados', tipo: 'erro' };
  return { texto: 'Vendas abertas', tipo: 'ok' };
}

// ---------------------------------------------------------------- HERO
function Hero({ edicao, temSobre }) {
  const passou = eventoPassou(edicao);
  const venda = situacaoDeVenda(edicao);
  const podeComprar = venda.tipo === 'ok';
  const selo = seloClassificacao(edicao.classificacao_etaria);
  const horario = horarioEvento(edicao.data_inicio, edicao.data_fim);
  const mostraNome = edicao.nome_edicao.trim().toUpperCase() !== 'GEEKTOPIA';
  const fundoCor = cssDoFundo(edicao.banner_fundo); // cor/gradiente escolhido no lugar da imagem

  return (
    <section className={`pb-hero vt-hero ${fundoCor ? 'vt-hero-cor' : ''}`} style={fundoCor ? { background: fundoCor } : undefined} aria-labelledby="vt-titulo">
      {fundoCor ? <span className="vt-pixels" aria-hidden="true" /> : edicao.banner_url && <img className="vt-hero-fundo" src={edicao.banner_url} alt="" />}
      <div className="vt-hero-veu" />

      <div className="pb-container vt-hero-conteudo">
        <div className="vt-hero-texto">
          <p className="vt-eyebrow">
            {passou ? 'Edição encerrada' : 'Próxima edição'}
            {venda.tipo === 'ok' && <span className="pb-chip is-destaque">Vendas abertas</span>}
          </p>

          <h1 id="vt-titulo" className="vt-titulo">
            <img src={letreiro} alt="GEEKTOPIA" className="vt-letreiro" />
            {mostraNome && <span className="vt-edicao">{edicao.nome_edicao}</span>}
          </h1>

          {edicao.tagline && <p className="vt-tagline">{edicao.tagline}</p>}

          <ul className="vt-fatos">
            <li><FiCalendar aria-hidden="true" /><span><strong>{periodoEvento(edicao.data_inicio, edicao.data_fim)}</strong>{horario && <small>{horario}</small>}</span></li>
            {edicao.local && (
              <li><FiMapPin aria-hidden="true" /><span><strong>{edicao.local}</strong><a href={linkMapa(edicao.local)} target="_blank" rel="noreferrer">Ver no mapa ↗</a></span></li>
            )}
            {selo && <li><span className="selo-idade vt-selo" aria-hidden="true">{selo}</span><span><strong>{descricaoClassificacao(edicao.classificacao_etaria)}</strong></span></li>}
          </ul>

          <div className="vt-hero-acoes">
            <Link to={`/geektopia/${edicao.id_geektopia}#ingressos`} className="btn btn-primary pb-btn-grande">
              {podeComprar ? 'Comprar ingressos' : passou ? 'Rever a edição' : 'Ver detalhes do evento'} <FiArrowRight aria-hidden="true" />
            </Link>
            {temSobre && <a href="#sobre" className="btn pb-btn-claro pb-btn-grande">Conhecer o evento</a>}
          </div>
        </div>

        {!passou && edicao.data_inicio && (
          <div className="vt-hero-contagem">
            <p>Faltam</p>
            <Contagem dataAlvo={edicao.data_inicio} />
          </div>
        )}
      </div>

    </section>
  );
}

// Sem Geektopia Principal publicada: mesmo palco do hero de uma edição, mas sem
// data, local nem ingressos (ainda não existem). Só avisa o ano da próxima.
function HeroSemEdicao({ ano, temPockets }) {
  return (
    <section className="pb-hero vt-hero vt-hero-generico" aria-labelledby="vt-titulo">
      <span className="vt-pixels" aria-hidden="true" />
      <div className="vt-hero-veu" />
      <div className="pb-container vt-hero-conteudo">
        <div className="vt-hero-texto">
          <p className="vt-eyebrow">Próxima edição</p>
          <h1 id="vt-titulo" className="vt-titulo">
            <img src={letreiro} alt="GEEKTOPIA" className="vt-letreiro" />
            {ano && <span className="vt-edicao">{ano}</span>}
          </h1>
          <p className="vt-tagline">
            {ano ? `A próxima Geektopia chega em ${ano}.` : 'A próxima Geektopia será anunciada em breve.'} Data, local e ingressos serão divulgados aqui assim que forem definidos.
          </p>
          <div className="vt-hero-acoes">
            {temPockets ? <a href="#pockets" className="btn btn-primary pb-btn-grande">Ver os Pockets <FiArrowRight aria-hidden="true" /></a> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------- COMO PARTICIPAR
function ComoParticipar({ edicao, temCompeticoes, conteudo }) {
  const venda = situacaoDeVenda(edicao);
  const preco = edicao.ingressos?.preco_a_partir;

  return (
    <section className="pb-secao vt-participar" aria-labelledby="vt-participar-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-participar-t" titulo={conteudo.titulo} texto={conteudo.texto || undefined} />
        <div className="vt-caminhos">
          <Link to={`/geektopia/${edicao.id_geektopia}#ingressos`} className="pb-cartao vt-caminho">
            <span className="vt-caminho-icone" aria-hidden="true"><FiTag /></span>
            <h3>Visitante</h3>
            <p>Garanta o seu ingresso e viva dois dias de cultura pop.</p>
            <span className="vt-caminho-info">{preco !== null && preco !== undefined && venda.tipo === 'ok' ? `A partir de ${moeda(preco)}` : venda.texto}</span>
            <span className="vt-caminho-acao">Ver ingressos <FiArrowRight aria-hidden="true" /></span>
          </Link>

          <Link to="/expositor" className="pb-cartao vt-caminho">
            <span className="vt-caminho-icone" aria-hidden="true"><FiShoppingBag /></span>
            <h3>Expositor</h3>
            <p>Tenha uma loja, um estande ou uma mesa de artista no evento.</p>
            <span className="vt-caminho-info">Peça seu espaço e acompanhe a análise</span>
            <span className="vt-caminho-acao">Quero expor <FiArrowRight aria-hidden="true" /></span>
          </Link>

          {temCompeticoes ? (
            <a href="#competicoes" className="pb-cartao vt-caminho">
              <span className="vt-caminho-icone" aria-hidden="true"><FiAward /></span>
              <h3>Competidor</h3>
              <p>Mostre o seu talento em concursos de cosplay, torneios e danças.</p>
              <span className="vt-caminho-info">Veja as competições abertas</span>
              <span className="vt-caminho-acao">Ver competições <FiArrowRight aria-hidden="true" /></span>
            </a>
          ) : (
            <div className="pb-cartao vt-caminho is-em-breve">
              <span className="vt-caminho-icone" aria-hidden="true"><FiAward /></span>
              <h3>Competidor</h3>
              <p>Mostre o seu talento em concursos de cosplay, torneios e danças.</p>
              <span className="vt-caminho-info">Competições em breve</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ SOBRE
function diasDoEvento(edicao) {
  if (!edicao.data_inicio || !edicao.data_fim) return 0;
  const ini = new Date(edicao.data_inicio); const fim = new Date(edicao.data_fim);
  const dias = Math.round((Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth(), fim.getUTCDate()) - Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth(), ini.getUTCDate())) / 86400000) + 1;
  return dias > 0 && dias < 15 ? dias : 0;
}

// "Sobre" em faixa escura: parágrafo de abertura grande, texto corrido, cartões de
// destaques e uma régua de números tirados dos dados reais da edição.
const CONTEUDO_PADRAO = {
  sobre: { titulo: 'Sobre a Geektopia', texto: '', destaques: [] },
  galeria: { titulo: 'Galeria de fotos', texto: 'Um gostinho do que já rolou na Geektopia. Arraste ou use as setas.' },
  participar: { titulo: 'Como você quer participar?', texto: 'Escolha o seu papel na Geektopia. Você pode ser mais de um.' }
};

// Texto geral da Geektopia (editado em Páginas informativas): não depende de nenhuma edição.
// Os números abaixo dele, sim, vêm da edição em destaque.
function Sobre({ conteudo, edicao }) {
  const paragrafos = (conteudo.texto || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const destaques = Array.isArray(conteudo.destaques) ? conteudo.destaques : [];
  const [abertura, ...resto] = paragrafos;

  const dias = edicao ? diasDoEvento(edicao) : 0;
  const numeros = edicao ? [
    dias > 0 && { valor: dias, rotulo: dias === 1 ? 'dia de evento' : 'dias de evento' },
    edicao.convidados.length > 0 && { valor: edicao.convidados.length, rotulo: edicao.convidados.length === 1 ? 'convidado' : 'convidados' },
    edicao.competicoes.length > 0 && { valor: edicao.competicoes.length, rotulo: edicao.competicoes.length === 1 ? 'competição' : 'competições' },
    edicao.expositores.length > 0 && { valor: edicao.expositores.length, rotulo: edicao.expositores.length === 1 ? 'expositor' : 'expositores' }
  ].filter(Boolean) : [];

  return (
    <section className="pb-secao is-escura vt-sobre-sec" id="sobre" aria-labelledby="vt-sobre-t">
      <span className="vt-pixels" aria-hidden="true" />
      <div className="pb-container">
        <CabecalhoSecao id="vt-sobre-t" titulo={conteudo.titulo} />
        <div className={`vt-sobre ${destaques.length ? 'tem-destaques' : ''}`}>
          <div className="vt-sobre-texto">
            {abertura && <p className="is-primeiro">{abertura}</p>}
            {resto.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {destaques.length > 0 && (
            <ul className="vt-destaques">
              {destaques.map((d, i) => (
                <li className="vt-destaque" key={i}>
                  <span className="vt-destaque-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{d.titulo}</strong>
                  {d.descricao && <span>{d.descricao}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        {numeros.length > 1 && (
          <ul className="vt-numeros" aria-label="A edição em números">
            {numeros.map((n) => (
              <li key={n.rotulo}><strong>{n.valor}</strong><span>{n.rotulo}</span></li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------- CONVIDADOS
function Convidados({ convidados }) {
  return (
    <section className="pb-secao" id="convidados" aria-labelledby="vt-conv-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-conv-t" titulo="Convidados" texto="Artistas, criadores e nomes que vão passar pelo palco e pelos estandes." />
        <ul className="vt-convidados">
          {convidados.map((c) => (
            <li className="pb-cartao vt-convidado" key={c.id_convidado}>
              <div className="vt-convidado-foto">
                {c.foto_url ? <img src={c.foto_url} alt={`Foto de ${c.nome}`} loading="lazy" /> : <span aria-hidden="true">{iniciais(c.nome)}</span>}
              </div>
              <div className="vt-convidado-info">
                {c.titulo_papel && <span className="pb-chip is-destaque">{c.titulo_papel}</span>}
                <h3>{c.nome}</h3>
                {c.descricao && <p>{c.descricao}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------- GALERIA
function Galeria({ fotos, conteudo }) {
  return (
    <section className="pb-secao is-escura" id="galeria" aria-labelledby="vt-gal-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-gal-t" titulo={conteudo.titulo} texto={conteudo.texto || undefined} />
        <Carrossel
          rotulo="Fotos da Geektopia" autoplay={5000} itens={fotos.map((f) => ({ ...f, id: f.id_foto }))} classeItem="vt-foto-item"
          renderItem={(f) => (
            <figure className="vt-foto">
              <img src={f.url_foto} alt={f.legenda || 'Foto da Geektopia'} loading="lazy" />
              {f.legenda && <figcaption><span>{f.legenda}</span></figcaption>}
            </figure>
          )}
        />
      </div>
    </section>
  );
}

// ------------------------------------------------------------- EXPOSITORES
function Expositores({ expositores }) {
  return (
    <section className="pb-secao" id="expositores" aria-labelledby="vt-expo-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-expo-t" titulo="Expositores confirmados" texto="Lojas, artistas e projetos que já garantiram o espaço." />
        <Carrossel
          rotulo="Expositores confirmados" itens={expositores.map((e) => ({ ...e, id: e.id_solicitacao }))} classeItem="vt-expo-item"
          renderItem={(e) => {
            const miolo = (
              <>
                <span className="vt-expo-logo">{e.logo_url ? <img src={e.logo_url} alt="" loading="lazy" /> : <span aria-hidden="true">{iniciais(e.nome)}</span>}</span>
                <strong>{e.nome}</strong>
                {(e.tipo || e.tipo_espaco) && <small>{e.tipo || e.tipo_espaco}</small>}
                {e.link && <span className="vt-expo-link">Conhecer ↗</span>}
              </>
            );
            return e.link
              ? <a className="pb-cartao vt-expo" href={e.link} target="_blank" rel="noreferrer noopener" aria-label={`${e.nome} (abre em nova aba)`}>{miolo}</a>
              : <div className="pb-cartao vt-expo">{miolo}</div>;
          }}
        />
        <p className="vt-chamada">Quer estar aqui? <Link to="/expositor">Solicite o seu espaço <FiArrowRight aria-hidden="true" /></Link></p>
      </div>
    </section>
  );
}

// ------------------------------------------------------------- COMPETIÇÕES
function Competicoes({ competicoes }) {
  return (
    <section className="pb-secao is-alt" id="competicoes" aria-labelledby="vt-comp-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-comp-t" titulo="Competições" texto="Concursos e torneios com inscrição aberta para a comunidade." />
        <ul className="vt-competicoes">
          {competicoes.map((c) => <CartaoCompeticao key={c.id_competicao} c={c} classe="vt-competicao" />)}
        </ul>
        <p className="vt-chamada">Clique em uma competição para ver os detalhes e se inscrever. É preciso ter conta no site.</p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------- POCKETS
function CartaoPocket({ p }) {
  const venda = situacaoDeVenda(p);
  const selo = seloDeData(p.data_inicio);
  const preco = p.ingressos?.preco_a_partir;
  const cls = seloClassificacao(p.classificacao_etaria);

  return (
    <Link to={`/geektopia/${p.id_geektopia}`} className={`pb-cartao vt-pocket ${venda.tipo === 'neutro' && eventoPassou(p) ? 'is-passado' : ''}`}>
      <div className="vt-pocket-capa" style={!p.banner_url && cssDoFundo(p.banner_fundo) ? { background: cssDoFundo(p.banner_fundo) } : undefined}>
        {p.banner_url ? <img src={p.banner_url} alt="" loading="lazy" /> : <img className="vt-pocket-letreiro" src={letreiro} alt="" />}
        <span className={`pb-chip vt-pocket-status is-${venda.tipo === 'neutro' ? 'escuro' : venda.tipo}`}>{venda.texto}</span>
        {selo && <span className="vt-selo-data" aria-hidden="true"><strong>{selo.dia}</strong>{selo.mes}</span>}
      </div>
      <div className="vt-pocket-corpo">
        <h3>{p.nome_edicao}</h3>
        <p className="vt-pocket-linha"><FiCalendar aria-hidden="true" /> {periodoEvento(p.data_inicio, p.data_fim)}{p.data_inicio && ` · ${horarioEvento(p.data_inicio, p.data_fim)}`}</p>
        {p.local && <p className="vt-pocket-linha"><FiMapPin aria-hidden="true" /> {p.local}</p>}
        <div className="vt-pocket-rodape">
          <span className="vt-pocket-preco">{preco !== null && preco !== undefined && venda.tipo === 'ok' ? <>a partir de <strong>{moeda(preco)}</strong></> : ''}</span>
          {cls && <span className="selo-idade" aria-label={descricaoClassificacao(p.classificacao_etaria)}>{cls}</span>}
        </div>
      </div>
    </Link>
  );
}
function Pockets({ pockets }) {
  return (
    <section className="pb-secao is-alt" id="pockets" aria-labelledby="vt-pk-t">
      <div className="pb-container">
        <CabecalhoSecao id="vt-pk-t" titulo="Geektopia Pocket" texto="Edições menores ao longo do ano. Confira data, local e ingressos e escolha a sua." />

        {pockets.length === 0 ? (
          <p className="pb-vazio">Nenhum Pocket aberto agora. Em breve novas datas por aqui.</p>
        ) : (
          <ul className="vt-pockets">{pockets.map((p) => <li key={p.id_geektopia}><CartaoPocket p={p} /></li>)}</ul>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------------- PÁGINA
export function GeektopiaPage() {
  const buscar = useCallback(() => api.get('/geektopia/vitrine').then((r) => r.data), []);
  const { dados, erro, carregando, recarregar } = useCarga(buscar);

  const edicao = dados?.destaque || null;
  const galeria = dados?.galeria ?? [];
  const conteudo = { ...CONTEUDO_PADRAO, ...(dados?.conteudo || {}) };
  const temSobre = Boolean(conteudo.sobre.texto || conteudo.sobre.destaques?.length);
  // Só os Pockets que ainda vão acontecer, do mais próximo ao mais distante: os encerrados saem da página.
  const pockets = useMemo(
    () => (dados?.pockets ?? []).filter((p) => !eventoPassou(p)).sort((a, b) => new Date(a.data_inicio || 8.64e15) - new Date(b.data_inicio || 8.64e15)),
    [dados]
  );

  const secoes = useMemo(() => {
    const lista = [];
    if (temSobre) lista.push({ id: 'sobre', rotulo: 'Sobre', Icone: FiInfo });
    if (edicao) {
      if (edicao.convidados.length) lista.push({ id: 'convidados', rotulo: 'Convidados', Icone: FiUsers });
      if (galeria.length) lista.push({ id: 'galeria', rotulo: 'Galeria', Icone: FiImage });
      if (edicao.expositores.length) lista.push({ id: 'expositores', rotulo: 'Expositores', Icone: FiShoppingBag });
      if (edicao.competicoes.length) lista.push({ id: 'competicoes', rotulo: 'Competições', Icone: FiAward });
    }
    if (pockets.length) lista.push({ id: 'pockets', rotulo: 'Pockets', Icone: FiCalendar });
    return lista;
  }, [edicao, temSobre, galeria.length, pockets.length]);

  if (carregando) {
    return (
      <main className="pb-pagina vt-pagina" aria-busy="true">
        <div className="vt-esqueleto" aria-hidden="true" />
        <p className="pb-carregando">Carregando a Geektopia...</p>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="pb-pagina vt-pagina">
        <div className="pb-carregando" role="alert">
          <p>Não foi possível carregar a página agora.</p>
          <button type="button" className="btn btn-primary" onClick={recarregar}>Tentar de novo</button>
        </div>
      </main>
    );
  }

  const cor = edicao && ehHexValido(edicao.cor_destaque) ? edicao.cor_destaque : COR_PADRAO;

  return (
    <>
    <main className="pb-pagina vt-pagina" style={{ '--cor-edicao': cor }}>
      {edicao ? (
        <Hero edicao={edicao} temSobre={temSobre} />
      ) : (
        <HeroSemEdicao ano={dados?.proxima_edicao_ano} temPockets={pockets.length > 0} />
      )}

      {edicao && <AvisoMenores />}

      {secoes.length > 0 && (
        <NavInterna
          secoes={secoes}
          cta={edicao && <Link to={`/geektopia/${edicao.id_geektopia}#ingressos`} className="btn btn-primary pb-nav-cta">Ingressos</Link>}
        />
      )}

      {edicao && <ComoParticipar edicao={edicao} temCompeticoes={edicao.competicoes.length > 0} conteudo={conteudo.participar} />}
      {temSobre && <Sobre conteudo={conteudo.sobre} edicao={edicao} />}
      {edicao && edicao.convidados.length > 0 && <Convidados convidados={edicao.convidados} />}
      {galeria.length > 0 && <Galeria fotos={galeria} conteudo={conteudo.galeria} />}
      {edicao && edicao.expositores.length > 0 && <Expositores expositores={edicao.expositores} />}
      {edicao && edicao.competicoes.length > 0 && <Competicoes competicoes={edicao.competicoes} />}
      <Pockets pockets={pockets} />
    </main>
    <Rodape />
    </>
  );
}
