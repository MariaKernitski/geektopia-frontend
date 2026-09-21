import { useCallback, useState } from 'react';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { formatarMoeda } from '../../utils/datas';
import { CATEGORIAS, ROTULO_CATEGORIA } from '../../utils/evento';

const VAZIO = { nome_lote: '', categoria: 'Inteira', valor_ingresso: '', quantidade_total: '' };

export function AbaIngressos({ evento, recarregarResumo, marcarAlterado }) {
  const id = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(VAZIO);
  const [editando, setEditando] = useState(null); // lote em edição, ou null = criando
  const [erros, setErros] = useState({});
  const [excluir, setExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(() => api.get(`/geektopia/admin/${id}/lotes`).then((r) => r.data), [id]);
  const { dados, erro: erroCarga, carregando, recarregar: carregar } = useCarga(buscar);
  const lotes = dados ?? [];

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

  const comecarEdicao = (lote) => {
    limpar();
    setEditando(lote);
    setForm({
      nome_lote: lote.nome_lote || '',
      categoria: lote.categoria || 'Inteira',
      valor_ingresso: String(lote.valor_ingresso ?? ''),
      quantidade_total: String(lote.quantidade_total ?? '')
    });
    setErros({});
  };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    const novos = {};
    if (!form.nome_lote.trim()) novos.nome_lote = 'Dê um nome ao lote.';
    const valor = Number(form.valor_ingresso);
    if (!form.valor_ingresso || !(valor > 0)) novos.valor_ingresso = 'Informe um valor maior que zero.';
    const qtd = Number(form.quantidade_total);
    if (!Number.isInteger(qtd) || qtd <= 0) novos.quantidade_total = 'Informe um número inteiro maior que zero.';
    else if (editando && qtd < (editando.ingressos_emitidos || 0)) {
      novos.quantidade_total = `Já foram vendidos ${editando.ingressos_emitidos}. A quantidade não pode ser menor.`;
    }
    setErros(novos);
    if (Object.keys(novos).length) return;

    const corpo = { nome_lote: form.nome_lote.trim(), categoria: form.categoria, valor_ingresso: valor, quantidade_total: qtd };

    setEnviando(true);
    try {
      const res = editando
        ? await api.put(`/lotes/${editando.id_lote}`, corpo)
        : await api.post('/lotes', { ...corpo, id_geektopia: id });
      mostrar('sucesso', res.data.message || 'Lote salvo.');
      cancelar();
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar o lote.'));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      const res = await api.delete(`/lotes/${alvo.id_lote}`);
      mostrar('sucesso', res.data.message || 'Lote excluído.');
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível excluir o lote.'));
    }
  };

  const capacidade = lotes.reduce((s, l) => s + (l.quantidade_total || 0), 0);
  const potencial = lotes.reduce((s, l) => s + (l.quantidade_total || 0) * (l.valor_ingresso || 0), 0);

  const erroCampo = (n) => erros[n] && <p className="ed-erro-campo" id={`erro-l-${n}`} role="alert">{erros[n]}</p>;
  const aria = (n) => (erros[n] ? { 'aria-invalid': true, 'aria-describedby': `erro-l-${n}` } : {});

  return (
    <section className="ed-painel" aria-labelledby="t-ing">
      <h2 id="t-ing" className="ed-titulo">Lotes de ingresso</h2>
      <p className="ed-ajuda-topo">Cada lote é um ingresso com preço e quantidade próprios (ex.: "Inteira - 1º Lote", "Meia - 2º Lote", "Meet &amp; Greet Tiga"). O <strong>tipo</strong> agrupa os lotes em abas na página do evento; o nome é o que o visitante lê. Os lotes aparecem assim que as vendas forem abertas.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      <form onSubmit={salvar} className="ed-form ed-form-inline" noValidate>
        <h3 className="ed-subtitulo-secao">{editando ? `Editando "${editando.nome_lote}"` : 'Novo lote'}</h3>
        <div className="ed-linha">
          <div className="ed-campo ed-campo-grande">
            <label htmlFor="l-nome">Nome *</label>
            <input id="l-nome" name="nome_lote" value={form.nome_lote} onChange={alterar} placeholder="Ex: Inteira - 1º Lote" maxLength={50} {...aria('nome_lote')} />
            {erroCampo('nome_lote')}
          </div>
          <div className="ed-campo">
            <label htmlFor="l-cat">Tipo de ingresso</label>
            <select id="l-cat" name="categoria" value={form.categoria} onChange={alterar}>
              {CATEGORIAS.map((c) => <option key={c.chave} value={c.chave}>{c.rotulo}</option>)}
            </select>
          </div>
          <div className="ed-campo">
            <label htmlFor="l-valor">Valor (R$) *</label>
            <input id="l-valor" name="valor_ingresso" type="number" step="0.01" min="0.01" inputMode="decimal" value={form.valor_ingresso} onChange={alterar} placeholder="25,00" {...aria('valor_ingresso')} />
            {erroCampo('valor_ingresso')}
          </div>
          <div className="ed-campo">
            <label htmlFor="l-qtd">Quantidade *</label>
            <input id="l-qtd" name="quantidade_total" type="number" min="1" step="1" inputMode="numeric" value={form.quantidade_total} onChange={alterar} placeholder="100" {...aria('quantidade_total')} />
            {erroCampo('quantidade_total')}
          </div>
        </div>
        <div className="ed-acoes ed-acoes-esquerda">
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar lote' : '+ Adicionar lote'}
          </button>
          {editando && <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar edição</button>}
        </div>
      </form>

      {carregando ? (
        <p className="ed-vazio">Carregando lotes...</p>
      ) : lotes.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhum lote ainda.</strong>
          <span>Sem ao menos um lote não é possível abrir as vendas. Cadastre o primeiro acima.</span>
        </div>
      ) : (
        <>
          <ul className="ed-lista">
            {lotes.map((lote) => (
              <li className="ed-item" key={lote.id_lote}>
                <div className="ed-item-info">
                  <span className="ed-item-nome">
                    {lote.nome_lote}
                    <span className="ed-badge">{ROTULO_CATEGORIA[lote.categoria] || 'Inteira'}</span>
                    {lote.esgotado && <span className="ed-badge is-erro">Esgotado</span>}
                  </span>
                  <span className="ed-item-detalhe">
                    {formatarMoeda(lote.valor_ingresso)} · {lote.ingressos_emitidos ?? 0} de {lote.quantidade_total} vendidos
                    {lote.restantes !== undefined && ` · restam ${lote.restantes}`}
                  </span>
                </div>
                <div className="ed-item-acoes">
                  <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => comecarEdicao(lote)}>Editar</button>
                  <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(lote)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="ed-resumo">{lotes.length} lote(s) · capacidade total de {capacidade} ingressos · potencial de {formatarMoeda(potencial)}</p>
        </>
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Excluir lote"
        message={`Excluir o lote "${excluir?.nome_lote}"? Só é possível se nenhum ingresso dele tiver sido vendido.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
