import { useCallback, useState } from 'react';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { formatarMoeda } from '../../utils/datas';

const VAZIO = { nome_competicao: '', modalidade: '', valor_taxa_inscricao: '', regras_url: '' };
const MODALIDADES = [
  { valor: 'Solo', rotulo: 'Solo (individual)' },
  { valor: 'Dupla', rotulo: 'Dupla' },
  { valor: 'Grupo', rotulo: 'Grupo / equipe' }
];

export function AbaCompeticoes({ evento, recarregarResumo, marcarAlterado }) {
  const id = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [excluir, setExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(() => api.get(`/geektopia/admin/${id}/competicoes`).then((r) => r.data), [id]);
  const { dados, erro: erroCarga, carregando, recarregar: carregar } = useCarga(buscar);
  const lista = dados ?? [];

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

  const comecarEdicao = (c) => {
    limpar();
    setEditando(c);
    setForm({
      nome_competicao: c.nome_competicao || '',
      modalidade: c.modalidade || '',
      valor_taxa_inscricao: c.valor_taxa_inscricao === null ? '' : String(c.valor_taxa_inscricao),
      regras_url: c.regras_url || ''
    });
    setErros({});
  };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    const novos = {};
    if (!form.nome_competicao.trim()) novos.nome_competicao = 'Dê um nome à competição.';
    if (form.valor_taxa_inscricao !== '' && !(Number(form.valor_taxa_inscricao) >= 0)) {
      novos.valor_taxa_inscricao = 'Informe um valor a partir de zero, ou deixe em branco para competição gratuita.';
    }
    if (form.regras_url.trim() && !/^https?:\/\//i.test(form.regras_url.trim())) {
      novos.regras_url = 'O link deve começar com http:// ou https://';
    }
    setErros(novos);
    if (Object.keys(novos).length) return;

    const corpo = {
      nome_competicao: form.nome_competicao.trim(),
      modalidade: form.modalidade || null,
      valor_taxa_inscricao: form.valor_taxa_inscricao === '' ? null : Number(form.valor_taxa_inscricao),
      regras_url: form.regras_url.trim() || null
    };

    setEnviando(true);
    try {
      const res = editando
        ? await api.put(`/competicoes/${editando.id_competicao}`, corpo)
        : await api.post('/competicoes', { ...corpo, id_geektopia: id });
      mostrar('sucesso', res.data.message || 'Competição salva.');
      cancelar();
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a competição.'));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      const res = await api.delete(`/competicoes/${alvo.id_competicao}`);
      mostrar('sucesso', res.data.message || 'Competição excluída.');
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível excluir a competição.'));
    }
  };

  const erroCampo = (n) => erros[n] && <p className="ed-erro-campo" id={`erro-c-${n}`} role="alert">{erros[n]}</p>;
  const aria = (n) => (erros[n] ? { 'aria-invalid': true, 'aria-describedby': `erro-c-${n}` } : {});

  return (
    <section className="ed-painel" aria-labelledby="t-comp">
      <h2 id="t-comp" className="ed-titulo">Competições</h2>
      <p className="ed-ajuda-topo">Cadastre as competições desta edição (cosplay, torneios, K-pop...). Depois você pode encaixá-las na programação. A análise das inscrições dos competidores é feita em outra tela.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      <form onSubmit={salvar} className="ed-form ed-form-inline" noValidate>
        <h3 className="ed-subtitulo-secao">{editando ? `Editando "${editando.nome_competicao}"` : 'Nova competição'}</h3>
        <div className="ed-linha">
          <div className="ed-campo ed-campo-grande">
            <label htmlFor="c-nome">Nome *</label>
            <input id="c-nome" name="nome_competicao" value={form.nome_competicao} onChange={alterar} maxLength={100} placeholder="Ex: Concurso Cosplay" {...aria('nome_competicao')} />
            {erroCampo('nome_competicao')}
          </div>
          <div className="ed-campo">
            <label htmlFor="c-mod">Modalidade</label>
            <select id="c-mod" name="modalidade" value={form.modalidade} onChange={alterar}>
              <option value="">Não definida</option>
              {MODALIDADES.map((m) => <option key={m.valor} value={m.valor}>{m.rotulo}</option>)}
            </select>
          </div>
          <div className="ed-campo">
            <label htmlFor="c-taxa">Taxa de inscrição (R$)</label>
            <input id="c-taxa" name="valor_taxa_inscricao" type="number" min="0" step="0.01" inputMode="decimal" value={form.valor_taxa_inscricao} onChange={alterar} placeholder="Vazio = gratuita" {...aria('valor_taxa_inscricao')} />
            {erroCampo('valor_taxa_inscricao')}
          </div>
        </div>
        <div className="ed-campo">
          <label htmlFor="c-regras">Link das regras</label>
          <input id="c-regras" name="regras_url" type="url" value={form.regras_url} onChange={alterar} placeholder="https://..." {...aria('regras_url')} />
          {erroCampo('regras_url')}
        </div>
        <div className="ed-acoes ed-acoes-esquerda">
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar competição' : '+ Adicionar competição'}
          </button>
          {editando && <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar edição</button>}
        </div>
      </form>

      {carregando ? (
        <p className="ed-vazio">Carregando competições...</p>
      ) : lista.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhuma competição cadastrada.</strong>
          <span>Se esta edição não terá competições, tudo bem: a seção simplesmente não aparece no site.</span>
        </div>
      ) : (
        <ul className="ed-lista">
          {lista.map((c) => (
            <li className="ed-item" key={c.id_competicao}>
              <div className="ed-item-info">
                <span className="ed-item-nome">{c.nome_competicao}{c.modalidade && <span className="ed-badge">{c.modalidade}</span>}</span>
                <span className="ed-item-detalhe">
                  {c.valor_taxa_inscricao ? `Inscrição ${formatarMoeda(c.valor_taxa_inscricao)}` : 'Inscrição gratuita'}
                </span>
              </div>
              <div className="ed-item-acoes">
                <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => comecarEdicao(c)}>Editar</button>
                <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(c)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Excluir competição"
        message={`Excluir "${excluir?.nome_competicao}"? Não é possível se já houver inscrições, equipes ou atividades da programação ligadas a ela.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
