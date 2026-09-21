import { useCallback, useState } from 'react';
import api from '../../services/api';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { FichaSolicitante } from './FichaSolicitante';
import { FiltroStatus } from './FiltroStatus';
import { contarPorStatus } from '../../utils/contagem';
import { formatarData } from '../../utils/datas';

const ROTULO = { EmAnalise: 'Em análise', Aprovado: 'Aprovado', Reprovado: 'Recusado' };

// Fila de análise dos eventos enviados pela comunidade. Aprovar não publica: a organização escolhe quando divulgar.
export function AbaComunidade() {
  const [filtro, setFiltro] = useState('EmAnalise');
  const { aviso, mostrar, limpar } = useAviso();
  const [recusando, setRecusando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [trabalhando, setTrabalhando] = useState(null);

  const buscar = useCallback(() => api.get('/eventos-comunidade/admin/todos').then((r) => r.data), []);
  const { dados, erro: erroCarga, carregando, recarregar } = useCarga(buscar);
  const todos = dados ?? [];
  const lista = todos.filter((e) => !filtro || e.status_aprovacao === filtro);

  const agir = async (id, req, sucesso) => {
    limpar();
    setTrabalhando(id);
    try {
      await req();
      mostrar('sucesso', sucesso);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível concluir a ação.'));
    } finally {
      setTrabalhando(null);
    }
  };
  const status = (e, s, m) => agir(e.id_evento_externo, () => api.patch(`/eventos-comunidade/admin/${e.id_evento_externo}/status`, { status: s, motivo: m }), 'Status atualizado.');
  const aprovarEPublicar = (e) => agir(e.id_evento_externo, async () => {
    await api.patch(`/eventos-comunidade/admin/${e.id_evento_externo}/status`, { status: 'Aprovado' });
    await api.patch(`/eventos-comunidade/admin/${e.id_evento_externo}/publicar`, { publicado: true });
  }, 'Evento aprovado e publicado na página pública.');
  const aguardando = todos.filter((e) => e.status_aprovacao === 'Aprovado' && !e.publicado).length;
  const publicar = (e, p) => agir(e.id_evento_externo, () => api.patch(`/eventos-comunidade/admin/${e.id_evento_externo}/publicar`, { publicado: p }), p ? 'Evento publicado na página pública.' : 'Evento retirado da página pública.');

  return (
    <section className="sol-conteudo" aria-labelledby="t-com">
      <h2 id="t-com" className="ed-sr-only">Eventos da comunidade</h2>
      <p className="ed-sr-only">Eventos enviados por organizadores externos.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />
      {aguardando > 0 && filtro !== 'Aprovado' && (
        <p className="ed-resumo" role="status">
          {aguardando} evento(s) aprovado(s) ainda não publicado(s). <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => setFiltro('Aprovado')}>Ver e publicar</button>
        </p>
      )}
      <FiltroStatus valor={filtro} onChange={setFiltro} contagens={contarPorStatus(todos, 'status_aprovacao')} />

      {carregando ? <p className="ed-vazio">Carregando eventos...</p> : lista.length === 0 ? (
        <div className="ed-vazio"><strong>Nenhum evento neste filtro.</strong><span>Quando alguém enviar um evento da comunidade, ele aparece aqui.</span></div>
      ) : (
        <ul className="ed-lista">
          {lista.map((e) => {
            const ocupado = trabalhando === e.id_evento_externo;
            return (
              <li className="ed-item ed-item-coluna" key={e.id_evento_externo}>
                <div className="ed-item-topo">
                  <div className="ed-item-info">
                    <span className="ed-item-nome">{e.nome_evento}
                      <span className={`ed-badge ${e.status_aprovacao === 'Aprovado' ? 'is-ok' : e.status_aprovacao === 'Reprovado' ? 'is-erro' : ''}`}>{ROTULO[e.status_aprovacao]}</span>
                      {e.publicado && <span className="ed-badge is-ok">Publicado</span>}
                    </span>
                    <span className="ed-item-detalhe">{formatarData(e.data_evento)}{e.data_fim ? ` a ${formatarData(e.data_fim)}` : ''} · {e.local}</span>
                    <span className="ed-item-detalhe">{e.descricao}</span>
                    {e.regras_idade_minima && <span className="ed-item-detalhe">Idade: {e.regras_idade_minima}</span>}
                    {e.motivo_recusa && <span className="ed-item-detalhe">Motivo da recusa: {e.motivo_recusa}</span>}
                    <FichaSolicitante titulo={e.organizador?.instituicao_empresa || 'Organizador'} pessoa={e.organizador?.usuario} links={[{ rotulo: 'Saiba mais', url: e.url_saiba_mais }]} />
                  </div>
                  <div className="ed-item-acoes">
                    {e.status_aprovacao !== 'Aprovado' && <button type="button" className="btn btn-secondary ed-btn-sm" disabled={ocupado} onClick={() => status(e, 'Aprovado')}>Só aprovar</button>}
                    {e.status_aprovacao !== 'Aprovado' && <button type="button" className="btn btn-primary ed-btn-sm" disabled={ocupado} onClick={() => aprovarEPublicar(e)}>Aprovar e publicar</button>}
                    {e.status_aprovacao === 'Aprovado' && !e.publicado && <button type="button" className="btn btn-primary ed-btn-sm" disabled={ocupado} onClick={() => publicar(e, true)}>Publicar</button>}
                    {e.publicado && <button type="button" className="btn btn-secondary ed-btn-sm" disabled={ocupado} onClick={() => publicar(e, false)}>Tirar do ar</button>}
                    {e.status_aprovacao !== 'Reprovado' && <button type="button" className="btn btn-danger ed-btn-sm" disabled={ocupado} onClick={() => { setRecusando(e); setMotivo(''); }}>Recusar</button>}
                  </div>
                </div>
                {recusando?.id_evento_externo === e.id_evento_externo && (
                  <form className="ed-item-topo" onSubmit={(ev) => { ev.preventDefault(); if (motivo.trim()) { status(e, 'Reprovado', motivo.trim()); setRecusando(null); } }}>
                    <label htmlFor={`mot-${e.id_evento_externo}`}>Motivo da recusa (o organizador verá)</label>
                    <input id={`mot-${e.id_evento_externo}`} value={motivo} maxLength={300} onChange={(ev) => setMotivo(ev.target.value)} autoFocus />
                    <button type="submit" className="btn btn-danger ed-btn-sm" disabled={!motivo.trim()}>Confirmar recusa</button>
                    <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => setRecusando(null)}>Cancelar</button>
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
