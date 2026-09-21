import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { useSearchParams } from 'react-router-dom';
import { AbasPaginas } from '../components/paginas/AbasPaginas';
import { AdminPaginaGeektopia } from './AdminPaginaGeektopia';
import { partesDoTitulo } from '../utils/landingPadrao';
import '../style/AdminEdicao.css';
import '../style/AdminPaginas.css';

// Administrar Páginas Informativas: por enquanto, a landing page (textos, números e chamadas).
export function AdminPaginas() {
  const [params] = useSearchParams();
  if (params.get('pagina') === 'geektopia') return <AdminPaginaGeektopia />;
  return <AdminPaginaInicial />;
}

function AdminPaginaInicial() {
  const buscar = useCallback(async () => {
    const [conteudo, sugestoes] = await Promise.all([api.get('/conteudo/landing'), api.get('/conteudo/sugestoes').catch(() => ({ data: null }))]);
    return { conteudo: conteudo.data, sugestoes: sugestoes.data };
  }, []);
  const carga = useCarga(buscar);

  if (carga.carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;
  if (!carga.dados) {
    return <div className="ed-pagina ed-pagina-estreita"><Link to="/admin" className="btn btn-secondary ed-voltar">← Painel</Link><div className="ed-aviso is-erro" role="alert">{carga.erro || 'Não foi possível carregar a página.'}</div></div>;
  }
  return <Formulario conteudo={carga.dados.conteudo} sugestoes={carga.dados.sugestoes} recarregar={carga.recarregar} />;
}

function ListaTextos({ rotulo, itens, max, maxLen, onChange, exemplo }) {
  return (
    <div className="ap-lista">
      <span className="ap-rotulo">{rotulo}</span>
      {itens.map((t, i) => (
        <div className="ap-linha" key={i}>
          <input value={t} maxLength={maxLen} aria-label={`${rotulo} ${i + 1}`} onChange={(e) => onChange(itens.map((x, k) => (k === i ? e.target.value : x)))} placeholder={exemplo} />
          <button type="button" className="ed-icone-btn is-perigo" aria-label={`Remover ${rotulo} ${i + 1}`} onClick={() => onChange(itens.filter((_, k) => k !== i))}><FiTrash2 aria-hidden="true" /></button>
        </div>
      ))}
      {itens.length < max && <button type="button" className="btn btn-secondary ed-btn-sm ap-add" onClick={() => onChange([...itens, ''])}><FiPlus aria-hidden="true" /> Adicionar</button>}
    </div>
  );
}

function Formulario({ conteudo, sugestoes, recarregar }) {
  const { aviso, mostrar, limpar } = useAviso();
  const [f, setF] = useState(() => JSON.parse(JSON.stringify(conteudo)));
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [restaurar, setRestaurar] = useState(false);

  const mudar = (secao, campo, valor) => { setF((x) => ({ ...x, [secao]: { ...x[secao], [campo]: valor } })); setAlterado(true); };
  const mudarNumeros = (numeros) => { setF((x) => ({ ...x, numeros })); setAlterado(true); };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();
    setSalvando(true);
    try {
      const corpo = { hero: f.hero, numeros: f.numeros, sobre: f.sobre, chamada: f.chamada, rodape: f.rodape };
      const res = await api.put('/conteudo/landing', corpo);
      mostrar('sucesso', `${res.data.message} As mudanças já aparecem na página inicial.`);
      setAlterado(false);
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar. Tente de novo.'));
    } finally {
      setSalvando(false);
    }
  };

  const restaurarPadrao = async () => {
    setRestaurar(false);
    try {
      const res = await api.delete('/conteudo/landing');
      setF(JSON.parse(JSON.stringify(res.data)));
      setAlterado(false);
      mostrar('sucesso', res.data.message);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível restaurar os textos.'));
    }
  };

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <Link to="/admin" className="btn btn-secondary ed-voltar">← Painel</Link>
      <div className="ed-lista-cabecalho">
        <h1 className="ed-titulo-pagina">Editar: Página inicial</h1>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Ver a página <FiExternalLink aria-hidden="true" /></a>
      </div>
      <AbasPaginas atual="inicial" />
      <p className="ed-ajuda-topo">Edite os textos e os números da página inicial do site. O que ficar em branco (nos campos obrigatórios) não é aceito; para voltar ao texto original, use “Restaurar textos padrão”.</p>
      <AvisoBox aviso={avisoDaTela(aviso, null)} />

      <form onSubmit={salvar} className="ap-form" noValidate>
        <section className="ed-painel" aria-labelledby="ap-hero">
          <h2 id="ap-hero" className="ed-titulo">Topo da página</h2>
          <div className="ed-campo">
            <label htmlFor="ap-selo">Etiqueta acima do título</label>
            <input id="ap-selo" value={f.hero.selo} maxLength={80} onChange={(e) => mudar('hero', 'selo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="ap-titulo">Título principal</label>
            <input id="ap-titulo" value={f.hero.titulo} maxLength={140} onChange={(e) => mudar('hero', 'titulo', e.target.value)} />
            <small className="ed-ajuda">Coloque *asteriscos* em volta das palavras que devem ficar em amarelo. Ex.: A cena *geek e pop* de Ponta Grossa.</small>
            <p className="ap-previa" aria-label="Prévia do título">{partesDoTitulo(f.hero.titulo).map((p, i) => (p.destaque ? <mark key={i}>{p.texto}</mark> : p.texto))}</p>
          </div>
          <div className="ed-campo">
            <label htmlFor="ap-lead">Texto de apoio</label>
            <textarea id="ap-lead" rows={3} value={f.hero.lead} maxLength={300} onChange={(e) => mudar('hero', 'lead', e.target.value)} />
            <small className="ed-ajuda">{f.hero.lead.length}/300</small>
          </div>
          <ListaTextos rotulo="Selos de confiança" itens={f.hero.confianca} max={4} maxLen={40} exemplo="Ex.: Compra segura" onChange={(v) => mudar('hero', 'confianca', v)} />
        </section>

        <section className="ed-painel" aria-labelledby="ap-num">
          <h2 id="ap-num" className="ed-titulo">Números em destaque</h2>
          <p className="ed-ajuda">Até 4 números logo abaixo do topo (ex.: “+5 mil” / “visitantes na última edição”). Sem nenhum, a faixa some.</p>
          {sugestoes && (
            <p className="ap-sugestao" role="note">
              <strong>O que o sistema contabiliza hoje:</strong> {sugestoes.edicoes_principais} edição(ões) Principal · {sugestoes.ingressos_emitidos} ingresso(s) emitido(s) · {sugestoes.expositores_aprovados} expositor(es) aprovado(s) · {sugestoes.competidores_aprovados} inscrição(ões) em competição aprovada(s).
              Números de edições antes do sistema (ex.: 2023) você digita à mão.
            </p>
          )}
          {f.numeros.map((n, i) => (
            <div className="ap-linha ap-numero" key={i}>
              <input value={n.valor} maxLength={16} aria-label={`Valor do número ${i + 1}`} placeholder="+5 mil" onChange={(e) => mudarNumeros(f.numeros.map((x, k) => (k === i ? { ...x, valor: e.target.value } : x)))} />
              <input value={n.legenda} maxLength={80} aria-label={`Legenda do número ${i + 1}`} placeholder="visitantes na última edição" onChange={(e) => mudarNumeros(f.numeros.map((x, k) => (k === i ? { ...x, legenda: e.target.value } : x)))} />
              <button type="button" className="ed-icone-btn is-perigo" aria-label={`Remover número ${i + 1}`} onClick={() => mudarNumeros(f.numeros.filter((_, k) => k !== i))}><FiTrash2 aria-hidden="true" /></button>
            </div>
          ))}
          {f.numeros.length < 4 && <button type="button" className="btn btn-secondary ed-btn-sm ap-add" onClick={() => mudarNumeros([...f.numeros, { valor: '', legenda: '' }])}><FiPlus aria-hidden="true" /> Adicionar número</button>}
        </section>

        <section className="ed-painel" aria-labelledby="ap-sobre">
          <h2 id="ap-sobre" className="ed-titulo">Quem somos</h2>
          <div className="ed-campo">
            <label htmlFor="ap-st">Título</label>
            <input id="ap-st" value={f.sobre.titulo} maxLength={80} onChange={(e) => mudar('sobre', 'titulo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="ap-sx">Texto</label>
            <textarea id="ap-sx" rows={6} value={f.sobre.texto} maxLength={1200} onChange={(e) => mudar('sobre', 'texto', e.target.value)} />
            <small className="ed-ajuda">{f.sobre.texto.length}/1200</small>
          </div>
          <ListaTextos rotulo="Etiquetas" itens={f.sobre.etiquetas} max={8} maxLen={30} exemplo="Ex.: Games" onChange={(v) => mudar('sobre', 'etiquetas', v)} />
        </section>

        <section className="ed-painel" aria-labelledby="ap-cta">
          <h2 id="ap-cta" className="ed-titulo">Chamada final</h2>
          <div className="ed-campo">
            <label htmlFor="ap-ct">Título</label>
            <input id="ap-ct" value={f.chamada.titulo} maxLength={110} onChange={(e) => mudar('chamada', 'titulo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="ap-cx">Texto</label>
            <textarea id="ap-cx" rows={3} value={f.chamada.texto} maxLength={300} onChange={(e) => mudar('chamada', 'texto', e.target.value)} />
          </div>
        </section>

        <section className="ed-painel" aria-labelledby="ap-rod">
          <h2 id="ap-rod" className="ed-titulo">Rodapé</h2>
          <div className="ed-campo">
            <label htmlFor="ap-rn">Nome da organização</label>
            <input id="ap-rn" value={f.rodape.nome} maxLength={80} onChange={(e) => mudar('rodape', 'nome', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="ap-ri">Link do Instagram</label>
            <input id="ap-ri" type="url" value={f.rodape.instagram} maxLength={200} placeholder="https://instagram.com/ccpop.pg" onChange={(e) => mudar('rodape', 'instagram', e.target.value)} />
            <small className="ed-ajuda">Deixe vazio para esconder o link.</small>
          </div>
        </section>

        <div className="ap-barra">
          <span className={alterado ? 'ap-nao-salvo' : ''}>{alterado ? 'Alterações não salvas' : 'Tudo salvo'}</span>
          <button type="button" className="btn btn-secondary" onClick={() => setRestaurar(true)}>Restaurar textos padrão</button>
          <button type="submit" className="btn btn-primary" disabled={salvando || !alterado}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
        </div>
      </form>

      <ConfirmModal
        isOpen={restaurar} title="Restaurar textos padrão"
        message="Todos os textos e números desta página voltam ao original. O que você personalizou será perdido."
        confirmLabel="Restaurar" variant="danger" onConfirm={restaurarPadrao} onCancel={() => setRestaurar(false)}
      />
    </div>
  );
}
