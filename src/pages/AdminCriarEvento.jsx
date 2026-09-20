import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../style/Cadastro.css';
import '../style/AdminEventoForm.css';
import '../style/AdminUsuarios.css';


export function AdminCriarEvento() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [diaUnico, setDiaUnico] = useState(true);
  const [form, setForm] = useState({
    nome_edicao: '',
    data_evento: '', hora_inicio: '', hora_fim: '',
    data_inicio: '', data_fim: '',
    local: '', descricao: ''
  });
  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [lotes, setLotes] = useState([]);
  const [novoLote, setNovoLote] = useState({ nome_lote: '', valor_ingresso: '', quantidade_total: '' });

  const [statusEscolhido, setStatusEscolhido] = useState('Bloqueado');
  const [tornarPrincipal, setTornarPrincipal] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const proximaEtapa = (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    if (etapa === 1 && !form.nome_edicao) {
      setMensagem({ tipo: 'erro', texto: 'Preencha o nome do evento.' });
      return;
    }
    setEtapa(etapa + 1);
  };

  const voltarEtapa = () => {
    setMensagem({ tipo: '', texto: '' });
    setEtapa(etapa - 1);
  };

  const adicionarLote = (e) => {
    e.preventDefault();
    if (!novoLote.nome_lote || !novoLote.valor_ingresso || !novoLote.quantidade_total) {
      setMensagem({ tipo: 'erro', texto: 'Preencha nome, valor e quantidade do lote.' });
      return;
    }
    setLotes([...lotes, { ...novoLote, _id: crypto.randomUUID() }]);
    setNovoLote({ nome_lote: '', valor_ingresso: '', quantidade_total: '' });
    setMensagem({ tipo: '', texto: '' });
  };

  const removerLote = (idLocal) => setLotes(lotes.filter(l => l._id !== idLocal));

  const montarDatas = () => {
    if (diaUnico) {
      if (!form.data_evento) return { data_inicio: '', data_fim: '' };
      return {
        data_inicio: `${form.data_evento}T${form.hora_inicio || '00:00'}:00`,
        data_fim: `${form.data_evento}T${form.hora_fim || '23:59'}:00`
      };
    }
    return { data_inicio: form.data_inicio, data_fim: form.data_fim };
  };

  const finalizarCriacao = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });
    setEnviando(true);

    const { data_inicio, data_fim } = montarDatas();

    const dadosEvento = new FormData();
    dadosEvento.append('nome_edicao', form.nome_edicao);
    if (data_inicio) dadosEvento.append('data_inicio', data_inicio);
    if (data_fim) dadosEvento.append('data_fim', data_fim);
    if (form.local) dadosEvento.append('local', form.local);
    if (form.descricao) dadosEvento.append('descricao', form.descricao);
    dadosEvento.append('status_evento', statusEscolhido === 'VendasAbertas' ? 'Bloqueado' : statusEscolhido);
    dadosEvento.append('tornar_principal', tornarPrincipal ? 'true' : 'false');
    if (foto) dadosEvento.append('banner', foto);

    let idEvento;
    try {
      const res = await api.post('/geektopia', dadosEvento);
      idEvento = res.data.geektopia.id_geektopia;
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Erro ao criar o evento.' });
      setEnviando(false);
      return;
    }

    for (const lote of lotes) {
      try {
        await api.post('/lotes', {
          id_geektopia: idEvento,
          nome_lote: lote.nome_lote,
          valor_ingresso: Number(lote.valor_ingresso),
          quantidade_total: Number(lote.quantidade_total)
        });
      } catch (err) {
        setMensagem({
          tipo: 'erro',
          texto: `O evento foi criado, mas houve um erro ao salvar o lote "${lote.nome_lote}". Você pode terminar de cadastrar os lotes na tela de gerenciamento.`
        });
        setResultado({ idEvento, nome: form.nome_edicao });
        setEnviando(false);
        return;
      }
    }

    if (statusEscolhido === 'VendasAbertas' && lotes.length > 0) {
      try {
        await api.patch(`/geektopia/${idEvento}/status`, { status_evento: 'VendasAbertas' });
      } catch (err) {
        setMensagem({
          tipo: 'erro',
          texto: 'Evento e lotes criados, mas não foi possível abrir as vendas automaticamente. Tente abrir manualmente na lista de eventos.'
        });
        setResultado({ idEvento, nome: form.nome_edicao });
        setEnviando(false);
        return;
      }
    }

    setResultado({ idEvento, nome: form.nome_edicao, sucesso: true });
    setEnviando(false);
  };

  if (resultado) {
    return (
      <div className="admin-list-page">
        <h1 className="admin-list-title">
          {resultado.sucesso ? 'Evento criado com sucesso!' : 'Evento criado com pendências'}
        </h1>

        <div className={`admin-list-feedback is-${resultado.sucesso ? 'sucesso' : 'erro'}`} role="status">
          {resultado.sucesso ? `"${resultado.nome}" foi criado e está pronto.` : mensagem.texto}
        </div>

        <div className="evento-form-actions" style={{ justifyContent: 'flex-start', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/admin/eventos/${resultado.idEvento}/lotes`)}>
            Ver/editar lotes deste evento
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/eventos/lista')}>
            Ir para a lista de eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-list-page">
      <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/eventos')} style={{ marginBottom: '16px' }}>
        ← Voltar
      </button>

        <div className="cadastro-card" style={{ maxWidth: '820px', width: '100%' }}>
          <div className="cadastro-steps">
          <span className={`cadastro-step ${etapa === 1 ? 'is-active' : ''}`}>1. Dados do evento</span>
          <span className={`cadastro-step ${etapa === 2 ? 'is-active' : ''}`}>2. Lotes de ingresso</span>
          <span className={`cadastro-step ${etapa === 3 ? 'is-active' : ''}`}>3. Revisão e status</span>
        </div>

        <div className="cadastro-content">

          <div className={`admin-list-feedback is-${mensagem.tipo} ${!mensagem.texto ? 'is-hidden' : ''}`} role="status">
            {mensagem.texto}
          </div>

          {etapa === 1 && (
            <form onSubmit={proximaEtapa}>
              <h3 className="cadastro-title">Dados do evento</h3>

              <div className="evento-field">
                <label>Nome do evento *</label>
                <input
                  name="nome_edicao"
                  value={form.nome_edicao}
                  onChange={handleChange}
                  placeholder="Ex: GEEKTOPIA Pocket - Halloween 2026"
                  required
                />
              </div>

              <label className="evento-checkbox-field">
                <input type="checkbox" checked={diaUnico} onChange={(e) => setDiaUnico(e.target.checked)} />
                Evento de um dia só
              </label>

              {diaUnico ? (
                <div className="evento-field-row">
                  <div className="evento-field">
                    <label>Data do evento</label>
                    <input type="date" name="data_evento" value={form.data_evento} onChange={handleChange} />
                  </div>
                  <div className="evento-field">
                    <label>Início</label>
                    <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} />
                  </div>
                  <div className="evento-field">
                    <label>Término</label>
                    <input type="time" name="hora_fim" value={form.hora_fim} onChange={handleChange} />
                  </div>
                </div>
              ) : (
                <div className="evento-field-row">
                  <div className="evento-field">
                    <label>Data de início</label>
                    <input type="date" name="data_inicio" value={form.data_inicio} onChange={handleChange} />
                  </div>
                  <div className="evento-field">
                    <label>Data de término</label>
                    <input type="date" name="data_fim" value={form.data_fim} onChange={handleChange} />
                  </div>
                </div>
              )}

              <div className="evento-field">
                <label>Local</label>
                <input name="local" value={form.local} onChange={handleChange} placeholder="Ex: Ponta Grossa - PR" />
              </div>

              <div className="evento-field">
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Conte do que se trata o evento..."
                />
              </div>

              <div className="evento-field">
                <label>Foto de capa</label>
                <input type="file" accept="image/*" onChange={handleFoto} />
                {previewUrl && <img src={previewUrl} alt="Pré-visualização" className="evento-preview-banner" />}
              </div>

              <div className="cadastro-actions">
                <button type="submit" className="btn btn-primary">Próximo →</button>
              </div>
            </form>
          )}

          {etapa === 2 && (
            <div>
              <h3 className="cadastro-title">Lotes de ingresso</h3>
              <p className="geektopia-vazio" style={{ padding: 0, marginBottom: '16px' }}>
                Adicione quantos lotes quiser. Nada é salvo ainda — só na próxima etapa, ao criar o evento.
              </p>

              <div className="evento-field-row">
                <div className="evento-field">
                  <label>Nome do lote</label>
                  <input
                    value={novoLote.nome_lote}
                    onChange={(e) => setNovoLote({ ...novoLote, nome_lote: e.target.value })}
                    placeholder="Ex: Inteira - 1º Lote"
                  />
                </div>
                <div className="evento-field">
                  <label>Valor (R$)</label>
                  <input
                    type="number" step="0.01" min="0.01"
                    value={novoLote.valor_ingresso}
                    onChange={(e) => setNovoLote({ ...novoLote, valor_ingresso: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
                <div className="evento-field">
                  <label>Quantidade</label>
                  <input
                    type="number" min="1"
                    value={novoLote.quantidade_total}
                    onChange={(e) => setNovoLote({ ...novoLote, quantidade_total: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="evento-form-actions" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={adicionarLote}>+ Adicionar lote</button>
              </div>

              <div className="admin-list">
                {lotes.length === 0 && (
                  <div className="admin-eventos-empty">Nenhum lote adicionado ainda (opcional nesta etapa).</div>
                )}
                {lotes.map(lote => (
                  <div className="admin-list-row" key={lote._id}>
                    <div className="admin-list-info">
                      <span className="admin-list-name">{lote.nome_lote}</span>
                      <span className="admin-list-email">
                        R$ {Number(lote.valor_ingresso).toFixed(2)} · {lote.quantidade_total} ingresso(s)
                      </span>
                    </div>
                    <div className="admin-list-actions">
                      <button type="button" className="btn btn-danger" onClick={() => removerLote(lote._id)}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cadastro-actions has-two">
                <button type="button" className="btn btn-secondary" onClick={voltarEtapa}>← Voltar</button>
                <button type="button" className="btn btn-primary" onClick={proximaEtapa}>Próximo →</button>
              </div>
            </div>
          )}

          {etapa === 3 && (
            <form onSubmit={finalizarCriacao}>
              <h3 className="cadastro-title">Revisão e status</h3>

              <div className="admin-eventos-empty" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <strong>{form.nome_edicao}</strong><br />
                {form.local && <>{form.local}<br /></>}
                {lotes.length} lote(s) de ingresso adicionado(s)
              </div>

              <div className="evento-field">
                <label>Status inicial</label>
                <select value={statusEscolhido} onChange={(e) => setStatusEscolhido(e.target.value)}>
                  <option value="Bloqueado">Rascunho (recomendado)</option>
                  <option value="VendasAbertas" disabled={lotes.length === 0}>
                    Vendas abertas {lotes.length === 0 ? '(precisa de ao menos 1 lote)' : ''}
                  </option>
                  <option value="VendasEncerradas">Vendas encerradas</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>

              <label className="evento-checkbox-field">
                <input
                  type="checkbox"
                  checked={tornarPrincipal}
                  onChange={(e) => setTornarPrincipal(e.target.checked)}
                />
                Marcar como a GEEKTOPIA Principal
              </label>

              <p className={`evento-aviso ${!tornarPrincipal ? 'is-hidden' : ''}`}>
                Só pode existir uma Geektopia Principal por vez. Se já existir outra, ela será
                automaticamente rebaixada para Pocket ao salvar este evento.
              </p>

              <div className="cadastro-actions has-two">
                <button type="button" className="btn btn-secondary" onClick={voltarEtapa} disabled={enviando}>← Voltar</button>
                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando ? 'Criando...' : 'Criar evento'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}