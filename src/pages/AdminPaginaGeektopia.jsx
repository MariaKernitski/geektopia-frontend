import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { AbasPaginas } from '../components/paginas/AbasPaginas';
import { FotosSite } from '../components/paginas/FotosSite';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import '../style/AdminEdicao.css';
import '../style/AdminPaginas.css';

// Página Geektopia: carrossel e textos gerais. Não dependem de nenhuma edição; o que é de cada evento
// (convidados, ingressos, competições, expositores) continua sendo editado na edição.
export function AdminPaginaGeektopia() {
  const buscar = useCallback(() => api.get('/conteudo/geektopia').then((r) => r.data), []);
  const carga = useCarga(buscar);
  if (carga.carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;
  if (!carga.dados) {
    return <div className="ed-pagina ed-pagina-estreita"><Link to="/admin" className="btn btn-secondary ed-voltar">← Painel</Link><div className="ed-aviso is-erro" role="alert">{carga.erro || 'Não foi possível carregar a página.'}</div></div>;
  }
  return <Formulario conteudo={carga.dados} recarregar={carga.recarregar} />;
}

function Formulario({ conteudo, recarregar }) {
  const { aviso, mostrar, limpar } = useAviso();
  const [f, setF] = useState(() => JSON.parse(JSON.stringify(conteudo)));
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [restaurar, setRestaurar] = useState(false);

  const mudar = (secao, campo, valor) => { setF((x) => ({ ...x, [secao]: { ...x[secao], [campo]: valor } })); setAlterado(true); };
  const mudarDestaques = (destaques) => mudar('sobre', 'destaques', destaques);

  const salvar = async (e) => {
    e.preventDefault();
    limpar();
    setSalvando(true);
    try {
      const res = await api.put('/conteudo/geektopia', { sobre: f.sobre, galeria: f.galeria, participar: f.participar });
      mostrar('sucesso', `${res.data.message} As mudanças já aparecem na página Geektopia.`);
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
      const res = await api.delete('/conteudo/geektopia');
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
        <h1 className="ed-titulo-pagina">Editar: Página Geektopia</h1>
        <a href="/geektopia" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Ver a página <FiExternalLink aria-hidden="true" /></a>
      </div>
      <AbasPaginas atual="geektopia" />
      <p className="ed-ajuda-topo">Informações gerais sobre a Geektopia. Ficam iguais quando você cria um novo evento. Convidados, competições, expositores e ingressos são de cada evento e continuam na edição.</p>
      <AvisoBox aviso={avisoDaTela(aviso, null)} />

      <FotosSite />

      <form onSubmit={salvar} className="ap-form" noValidate>
        <section className="ed-painel" aria-labelledby="pg-sobre">
          <h2 id="pg-sobre" className="ed-titulo">Sobre a Geektopia</h2>
          <div className="ed-campo">
            <label htmlFor="pg-st">Título</label>
            <input id="pg-st" value={f.sobre.titulo} maxLength={80} onChange={(e) => mudar('sobre', 'titulo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="pg-sx">Texto</label>
            <textarea id="pg-sx" rows={8} value={f.sobre.texto} maxLength={3000} onChange={(e) => mudar('sobre', 'texto', e.target.value)} />
            <small className="ed-ajuda">Deixe uma linha em branco para separar parágrafos. {f.sobre.texto.length}/3000</small>
          </div>
          <div className="ap-lista">
            <span className="ap-rotulo">Destaques (opcional, até 4)</span>
            {f.sobre.destaques.map((d, i) => (
              <div className="ap-linha" key={i}>
                <input value={d.titulo} maxLength={60} aria-label={`Título do destaque ${i + 1}`} placeholder="Ex.: Dois dias de evento" onChange={(e) => mudarDestaques(f.sobre.destaques.map((x, k) => (k === i ? { ...x, titulo: e.target.value } : x)))} />
                <input value={d.descricao || ''} maxLength={160} aria-label={`Descrição do destaque ${i + 1}`} placeholder="Descrição curta (opcional)" onChange={(e) => mudarDestaques(f.sobre.destaques.map((x, k) => (k === i ? { ...x, descricao: e.target.value } : x)))} />
                <button type="button" className="ed-icone-btn is-perigo" aria-label={`Remover destaque ${i + 1}`} onClick={() => mudarDestaques(f.sobre.destaques.filter((_, k) => k !== i))}><FiTrash2 aria-hidden="true" /></button>
              </div>
            ))}
            {f.sobre.destaques.length < 4 && <button type="button" className="btn btn-secondary ed-btn-sm ap-add" onClick={() => mudarDestaques([...f.sobre.destaques, { titulo: '', descricao: '' }])}><FiPlus aria-hidden="true" /> Adicionar destaque</button>}
          </div>
        </section>

        <section className="ed-painel" aria-labelledby="pg-gal">
          <h2 id="pg-gal" className="ed-titulo">Título do carrossel</h2>
          <div className="ed-campo">
            <label htmlFor="pg-gt">Título</label>
            <input id="pg-gt" value={f.galeria.titulo} maxLength={80} onChange={(e) => mudar('galeria', 'titulo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="pg-gx">Texto de apoio</label>
            <input id="pg-gx" value={f.galeria.texto || ''} maxLength={200} onChange={(e) => mudar('galeria', 'texto', e.target.value)} />
          </div>
        </section>

        <section className="ed-painel" aria-labelledby="pg-par">
          <h2 id="pg-par" className="ed-titulo">Chamada “Como participar”</h2>
          <div className="ed-campo">
            <label htmlFor="pg-pt">Título</label>
            <input id="pg-pt" value={f.participar.titulo} maxLength={80} onChange={(e) => mudar('participar', 'titulo', e.target.value)} />
          </div>
          <div className="ed-campo">
            <label htmlFor="pg-px">Texto de apoio</label>
            <input id="pg-px" value={f.participar.texto || ''} maxLength={200} onChange={(e) => mudar('participar', 'texto', e.target.value)} />
          </div>
        </section>

        <div className="ap-barra">
          <span className={alterado ? 'ap-nao-salvo' : ''}>{alterado ? 'Alterações não salvas' : 'Tudo salvo'}</span>
          <button type="button" className="btn btn-secondary" onClick={() => setRestaurar(true)}>Restaurar textos padrão</button>
          <button type="submit" className="btn btn-primary" disabled={salvando || !alterado}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
        </div>
      </form>

      <ConfirmModal isOpen={restaurar} title="Restaurar textos padrão" message="Os textos desta página voltam ao original. As fotos do carrossel não são afetadas." confirmLabel="Restaurar" variant="danger" onConfirm={restaurarPadrao} onCancel={() => setRestaurar(false)} />
    </div>
  );
}
