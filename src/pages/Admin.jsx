import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { PromoteModal } from '../components/PromoteModal';
import { Paginacao } from '../components/Paginacao';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { mascaraCnpj, mascaraCpf } from '../utils/mascaras';
import '../style/AdminEdicao.css';

const TAMANHOS = [10, 20, 50, 100];

function documentoDe(u) {
  if (u.cpf) return `CPF ${mascaraCpf(u.cpf)}`;
  if (u.cnpj) return `CNPJ ${mascaraCnpj(u.cnpj)}`;
  if (u.passaporte) return `Passaporte ${u.passaporte}`;
  return 'Sem documento';
}

// Lista de usuários do painel. Paginada e filtrada NO SERVIDOR (só a página
// pedida chega ao navegador), com o estado na URL: recarregar a página, voltar
// ou compartilhar o link mantém a busca e a página.
export function Admin() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const tipo = params.get('tipo') || '';
  const ordem = params.get('ordem') || 'recentes';
  const limite = Number(params.get('limite')) || 20;
  const pagina = Number(params.get('pagina')) || 1;

  const [busca, setBusca] = useState(q); // o que a pessoa digitou (a URL só muda depois de uma pausa)
  const temporizador = useRef(null);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const { aviso, mostrar } = useAviso();
  const [idParaExcluir, setIdParaExcluir] = useState(null);
  const [usuarioParaPromover, setUsuarioParaPromover] = useState(null);

  const buscar = useCallback(
    () => api.get('/auth/admin/users', { params: { q, tipo, ordem, limite, pagina } }).then((r) => r.data),
    [q, tipo, ordem, limite, pagina]
  );
  const { dados, erro, carregando, atualizando, recarregar } = useCarga(buscar);

  const usuarios = dados?.itens ?? [];
  const total = dados?.total ?? 0;
  const paginaAtual = dados?.pagina ?? pagina;

  // Muda um ou mais filtros; qualquer mudança (menos a de página) volta à página 1.
  const atualizarUrl = (mudancas, { manterPagina = false } = {}) => {
    const novo = new URLSearchParams(params);
    Object.entries(mudancas).forEach(([chave, valor]) => {
      if (valor === '' || valor === null || valor === undefined) novo.delete(chave);
      else novo.set(chave, String(valor));
    });
    if (!manterPagina) novo.delete('pagina');
    setParams(novo, { replace: true });
  };

  const aoDigitar = (e) => {
    const texto = e.target.value;
    setBusca(texto);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => atualizarUrl({ q: texto.trim() }), 350); // espera a pessoa parar de digitar
  };

  const limparFiltros = () => {
    clearTimeout(temporizador.current);
    setBusca('');
    setParams(new URLSearchParams({ limite: String(limite) }), { replace: true });
  };

  const confirmarPromocao = async (nivel) => {
    const id = usuarioParaPromover;
    setUsuarioParaPromover(null);
    try {
      const res = await api.post(`/auth/admin/promote/${id}`, { nivel_permissao: nivel });
      mostrar('sucesso', res.data.message);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Erro ao promover.'));
    }
  };

  const rebaixar = async (id) => {
    try {
      const res = await api.patch(`/auth/admin/demote/${id}`);
      mostrar('sucesso', res.data.message);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Erro ao rebaixar.'));
    }
  };

  const confirmarExclusao = async () => {
    const id = idParaExcluir;
    setIdParaExcluir(null);
    try {
      const res = await api.delete(`/auth/admin/users/${id}`);
      mostrar('sucesso', res.data.message);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Erro ao excluir.'));
    }
  };

  const filtrando = Boolean(q || tipo);
  const avisoInicial = location.state?.sucesso ? { tipo: 'sucesso', texto: location.state.sucesso } : aviso;

  return (
    <div className="ed-pagina">
      <Link to="/admin" className="btn btn-secondary ed-voltar">← Painel</Link>
      <div className="ed-lista-cabecalho">
        <h1 className="ed-titulo-pagina">Usuários</h1>
        <Link to="/admin/usuarios/novo" className="btn btn-primary">+ Novo usuário</Link>
      </div>

      <AvisoBox aviso={avisoDaTela(aviso.texto ? aviso : avisoInicial, erro)} />

      <div className="usr-filtros" role="search">
        <div className="ed-campo usr-busca">
          <label htmlFor="usr-q">Buscar</label>
          <input
            id="usr-q" type="search" value={busca} onChange={aoDigitar} autoComplete="off"
            placeholder="Nome, e-mail ou início do CPF"
          />
        </div>
        <div className="ed-campo">
          <label htmlFor="usr-tipo">Tipo</label>
          <select id="usr-tipo" value={tipo} onChange={(e) => atualizarUrl({ tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="cliente">Clientes</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
        <div className="ed-campo">
          <label htmlFor="usr-ordem">Ordenar</label>
          <select id="usr-ordem" value={ordem} onChange={(e) => atualizarUrl({ ordem: e.target.value === 'recentes' ? '' : e.target.value })}>
            <option value="recentes">Mais recentes</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </div>
        <div className="ed-campo">
          <label htmlFor="usr-limite">Por página</label>
          <select id="usr-limite" value={limite} onChange={(e) => atualizarUrl({ limite: e.target.value })}>
            {TAMANHOS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {carregando ? (
        <p className="ed-vazio">Carregando usuários...</p>
      ) : usuarios.length === 0 ? (
        <div className="ed-vazio">
          <strong>{filtrando ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</strong>
          {filtrando && <span>{q ? `Nada bate com “${q}”` : 'Nada nesse filtro'}. Confira a grafia ou tente menos letras.</span>}
          {filtrando && <button type="button" className="btn btn-secondary ed-btn-sm" style={{ alignSelf: 'center', marginTop: 8 }} onClick={limparFiltros}>Limpar filtros</button>}
        </div>
      ) : (
        <div className={atualizando ? 'usr-atualizando' : undefined} aria-busy={atualizando}>
          <ul className="ed-lista">
            {usuarios.map((u) => (
              <li className="ed-item usr-item" key={u.id_usuario}>
                <div className="ed-item-info">
                  <span className="ed-item-nome">
                    {u.nome_completo}
                    <span className={`ed-badge ${u.administrador ? 'is-ok' : ''}`}>
                      {u.administrador ? (u.administrador.nivel_permissao === 'ADMIN_GERAL' ? 'Admin Geral' : 'Admin Conteúdo') : 'Cliente'}
                    </span>
                  </span>
                  <span className="ed-item-detalhe">{u.email}</span>
                  <span className="ed-item-detalhe">
                    {documentoDe(u)}{u.cidade && ` · ${u.cidade}${u.estado ? `/${u.estado}` : ''}`}
                  </span>
                </div>
                <div className="ed-item-acoes">
                  <Link to={`/admin/usuarios/${u.id_usuario}/editar`} className="btn btn-secondary ed-btn-sm">Editar</Link>
                  {u.administrador ? (
                    <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => rebaixar(u.id_usuario)}>Rebaixar</button>
                  ) : (
                    <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => setUsuarioParaPromover(u.id_usuario)}>Promover a admin</button>
                  )}
                  <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setIdParaExcluir(u.id_usuario)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>

          <Paginacao
            pagina={paginaAtual} paginas={dados?.paginas ?? 1} total={total} limite={dados?.limite ?? limite}
            rotuloItens={total === 1 ? 'usuário' : 'usuários'}
            onMudar={(p) => { atualizarUrl({ pagina: p }, { manterPagina: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      )}

      <PromoteModal isOpen={usuarioParaPromover !== null} onConfirm={confirmarPromocao} onCancel={() => setUsuarioParaPromover(null)} />

      <ConfirmModal
        isOpen={idParaExcluir !== null}
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Só é possível se ele não tiver pedidos, ingressos ou outros registros. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </div>
  );
}
