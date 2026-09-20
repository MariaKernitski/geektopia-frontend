import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { formatarMoeda } from '../utils/datas';
import { situacaoDaSolicitacao } from '../utils/solicitacao';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

const inicial = (nome) => (nome || '?').trim().charAt(0).toUpperCase();

// Central do expositor: o perfil (loja/projeto) e as candidaturas a espaços.
export function ExpositorArea() {
  const location = useLocation();

  const buscar = useCallback(async () => {
    const [perfil, solicitacoes] = await Promise.all([
      api.get('/parceiros/meu-perfil'),
      api.get('/solicitacoes-espaco/minhas')
    ]);
    return { expositor: perfil.data.papeis?.expositor || null, solicitacoes: solicitacoes.data };
  }, []);
  const { dados, erro, carregando } = useCarga(buscar);

  // Mensagem vinda da tela anterior (ex.: "Perfil criado"), mostrada uma vez.
  const aviso = location.state?.sucesso ? { tipo: 'sucesso', texto: location.state.sucesso } : { tipo: '', texto: '' };

  const expositor = dados?.expositor;
  const solicitacoes = dados?.solicitacoes ?? [];

  return (
    <div className="ed-pagina">
      <Link to="/participar" className="btn btn-secondary ed-voltar">← Participar</Link>

      <div className="pt-cabecalho-acoes">
        <h1 className="ed-titulo-pagina">Área do expositor</h1>
        {expositor && <Link to="/expositor/solicitar" className="btn btn-primary">+ Solicitar espaço</Link>}
      </div>

      <AvisoBox aviso={avisoDaTela(aviso, erro)} />

      {carregando ? (
        <p className="ed-vazio">Carregando...</p>
      ) : !expositor ? (
        <div className="pt-destaque">
          <strong>Você ainda não é expositor.</strong>
          <p style={{ margin: '6px 0 0' }}>
            Crie o perfil da sua loja ou projeto (nome, tipo, portfólio e logo). É rápido, e é o primeiro passo para pedir um espaço nas edições da Geektopia.
          </p>
          <div className="ed-acoes ed-acoes-esquerda">
            <Link to="/expositor/perfil" className="btn btn-primary">Criar perfil de expositor</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pt-perfil-card">
            <span className="pt-logo" aria-hidden="true">
              {expositor.url_logo ? <img src={expositor.url_logo} alt="" /> : inicial(expositor.nome_loja_projeto)}
            </span>
            <div className="pt-perfil-info">
              <strong>{expositor.nome_loja_projeto}</strong>
              <span>{expositor.tipo_expositor || 'Tipo não informado'}</span>
            </div>
            <Link to="/expositor/perfil" className="btn btn-secondary ed-btn-sm">Editar perfil</Link>
          </div>

          <h2 className="ed-subtitulo-secao">Minhas solicitações de espaço</h2>

          {solicitacoes.length === 0 ? (
            <div className="ed-vazio">
              <strong>Você ainda não pediu nenhum espaço.</strong>
              <span>Escolha a edição e o espaço que quer ocupar. A diretoria avalia e você acompanha aqui.</span>
              <Link to="/expositor/solicitar" className="btn btn-primary" style={{ alignSelf: 'center', marginTop: 8 }}>Solicitar meu primeiro espaço</Link>
            </div>
          ) : (
            <ul className="ed-lista">
              {solicitacoes.map((s) => {
                const sit = situacaoDaSolicitacao(s);
                return (
                  <li className="ed-item" key={s.id_solicitacao}>
                    <div className="ed-item-info">
                      <span className="ed-item-nome">
                        {s.geektopia?.nome_edicao}
                        <span className={`ed-badge ${sit.tipo === 'ok' ? 'is-ok' : sit.tipo === 'erro' ? 'is-erro' : ''}`}>{sit.rotulo}</span>
                      </span>
                      <span className="ed-item-detalhe">{s.espaco?.tipo_espaco} · {formatarMoeda(s.valor_total_final)}</span>
                      <span className="ed-item-detalhe">{sit.passo}</span>
                    </div>
                    <div className="ed-item-acoes">
                      <Link to={`/expositor/solicitacoes/${s.id_solicitacao}`} className="btn btn-secondary ed-btn-sm">Ver detalhes</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
