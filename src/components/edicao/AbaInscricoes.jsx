import { useCallback, useState } from 'react';
import api from '../../services/api';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { FichaSolicitante } from './FichaSolicitante';
import { FiltroStatus } from './FiltroStatus';
import { contarPorStatus } from '../../utils/contagem';
import { ROTULO_MODALIDADE, situacaoDaInscricao } from '../../utils/competicao';
import { formatarMoeda } from '../../utils/datas';

// Fila de análise das inscrições em competições desta edição. O competidor só
// paga (quando há taxa) depois que a organização aprova.
export function AbaInscricoes({ evento, recarregarResumo }) {
  const id = evento?.id_geektopia; // sem edição = visão geral de todas (tela Solicitações)
  const { aviso, mostrar, limpar } = useAviso();
  const [filtro, setFiltro] = useState(id ? '' : 'EmAnalise');
  const [motivo, setMotivo] = useState(null); // { inscricao, texto, status }
  const [erroMotivo, setErroMotivo] = useState('');
  const [trabalhando, setTrabalhando] = useState(null);

  const buscar = useCallback(
    () => api.get('/inscricoes/admin/todas', { params: id ? { id_geektopia: id } : {} }).then((r) => r.data),
    [id]
  );
  const { dados, erro, carregando, recarregar } = useCarga(buscar);
  const lista = (dados ?? []).filter((i) => !filtro || i.status_inscricao === filtro);

  const decidir = async (i, status, observacao) => {
    limpar();
    setTrabalhando(i.id_inscricao);
    try {
      const res = await api.patch(`/inscricoes/admin/${i.id_inscricao}/status`, { status_inscricao: status, observacao_admin: observacao || undefined });
      mostrar('sucesso', res.data.message);
      setMotivo(null);
      recarregar();
      recarregarResumo?.();
    } catch (err) {
      const msg = mensagemDeErro(err, 'Não foi possível alterar o status.');
      if (motivo) setErroMotivo(msg); else mostrar('erro', msg);
    } finally {
      setTrabalhando(null);
    }
  };

  const abrirMotivo = (inscricao, status) => { setErroMotivo(''); setMotivo({ inscricao, status, texto: '' }); };

  return (
    <section className={evento ? 'ed-painel' : 'sol-conteudo'} aria-labelledby="t-insc">
      <h2 id="t-insc" className={evento ? 'ed-titulo' : 'ed-sr-only'}>Inscrições</h2>
      <p className={evento ? 'ed-ajuda-topo' : 'ed-sr-only'}>
        Inscrições dos competidores nas competições {evento ? 'desta edição' : 'de todas as edições'}. Ao aprovar, o competidor pode pagar a taxa (se houver) e a vaga fica confirmada.
        Ao reprovar, explique o motivo: ele aparece para a pessoa.
      </p>
      <AvisoBox aviso={avisoDaTela(aviso, erro)} />

      <FiltroStatus valor={filtro} onChange={setFiltro} contagens={contarPorStatus(dados ?? [], 'status_inscricao')} />

      {carregando ? (
        <p className="ed-vazio">Carregando inscrições...</p>
      ) : lista.length === 0 ? (
        <div className="ed-vazio">
          <strong>{filtro ? 'Nenhuma inscrição neste filtro.' : 'Nenhuma inscrição nesta edição ainda.'}</strong>
          {!filtro && <span>Quando alguém se inscrever numa competição, aparece aqui para análise.</span>}
        </div>
      ) : (
        <ul className="ed-lista">
          {lista.map((i) => {
            const sit = situacaoDaInscricao(i);
            const usuario = i.competidor?.participante?.usuario;
            const ocupado = trabalhando === i.id_inscricao;
            const travada = Boolean(i.id_pedido); // já gerou cobrança: não dá para reprovar
            return (
              <li className="ed-item ed-item-coluna" key={i.id_inscricao}>
                <div className="ed-item-topo">
                  <div className="ed-item-info">
                    <span className="ed-item-nome">
                      {i.competidor?.nickname_competidor || usuario?.nome_completo}
                      <span className={`ed-badge ${sit.tipo === 'ok' ? 'is-ok' : sit.tipo === 'erro' ? 'is-erro' : ''}`}>{sit.rotulo}</span>
                    </span>
                    <span className="ed-item-detalhe">
                      {!evento && i.competicao?.geektopia?.nome_edicao && <strong>{i.competicao.geektopia.nome_edicao} · </strong>}{i.competicao?.nome_competicao} · {ROTULO_MODALIDADE[i.competicao?.modalidade]}
                      {Number(i.competicao?.valor_taxa_inscricao) > 0 && ` · taxa ${formatarMoeda(i.competicao.valor_taxa_inscricao)}`}
                    </span>
                    {i.equipe && (
                      <span className="ed-item-detalhe">
                        Equipe <strong>{i.equipe.nome_equipe}</strong>
                        {i.equipe.integrantes && <> com {i.equipe.integrantes.split('\n').join(', ')}</>}
                        {i.equipe.link_portfolio_grupo && <> · <a href={i.equipe.link_portfolio_grupo} target="_blank" rel="noopener noreferrer">portfólio da equipe</a></>}
                      </span>
                    )}
                    <FichaSolicitante
                      foto={usuario?.perfil?.avatar_url} titulo={i.competidor?.nickname_competidor || usuario?.nome_completo || 'Competidor'} pessoa={usuario}
                      links={[
                        { rotulo: 'Material de apresentação', url: i.url_portfolio_apresentacao },
                        { rotulo: 'Áudio/vídeo', url: i.link_audio_apresentacao },
                        { rotulo: 'Portfólio do perfil', url: i.competidor?.url_portfolio },
                        { rotulo: 'Redes sociais', url: i.competidor?.link_redes_sociais }
                      ]}
                    />
                    {i.status_inscricao === 'Aprovado' && Number(i.competicao?.valor_taxa_inscricao) > 0 && (
                      <span className={`ed-pagamento is-${i.pedido?.status_pedido === 'Pago' ? 'ok' : 'neutro'}`}>
                        {i.pedido?.status_pedido === 'Pago' ? 'Taxa paga' : i.pedido ? 'Cobrança gerada · aguardando pagamento' : 'Aguardando o competidor gerar a cobrança'}
                      </span>
                    )}
                    {i.observacao_admin && <span className="ed-item-detalhe">Recado enviado: {i.observacao_admin}</span>}
                  </div>
                  <div className="ed-item-acoes">
                    {i.status_inscricao !== 'Aprovado' && <button type="button" className="btn btn-primary ed-btn-sm" disabled={ocupado} onClick={() => abrirMotivo(i, 'Aprovado')}>Aprovar</button>}
                    {i.status_inscricao !== 'Reprovado' && !travada && <button type="button" className="btn btn-danger ed-btn-sm" disabled={ocupado} onClick={() => abrirMotivo(i, 'Reprovado')}>Reprovar</button>}
                    {i.status_inscricao !== 'EmAnalise' && !travada && <button type="button" className="btn btn-secondary ed-btn-sm" disabled={ocupado} onClick={() => decidir(i, 'EmAnalise')}>Voltar p/ análise</button>}
                  </div>
                </div>

                {motivo?.inscricao.id_inscricao === i.id_inscricao && (
                  <form className="ed-form" style={{ marginTop: 12 }} onSubmit={(e) => {
                    e.preventDefault();
                    if (motivo.status === 'Reprovado' && !motivo.texto.trim()) { setErroMotivo('Explique o motivo da reprovação.'); return; }
                    decidir(i, motivo.status, motivo.texto.trim());
                  }}>
                    <div className="ed-campo">
                      <label htmlFor={`motivo-${i.id_inscricao}`}>{motivo.status === 'Reprovado' ? 'Motivo da reprovação *' : 'Recado para o competidor (opcional)'}</label>
                      <textarea id={`motivo-${i.id_inscricao}`} rows={3} maxLength={1000} value={motivo.texto} autoFocus
                        onChange={(e) => { setMotivo({ ...motivo, texto: e.target.value }); setErroMotivo(''); }} />
                      {erroMotivo && <p className="ed-erro-campo" role="alert">{erroMotivo}</p>}
                    </div>
                    <div className="ed-acoes ed-acoes-esquerda">
                      <button type="submit" className={`btn ${motivo.status === 'Reprovado' ? 'btn-danger' : 'btn-primary'}`} disabled={ocupado}>
                        {motivo.status === 'Reprovado' ? 'Confirmar reprovação' : 'Confirmar aprovação'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setMotivo(null)}>Cancelar</button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
