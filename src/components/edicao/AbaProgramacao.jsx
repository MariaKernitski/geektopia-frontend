import { useCallback, useMemo, useState } from 'react';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { formatarHora, localParaIso, paraInputData, paraInputDataHora, tituloDoDia } from '../../utils/datas';

const VAZIO = { titulo_atividade: '', inicio: '', fim: '', id_competicao: '' };

export function AbaProgramacao({ evento, recarregarResumo, marcarAlterado }) {
  const id = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [excluir, setExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(async () => {
    const [prog, comp] = await Promise.all([
      api.get(`/geektopia/admin/${id}/programacao`),
      api.get(`/geektopia/admin/${id}/competicoes`)
    ]);
    return { atividades: prog.data, competicoes: comp.data };
  }, [id]);
  const { dados, erro: erroCarga, carregando, recarregar: carregar } = useCarga(buscar);
  const atividades = useMemo(() => dados?.atividades ?? [], [dados]);
  const competicoes = dados?.competicoes ?? [];

  const alterar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErros((er) => ({ ...er, [e.target.name]: undefined }));
    marcarAlterado(true);
  };

  const cancelar = () => {
    setEditando(null);
    setForm(VAZIO);
    setErros({});
    marcarAlterado(false);
  };

  const comecarEdicao = (a) => {
    limpar();
    setEditando(a);
    setForm({
      titulo_atividade: a.titulo_atividade,
      inicio: paraInputDataHora(a.data_hora_inicio),
      fim: paraInputDataHora(a.data_hora_fim),
      id_competicao: a.id_competicao ? String(a.id_competicao) : ''
    });
    setErros({});
  };

  // Aviso (não bloqueia): atividade fora das datas cadastradas para o evento.
  const foraDoEvento = useMemo(() => {
    const inicio = localParaIso(form.inicio);
    if (!inicio || !evento.data_inicio || !evento.data_fim) return false;
    return new Date(inicio) < new Date(evento.data_inicio) || new Date(inicio) > new Date(evento.data_fim);
  }, [form.inicio, evento.data_inicio, evento.data_fim]);

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    const novos = {};
    if (!form.titulo_atividade.trim()) novos.titulo_atividade = 'Dê um título à atividade.';
    const inicio = localParaIso(form.inicio);
    const fim = localParaIso(form.fim);
    if (!inicio) novos.inicio = 'Informe quando a atividade começa.';
    if (inicio && fim && new Date(fim) <= new Date(inicio)) novos.fim = 'O término deve ser depois do início.';
    setErros(novos);
    if (Object.keys(novos).length) return;

    const corpo = {
      titulo_atividade: form.titulo_atividade.trim(),
      data_hora_inicio: inicio,
      data_hora_fim: fim,
      id_competicao: form.id_competicao ? Number(form.id_competicao) : null
    };

    setEnviando(true);
    try {
      const res = editando
        ? await api.put(`/programacao/${editando.id_programacao}`, corpo)
        : await api.post('/programacao', { ...corpo, id_geektopia: id });
      mostrar('sucesso', res.data.message || 'Atividade salva.');
      cancelar();
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a atividade.'));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      const res = await api.delete(`/programacao/${alvo.id_programacao}`);
      mostrar('sucesso', res.data.message || 'Atividade removida.');
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível remover a atividade.'));
    }
  };

  // Agrupa por dia (a API já devolve em ordem cronológica).
  const dias = useMemo(() => {
    const mapa = new Map();
    atividades.forEach((a) => {
      const chave = paraInputData(a.data_hora_inicio);
      if (!mapa.has(chave)) mapa.set(chave, { titulo: tituloDoDia(a.data_hora_inicio), itens: [] });
      mapa.get(chave).itens.push(a);
    });
    return [...mapa.values()];
  }, [atividades]);

  const erroCampo = (n) => erros[n] && <p className="ed-erro-campo" id={`erro-p-${n}`} role="alert">{erros[n]}</p>;
  const aria = (n) => (erros[n] ? { 'aria-invalid': true, 'aria-describedby': `erro-p-${n}` } : {});

  return (
    <section className="ed-painel" aria-labelledby="t-prog">
      <h2 id="t-prog" className="ed-titulo">Programação</h2>
      <p className="ed-ajuda-topo">A grade de horários do evento, atividade por atividade. Ela aparece agrupada por dia na página pública.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      <form onSubmit={salvar} className="ed-form ed-form-inline" noValidate>
        <h3 className="ed-subtitulo-secao">{editando ? `Editando "${editando.titulo_atividade}"` : 'Nova atividade'}</h3>
        <div className="ed-campo">
          <label htmlFor="p-titulo">Título *</label>
          <input id="p-titulo" name="titulo_atividade" value={form.titulo_atividade} onChange={alterar} maxLength={150} placeholder="Ex: Abertura dos portões" {...aria('titulo_atividade')} />
          {erroCampo('titulo_atividade')}
        </div>
        <div className="ed-linha">
          <div className="ed-campo">
            <label htmlFor="p-inicio">Início *</label>
            <input id="p-inicio" name="inicio" type="datetime-local" value={form.inicio} onChange={alterar} {...aria('inicio')} />
            {erroCampo('inicio')}
          </div>
          <div className="ed-campo">
            <label htmlFor="p-fim">Término</label>
            <input id="p-fim" name="fim" type="datetime-local" value={form.fim} onChange={alterar} {...aria('fim')} />
            {erroCampo('fim')}
          </div>
          <div className="ed-campo">
            <label htmlFor="p-comp">É uma competição?</label>
            <select id="p-comp" name="id_competicao" value={form.id_competicao} onChange={alterar}>
              <option value="">Não, é uma atração comum</option>
              {competicoes.map((c) => <option key={c.id_competicao} value={c.id_competicao}>{c.nome_competicao}</option>)}
            </select>
          </div>
        </div>
        {foraDoEvento && (
          <p className="ed-alerta" role="status">Este horário está fora das datas cadastradas para o evento. Confira se não é engano.</p>
        )}
        <div className="ed-acoes ed-acoes-esquerda">
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar atividade' : '+ Adicionar à programação'}
          </button>
          {editando && <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar edição</button>}
        </div>
      </form>

      {carregando ? (
        <p className="ed-vazio">Carregando programação...</p>
      ) : dias.length === 0 ? (
        <div className="ed-vazio">
          <strong>A programação está vazia.</strong>
          <span>Adicione as atividades acima. Sem nenhuma, a seção não aparece no site.</span>
        </div>
      ) : (
        dias.map((dia) => (
          <div key={dia.titulo} className="ed-dia">
            <h3 className="ed-dia-titulo">{dia.titulo}</h3>
            <ul className="ed-lista">
              {dia.itens.map((a) => (
                <li className="ed-item" key={a.id_programacao}>
                  <span className="ed-hora">
                    {formatarHora(a.data_hora_inicio)}
                    {a.data_hora_fim && <small>até {formatarHora(a.data_hora_fim)}</small>}
                  </span>
                  <div className="ed-item-info">
                    <span className="ed-item-nome">
                      {a.titulo_atividade}
                      {a.competicao && <span className="ed-badge">Competição: {a.competicao.nome_competicao}</span>}
                    </span>
                  </div>
                  <div className="ed-item-acoes">
                    <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => comecarEdicao(a)}>Editar</button>
                    <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(a)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Remover atividade"
        message={`Remover "${excluir?.titulo_atividade}" da programação?`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
