import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { Rodape } from '../components/Rodape';
import '../style/Ajuda.css';

const ROTULO_PUBLICO = { visitante: 'Visitante', competidor: 'Competidor', expositor: 'Expositor', organizador: 'Organizador', admin: 'Equipe CCPOP' };

function CartaoArtigo({ a }) {
  return (
    <li>
      <Link to={`/ajuda/${a.id}`} className="aj-artigo-link">
        <strong>{a.titulo}</strong>
        <span>{a.resumo}</span>
      </Link>
    </li>
  );
}

// Central de Ajuda: guia de uso da plataforma. O conteúdo vem do servidor (/api/ajuda), com busca.
export function Ajuda() {
  const { id } = useParams();
  return (
    <>
      <main className="aj-pagina">
        {id ? <Artigo id={id} /> : <Indice />}
      </main>
      <Rodape />
    </>
  );
}

function Indice() {
  const buscarIndice = useCallback(() => api.get('/ajuda').then((r) => r.data), []);
  const { dados, erro, carregando, recarregar } = useCarga(buscarIndice);
  const [termo, setTermo] = useState('');
  const [busca, setBusca] = useState(null); // { termo, resultados, sugestoes } | null
  const [buscando, setBuscando] = useState(false);

  // Busca depois de a pessoa parar de digitar.
  useEffect(() => {
    const t = termo.trim();
    if (t.length < 2) return undefined;
    let ativo = true;
    const espera = setTimeout(() => {
      setBuscando(true);
      api.get('/ajuda/busca', { params: { q: t } })
        .then((r) => { if (ativo) setBusca(r.data); })
        .catch(() => { if (ativo) setBusca({ termo: t, resultados: [], sugestoes: [], falhou: true }); })
        .finally(() => { if (ativo) setBuscando(false); });
    }, 300);
    return () => { ativo = false; clearTimeout(espera); };
  }, [termo]);

  const pesquisando = termo.trim().length >= 2;

  return (
    <>
      <header className="aj-topo">
        <h1><FiBookOpen aria-hidden="true" /> Central de ajuda</h1>
        <p>Passo a passo para usar o site: criar conta, comprar ingresso, se inscrever em competições, pedir espaço de expositor e mais.</p>
        <div className="aj-busca">
          <FiSearch aria-hidden="true" />
          <label htmlFor="aj-q" className="ed-sr-only">Buscar na ajuda</label>
          <input id="aj-q" type="search" placeholder="O que você quer fazer? Ex.: comprar ingresso" value={termo} onChange={(e) => setTermo(e.target.value)} autoComplete="off" />
        </div>
      </header>

      {carregando ? <p className="aj-aviso" aria-busy="true">Carregando a ajuda...</p>
        : erro ? <div className="aj-aviso" role="alert"><p>{erro}</p><button type="button" className="btn btn-primary" onClick={recarregar}>Tentar de novo</button></div>
        : pesquisando ? (
          <section aria-live="polite" aria-label="Resultados da busca">
            {buscando && !busca ? <p className="aj-aviso">Buscando...</p> : busca?.falhou ? <p className="aj-aviso">Não foi possível buscar agora. Tente de novo.</p> : busca && busca.resultados.length > 0 ? (
              <>
                <h2 className="aj-subtitulo">{busca.total} resultado(s) para “{busca.termo}”</h2>
                <ul className="aj-lista">{busca.resultados.map((a) => <CartaoArtigo key={a.id} a={a} />)}</ul>
              </>
            ) : busca ? (
              <div className="aj-aviso">
                <p>Não encontramos nada para “{busca.termo}”. Tente outra palavra ou veja as categorias abaixo.</p>
                <div className="aj-chips">{(busca.sugestoes || []).map((s) => <button key={s.id} type="button" className="aj-chip" onClick={() => setTermo('')}>{s.titulo}</button>)}</div>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {dados.destaques?.length > 0 && (
              <section aria-labelledby="aj-comuns">
                <h2 id="aj-comuns" className="aj-subtitulo">Dúvidas mais comuns</h2>
                <ul className="aj-lista aj-destaques">{dados.destaques.map((a) => <CartaoArtigo key={a.id} a={a} />)}</ul>
              </section>
            )}
            {dados.categorias.map((c) => (
              <section key={c.id} className="aj-categoria" aria-labelledby={`aj-c-${c.id}`}>
                <h2 id={`aj-c-${c.id}`} className="aj-subtitulo">{c.titulo}</h2>
                <p className="aj-desc">{c.descricao}</p>
                <ul className="aj-lista">{c.artigos.map((a) => <CartaoArtigo key={a.id} a={a} />)}</ul>
              </section>
            ))}
          </>
        )}
    </>
  );
}

function Artigo({ id }) {
  const navigate = useNavigate();
  const buscar = useCallback(() => api.get(`/ajuda/artigos/${encodeURIComponent(id)}`).then((r) => r.data), [id]);
  const { dados, erro, carregando } = useCarga(buscar);

  return (
    <article>
      <Link to="/ajuda" className="aj-voltar" onClick={(e) => { if (window.history.length > 1 && document.referrer.includes(window.location.origin)) { e.preventDefault(); navigate(-1); } }}><FiArrowLeft aria-hidden="true" /> Voltar para a central de ajuda</Link>
      {carregando ? <p className="aj-aviso" aria-busy="true">Carregando...</p> : erro || !dados ? (
        <div className="aj-aviso" role="alert"><p>Não encontramos este artigo.</p><Link to="/ajuda" className="btn btn-primary">Ver toda a ajuda</Link></div>
      ) : (
        <>
          <h1 className="aj-titulo-artigo">{dados.titulo}</h1>
          <p className="aj-resumo">{dados.resumo}</p>
          <div className="aj-chips" aria-label="Para quem é">{dados.publicos.map((p) => <span key={p} className="aj-chip is-fixo">{ROTULO_PUBLICO[p] || p}</span>)}</div>
          {dados.passos.length > 0 && (
            <>
              <h2 className="aj-subtitulo">Passo a passo</h2>
              <ol className="aj-passos">{dados.passos.map((p, i) => <li key={i}>{p}</li>)}</ol>
            </>
          )}
          {dados.observacoes.length > 0 && (
            <>
              <h2 className="aj-subtitulo">Bom saber</h2>
              <ul className="aj-obs">{dados.observacoes.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </>
          )}
          {dados.relacionados.length > 0 && (
            <>
              <h2 className="aj-subtitulo">Veja também</h2>
              <ul className="aj-lista">{dados.relacionados.map((r) => <li key={r.id}><Link to={`/ajuda/${r.id}`} className="aj-artigo-link"><strong>{r.titulo}</strong></Link></li>)}</ul>
            </>
          )}
        </>
      )}
    </article>
  );
}
