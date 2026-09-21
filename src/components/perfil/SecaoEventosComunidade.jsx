import { useCallback, useState } from 'react';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import api from '../../services/api';
import { useCarga } from '../../hooks/useCarga';
import { mensagemDeErro } from '../../hooks/useAviso';
import { formatarData } from '../../utils/datas';
import { hojeISO, limiteDataISO, paraEnvio, validarEventoComunidade } from '../../utils/eventoComunidade';

const VAZIO = { nome_evento: '', data_evento: '', data_fim: '', local: '', descricao: '', url_saiba_mais: '', regras_idade_minima: '', instituicao_empresa: '' };
const SITUACAO = {
  EmAnalise: { texto: 'Em análise pela CCPOP', classe: '' },
  Aprovado: { texto: 'Aprovado', classe: 'is-ok' },
  Reprovado: { texto: 'Não aprovado', classe: 'is-erro' }
};

// Aba do perfil: quem organiza um evento fora da CCPOP envia o pedido de divulgação e acompanha a resposta.
export function SecaoEventosComunidade({ onMensagem }) {
  const buscar = useCallback(() => api.get('/eventos-comunidade/meus').then((r) => r.data), []);
  const { dados, carregando, recarregar } = useCarga(buscar);
  const [form, setForm] = useState(null); // null = fechado
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const eventos = dados ?? [];

  const abrir = (ev) => {
    setErros({});
    setEditando(ev?.id_evento_externo ?? null);
    setForm(ev ? {
      ...VAZIO, nome_evento: ev.nome_evento, local: ev.local || '', descricao: ev.descricao || '', url_saiba_mais: ev.url_saiba_mais || '',
      regras_idade_minima: ev.regras_idade_minima || '', data_evento: ev.data_evento?.slice(0, 10) || '', data_fim: ev.data_fim?.slice(0, 10) || ''
    } : { ...VAZIO });
  };
  const alterar = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enviar = async (e) => {
    e.preventDefault();
    const problemas = validarEventoComunidade(form);
    setErros(problemas);
    if (Object.keys(problemas).length) return;
    setEnviando(true);
    try {
      const res = editando
        ? await api.put(`/eventos-comunidade/${editando}`, paraEnvio(form))
        : await api.post('/eventos-comunidade', paraEnvio(form));
      onMensagem({ tipo: 'sucesso', texto: res.data.message });
      setForm(null);
      recarregar();
    } catch (err) {
      onMensagem({ tipo: 'erro', texto: mensagemDeErro(err, 'Não foi possível enviar o evento.') });
    } finally {
      setEnviando(false);
    }
  };

  const retirar = async (ev) => {
    if (!window.confirm(`Retirar o pedido "${ev.nome_evento}"?`)) return;
    try {
      await api.delete(`/eventos-comunidade/${ev.id_evento_externo}`);
      recarregar();
    } catch (err) {
      onMensagem({ tipo: 'erro', texto: mensagemDeErro(err, 'Não foi possível retirar o pedido.') });
    }
  };

  const campo = (k, rotulo, props = {}, cheio = false) => (
    <div className={`perfil-field ${cheio ? 'perfil-form-full' : ''}`}>
      <label htmlFor={`ec-${k}`}>{rotulo}</label>
      {props.area
        ? <textarea id={`ec-${k}`} rows={4} value={form[k]} onChange={(e) => alterar(k, e.target.value)} aria-invalid={erros[k] ? true : undefined} />
        : <input id={`ec-${k}`} value={form[k]} onChange={(e) => alterar(k, e.target.value)} aria-invalid={erros[k] ? true : undefined} {...props} />}
      {erros[k] && <p className="perfil-erro-campo" role="alert">{erros[k]}</p>}
    </div>
  );

  return (
    <section aria-labelledby="perfil-t-com">
      <div className="perfil-secao-topo">
        <h2 id="perfil-t-com">Eventos da comunidade</h2>
        {!form && <button type="button" className="btn btn-primary" onClick={() => abrir(null)}><FiPlus aria-hidden="true" /> Enviar evento</button>}
      </div>
      <p className="perfil-ajuda perfil-ajuda-ing">Organiza um evento geek, cultural ou de jogos? Envie para a CCPOP divulgar. A equipe analisa e, se aprovar, publica na página “Eventos da comunidade”. Não há cobrança.</p>

      {form && (
        <form className="perfil-form perfil-form-com" onSubmit={enviar} noValidate>
          {campo('nome_evento', 'Nome do evento *', { maxLength: 150 }, true)}
          {campo('data_evento', 'Data de início *', { type: 'date', min: hojeISO(), max: limiteDataISO() })}
          {campo('data_fim', 'Data de término (se durar mais de um dia)', { type: 'date', min: form.data_evento || hojeISO(), max: limiteDataISO() })}
          {campo('local', 'Local *', { maxLength: 200 }, true)}
          {campo('descricao', 'Descrição *', { area: true }, true)}
          {campo('url_saiba_mais', 'Link do evento ou do organizador (Instagram, site, Drive) *', { type: 'url', placeholder: 'https://' }, true)}
          {campo('regras_idade_minima', 'Regras de idade (opcional)', { maxLength: 1000 }, true)}
          {!editando && campo('instituicao_empresa', 'Instituição ou grupo organizador (opcional)', { maxLength: 100 }, true)}
          <div className="perfil-form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : editando ? 'Reenviar para análise' : 'Enviar para análise'}</button>
          </div>
        </form>
      )}

      {carregando ? <p>Carregando...</p> : eventos.length === 0 && !form ? (
        <div className="perfil-vazio">
          <FiCalendar aria-hidden="true" />
          <h2>Você ainda não enviou nenhum evento</h2>
          <p>Quando enviar, você acompanha aqui a resposta da CCPOP.</p>
        </div>
      ) : (
        <ul className="perfil-lista-com">
          {eventos.map((ev) => {
            const s = SITUACAO[ev.status_aprovacao];
            return (
              <li key={ev.id_evento_externo} className="perfil-item-com">
                <div>
                  <strong>{ev.nome_evento}</strong>
                  <span>{formatarData(ev.data_evento)} · {ev.local}</span>
                  <span className={`perfil-selo-com ${s.classe}`}>{s.texto}{ev.status_aprovacao === 'Aprovado' && (ev.publicado ? ' · publicado' : ' · aguardando publicação')}</span>
                  {ev.motivo_recusa && <span className="perfil-motivo-com">Motivo: {ev.motivo_recusa}</span>}
                </div>
                <div className="perfil-acoes-com">
                  <button type="button" className="btn btn-secondary" onClick={() => abrir(ev)}>Editar</button>
                  {!ev.publicado && <button type="button" className="btn btn-secondary" onClick={() => retirar(ev)}>Retirar</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
