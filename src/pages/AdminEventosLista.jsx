import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { ROTULO_STATUS } from '../components/edicao/abas';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { formatarData } from '../utils/datas';
import '../style/AdminEdicao.css';

// As edições em três grupos, na ordem em que a diretoria costuma procurar.
const GRUPOS = [
  { tipo: 'Principal', titulo: 'Geektopia Principal (vigente)', vazio: 'Nenhuma Principal no momento.' },
  { tipo: 'Pocket', titulo: 'Edições Pocket', vazio: 'Nenhuma edição Pocket cadastrada.' },
  { tipo: 'PrincipalAnterior', titulo: 'Principais anteriores', vazio: null } // some quando vazio
];

export function AdminEventosLista() {
  const [eventos, setEventos] = useState(null);
  const { aviso, mostrar } = useAviso();
  const [idParaExcluir, setIdParaExcluir] = useState(null);

  const carregar = () => {
    api.get('/geektopia/admin/todas')
      .then((res) => setEventos(res.data))
      .catch((err) => { mostrar('erro', mensagemDeErro(err, 'Erro ao carregar as edições.')); setEventos([]); });
  };

  useEffect(carregar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmarExclusao = async () => {
    const id = idParaExcluir;
    setIdParaExcluir(null);
    try {
      const res = await api.delete(`/geektopia/${id}`);
      mostrar('sucesso', res.data.message);
      carregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Erro ao excluir a edição.'));
    }
  };

  return (
    <div className="ed-pagina">
      <Link to="/admin/eventos" className="btn btn-secondary ed-voltar">← Voltar</Link>

      <div className="ed-lista-cabecalho">
        <h1 className="ed-titulo-pagina">Gerenciar eventos</h1>
        <Link to="/admin/eventos/criar" className="btn btn-primary">+ Criar evento</Link>
      </div>

      <AvisoBox aviso={aviso} />

      {eventos === null && <p className="ed-vazio">Carregando edições...</p>}

      {eventos !== null && eventos.length === 0 && (
        <div className="ed-vazio">
          <strong>Nenhuma edição cadastrada ainda.</strong>
          <span>Use “Criar evento” para começar.</span>
        </div>
      )}

      {eventos !== null && eventos.length > 0 && GRUPOS.map((grupo) => {
        const itens = eventos.filter((ev) => ev.tipo_edicao === grupo.tipo);
        if (itens.length === 0 && !grupo.vazio) return null;

        return (
          <section key={grupo.tipo} className="ed-grupo" aria-labelledby={`g-${grupo.tipo}`}>
            <h2 id={`g-${grupo.tipo}`} className="ed-subtitulo-secao">{grupo.titulo}</h2>

            {itens.length === 0 ? (
              <p className="ed-vazio">{grupo.vazio}</p>
            ) : (
              <ul className="ed-lista">
                {itens.map((ev) => (
                  <li className="ed-item" key={ev.id_geektopia}>
                    <div className="ed-item-info">
                      <span className="ed-item-nome">
                        {ev.nome_edicao}
                        <span className={`ed-badge is-status-${ev.status_evento}`}>{ROTULO_STATUS[ev.status_evento]}</span>
                      </span>
                      <span className="ed-item-detalhe">
                        {ev.local || 'Local não definido'}
                        {ev.data_inicio && ` · ${formatarData(ev.data_inicio)}`}
                        {` · ${ev._count?.lotes || 0} lote(s)`}
                      </span>
                    </div>
                    <div className="ed-item-acoes">
                      <Link to={`/admin/eventos/${ev.id_geektopia}`} className="btn btn-primary ed-btn-sm">Gerenciar</Link>
                      <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setIdParaExcluir(ev.id_geektopia)}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <ConfirmModal
        isOpen={idParaExcluir !== null}
        title="Excluir edição"
        message="Tem certeza que deseja excluir esta edição? Só é possível se ela não tiver ingressos, lotes ou outros registros ligados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </div>
  );
}
