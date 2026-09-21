import { useCallback, useState } from 'react';
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { ImagemUpload } from './ImagemUpload';
import { mover } from '../../utils/ordem';

const VAZIO = { nome: '', titulo_papel: '', descricao: '' };

const iniciais = (nome) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export function AbaConvidados({ evento, recarregarResumo, marcarAlterado }) {
  const id = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(VAZIO);
  const [foto, setFoto] = useState(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erroNome, setErroNome] = useState('');
  const [excluir, setExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(() => api.get(`/geektopia/admin/${id}/convidados`).then((r) => r.data), [id]);
  const { dados, erro: erroCarga, carregando, recarregar: carregar, definir: setLista } = useCarga(buscar);
  const lista = dados ?? [];

  const alterar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'nome') setErroNome('');
    marcarAlterado(true);
  };

  const cancelar = () => {
    setEditando(null);
    setForm(VAZIO);
    setFoto(null);
    setRemoverFoto(false);
    setErroNome('');
    marcarAlterado(false);
  };

  const comecarEdicao = (c) => {
    limpar();
    setEditando(c);
    setForm({ nome: c.nome, titulo_papel: c.titulo_papel || '', descricao: c.descricao || '' });
    setFoto(null);
    setRemoverFoto(false);
    setErroNome('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvar = async (e) => {
    e.preventDefault();
    limpar();

    if (!form.nome.trim()) {
      setErroNome('Informe o nome do convidado.');
      return;
    }

    const dados = new FormData();
    dados.append('nome', form.nome.trim());
    dados.append('titulo_papel', form.titulo_papel.trim());
    dados.append('descricao', form.descricao.trim());
    if (foto) dados.append('foto', foto);
    if (editando && removerFoto && !foto) dados.append('remover_foto', 'true');
    if (!editando) dados.append('id_geektopia', id);

    setEnviando(true);
    try {
      const res = editando
        ? await api.put(`/convidados/${editando.id_convidado}`, dados)
        : await api.post('/convidados', dados);
      mostrar('sucesso', res.data.message || 'Convidado salvo.');
      cancelar();
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar o convidado.'));
    } finally {
      setEnviando(false);
    }
  };

  // Reordena na tela na hora e confirma no servidor; se falhar, volta atrás.
  const reordenar = async (indice, delta) => {
    const anterior = lista;
    const nova = mover(lista, indice, delta);
    if (nova === lista) return;

    setLista(nova);
    try {
      await api.patch('/convidados/reordenar', { id_geektopia: id, ids: nova.map((c) => c.id_convidado) });
    } catch (err) {
      setLista(anterior);
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar a nova ordem.'));
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      const res = await api.delete(`/convidados/${alvo.id_convidado}`);
      mostrar('sucesso', res.data.message || 'Convidado removido.');
      if (editando?.id_convidado === alvo.id_convidado) cancelar();
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível remover o convidado.'));
    }
  };

  return (
    <section className="ed-painel" aria-labelledby="t-conv">
      <h2 id="t-conv" className="ed-titulo">Convidados</h2>
      <p className="ed-ajuda-topo">Artistas, criadores e convidados especiais. Aparecem como cartões na página do evento, na ordem abaixo.</p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      <form onSubmit={salvar} className="ed-form ed-form-inline" noValidate>
        <h3 className="ed-subtitulo-secao">{editando ? `Editando "${editando.nome}"` : 'Novo convidado'}</h3>
        <div className="ed-linha">
          <div className="ed-campo ed-campo-grande">
            <label htmlFor="cv-nome">Nome *</label>
            <input id="cv-nome" name="nome" value={form.nome} onChange={alterar} maxLength={150} aria-invalid={erroNome ? true : undefined} aria-describedby={erroNome ? 'erro-cv-nome' : undefined} />
            {erroNome && <p className="ed-erro-campo" id="erro-cv-nome" role="alert">{erroNome}</p>}
          </div>
          <div className="ed-campo">
            <label htmlFor="cv-papel">Papel / título</label>
            <input id="cv-papel" name="titulo_papel" value={form.titulo_papel} onChange={alterar} maxLength={100} placeholder="Ex: Dublador" />
          </div>
        </div>
        <div className="ed-campo">
          <label htmlFor="cv-desc">Descrição</label>
          <textarea id="cv-desc" name="descricao" rows={3} value={form.descricao} onChange={alterar} maxLength={2000} placeholder="Quem é, o que vai fazer no evento..." />
        </div>
        <ImagemUpload
          rotulo="Foto"
          formato="quadrada"
          urlAtual={removerFoto ? null : editando?.foto_url}
          arquivo={foto}
          onEscolher={(f) => { setFoto(f); if (f) setRemoverFoto(false); marcarAlterado(true); }}
          onRemover={editando ? () => { setRemoverFoto(true); marcarAlterado(true); } : undefined}
          ajuda="Rosto centralizado funciona melhor: a foto é recortada em quadrado. JPEG, PNG ou WEBP, até 15MB."
        />
        <div className="ed-acoes ed-acoes-esquerda">
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Salvando...' : editando ? 'Salvar convidado' : '+ Adicionar convidado'}
          </button>
          {editando && <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar edição</button>}
        </div>
      </form>

      {carregando ? (
        <p className="ed-vazio">Carregando convidados...</p>
      ) : lista.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhum convidado cadastrado.</strong>
          <span>A Geektopia Principal costuma ter convidados. Numa edição Pocket, tudo bem deixar em branco.</span>
        </div>
      ) : (
        <ul className="ed-lista">
          {lista.map((c, i) => (
            <li className="ed-item" key={c.id_convidado}>
              <span className="ed-avatar" aria-hidden="true">
                {c.foto_url ? <img src={c.foto_url} alt="" /> : iniciais(c.nome)}
              </span>
              <div className="ed-item-info">
                <span className="ed-item-nome">{c.nome}</span>
                <span className="ed-item-detalhe">{c.titulo_papel || 'Sem papel definido'}</span>
              </div>
              <div className="ed-item-acoes">
                <button type="button" className="ed-icone-btn" aria-label={`Subir ${c.nome}`} disabled={i === 0} onClick={() => reordenar(i, -1)}><FiArrowUp /></button>
                <button type="button" className="ed-icone-btn" aria-label={`Descer ${c.nome}`} disabled={i === lista.length - 1} onClick={() => reordenar(i, 1)}><FiArrowDown /></button>
                <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => comecarEdicao(c)}>Editar</button>
                <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(c)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Remover convidado"
        message={`Remover "${excluir?.nome}"? A foto também será apagada.`}
        confirmLabel="Remover"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
