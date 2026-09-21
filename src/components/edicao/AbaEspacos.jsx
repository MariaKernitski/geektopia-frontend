import { useCallback, useState } from 'react';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { AvisoBox } from './AvisoBox';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { formatarMoeda } from '../../utils/datas';

// Campos numéricos do catálogo. `dec` = aceita casas decimais.
const NUMERICOS = [
  { nome: 'largura_espaco', rotulo: 'Largura do espaço (m)', dec: true, grupo: 'espaco' },
  { nome: 'comprimento_espaco', rotulo: 'Comprimento do espaço (m)', dec: true, grupo: 'espaco' },
  { nome: 'qtd_mesas', rotulo: 'Mesas incluídas', grupo: 'kit' },
  { nome: 'largura_mesa', rotulo: 'Largura da mesa (m)', dec: true, grupo: 'kit' },
  { nome: 'comprimento_mesa', rotulo: 'Comprimento da mesa (m)', dec: true, grupo: 'kit' },
  { nome: 'quantidade_cadeiras', rotulo: 'Cadeiras incluídas', grupo: 'kit' },
  { nome: 'qtd_credenciais_inclusas', rotulo: 'Credenciais incluídas', grupo: 'kit' },
  { nome: 'valor_base', rotulo: 'Valor base (R$) *', dec: true, grupo: 'preco' },
  { nome: 'valor_taxa_ajudante', rotulo: 'Taxa por ajudante extra (R$)', dec: true, grupo: 'preco' },
  { nome: 'valor_taxa_mesa_extra', rotulo: 'Taxa por mesa extra (R$)', dec: true, grupo: 'preco' },
  { nome: 'valor_taxa_cadeira_extra', rotulo: 'Taxa por cadeira extra (R$)', dec: true, grupo: 'preco' }
];

const VAZIO = Object.fromEntries([['tipo_espaco', ''], ['descricao', ''], ...NUMERICOS.map((n) => [n.nome, ''])]);

const doEspaco = (e) => Object.fromEntries([
  ['tipo_espaco', e.tipo_espaco || ''],
  ['descricao', e.descricao || ''],
  ...NUMERICOS.map((n) => [n.nome, e[n.nome] === null || e[n.nome] === undefined ? '' : String(e[n.nome])])
]);

// Espaços de exposição DESTA edição (mesa, barraca, estande...). Cada edição tem os
// seus: mudam o local, o layout e os preços. Sem eles ninguém consegue pedir espaço,
// porque o expositor escolhe a edição e vê só os espaços dela.
export function AbaEspacos({ evento, recarregarResumo }) {
  const idEdicao = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [form, setForm] = useState(VAZIO);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [excluir, setExcluir] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(() => api.get('/espacos', { params: { id_geektopia: idEdicao } }).then((r) => r.data), [idEdicao]);
  const buscarOutras = useCallback(() => api.get('/geektopia/admin/todas').then((r) => r.data.filter((e) => e.id_geektopia !== idEdicao)), [idEdicao]);
  const { dados: outras } = useCarga(buscarOutras);
  const [origemCopia, setOrigemCopia] = useState('');
  const { dados, erro: erroCarga, carregando, recarregar } = useCarga(buscar);
  const espacos = dados ?? [];

  const alterar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErros((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const abrirNovo = () => { limpar(); setEditando(null); setForm(VAZIO); setErros({}); setFormAberto(true); };
  const abrirEdicao = (e) => { limpar(); setEditando(e); setForm(doEspaco(e)); setErros({}); setFormAberto(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const fechar = () => { setFormAberto(false); setEditando(null); setForm(VAZIO); setErros({}); };

  const salvar = async (ev) => {
    ev.preventDefault();
    limpar();

    const novos = {};
    if (!form.tipo_espaco.trim()) novos.tipo_espaco = 'Dê um nome ao espaço (ex.: Barraca 3x3).';
    NUMERICOS.forEach((n) => {
      const v = form[n.nome];
      if (v !== '' && !(Number(v) >= 0)) novos[n.nome] = 'Informe um número a partir de zero.';
      else if (v !== '' && !n.dec && !Number.isInteger(Number(v))) novos[n.nome] = 'Informe um número inteiro.';
    });
    if (!(Number(form.valor_base) > 0)) novos.valor_base = 'Informe o valor base do espaço (maior que zero).';
    setErros(novos);
    if (Object.keys(novos).length) {
      document.getElementById(`e-${Object.keys(novos)[0]}`)?.focus();
      return;
    }

    const corpo = { id_geektopia: idEdicao, tipo_espaco: form.tipo_espaco.trim(), descricao: form.descricao.trim() || null };
    NUMERICOS.forEach((n) => { corpo[n.nome] = form[n.nome] === '' ? null : Number(form[n.nome]); });

    setEnviando(true);
    try {
      const res = editando ? await api.put(`/espacos/${editando.id_espaco}`, corpo) : await api.post('/espacos', corpo);
      mostrar('sucesso', res.data.message || 'Espaço salvo.');
      fechar();
      recarregar();
      recarregarResumo?.();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível salvar o espaço.'));
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async () => {
    limpar();
    try {
      const res = await api.post('/espacos/copiar', { de_geektopia: Number(origemCopia), para_geektopia: idEdicao });
      mostrar('sucesso', res.data.message);
      setOrigemCopia('');
      recarregar();
      recarregarResumo?.();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível copiar os espaços.'));
    }
  };

  const confirmarExclusao = async () => {
    const alvo = excluir;
    setExcluir(null);
    try {
      const res = await api.delete(`/espacos/${alvo.id_espaco}`);
      mostrar('sucesso', res.data.message || 'Espaço excluído.');
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível excluir o espaço.'));
    }
  };

  const campo = (n) => (
    <div className="ed-campo" key={n.nome}>
      <label htmlFor={`e-${n.nome}`}>{n.rotulo}</label>
      <input
        id={`e-${n.nome}`} name={n.nome} type="number" min="0" step={n.dec ? '0.01' : '1'} inputMode={n.dec ? 'decimal' : 'numeric'}
        value={form[n.nome]} onChange={alterar}
        aria-invalid={erros[n.nome] ? true : undefined} aria-describedby={erros[n.nome] ? `erro-e-${n.nome}` : undefined}
      />
      {erros[n.nome] && <p className="ed-erro-campo" id={`erro-e-${n.nome}`} role="alert">{erros[n.nome]}</p>}
    </div>
  );
  const grupo = (g) => <div className="ed-linha ed-linha-quebra">{NUMERICOS.filter((n) => n.grupo === g).map(campo)}</div>;

  return (
    <section className="ed-painel" aria-labelledby="t-esp">
      <div className="ed-lista-cabecalho">
        <h2 id="t-esp" className="ed-titulo">Espaços de exposição</h2>
        {!formAberto && <button type="button" className="btn btn-primary" onClick={abrirNovo}>+ Novo espaço</button>}
      </div>
      <p className="ed-ajuda-topo">
        Os espaços que expositores podem pedir <strong>nesta edição</strong> (ex.: barraca, mesa de artista, estande). O valor e as taxas
        são <strong>congelados no momento da candidatura</strong>: mudar o preço aqui não altera o que quem já se candidatou vai pagar.
      </p>

      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      {formAberto && (
        <form onSubmit={salvar} className="ed-form-espaco" noValidate>
          <h2 className="ed-titulo">{editando ? `Editando "${editando.tipo_espaco}"` : 'Novo espaço'}</h2>

          <div className="ed-campo">
            <label htmlFor="e-tipo_espaco">Nome do espaço *</label>
            <input
              id="e-tipo_espaco" name="tipo_espaco" value={form.tipo_espaco} onChange={alterar} maxLength={100} placeholder="Ex: Barraca 3x3"
              aria-invalid={erros.tipo_espaco ? true : undefined} aria-describedby={erros.tipo_espaco ? 'erro-e-tipo_espaco' : undefined}
            />
            {erros.tipo_espaco && <p className="ed-erro-campo" id="erro-e-tipo_espaco" role="alert">{erros.tipo_espaco}</p>}
          </div>

          <fieldset className="ed-fieldset"><legend>Tamanho do espaço</legend>{grupo('espaco')}</fieldset>
          <fieldset className="ed-fieldset"><legend>O que já está incluído</legend>{grupo('kit')}</fieldset>
          <fieldset className="ed-fieldset">
            <legend>Preço</legend>
            {grupo('preco')}
            <p className="ed-ajuda">As taxas extras são cobradas por unidade quando o expositor pede mais que o incluído.</p>
          </fieldset>

          <div className="ed-campo">
            <label htmlFor="e-descricao">Descrição</label>
            <textarea id="e-descricao" name="descricao" rows={3} value={form.descricao} onChange={alterar} placeholder="Para que tipo de exposição serve, regras de uso..." />
          </div>

          <div className="ed-acoes ed-acoes-esquerda">
            <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar espaço'}</button>
            <button type="button" className="btn btn-secondary" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      )}

      {carregando ? (
        <p className="ed-vazio">Carregando espaços...</p>
      ) : espacos.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhum espaço cadastrado.</strong>
          <span>Cadastre ao menos um para que os expositores consigam se candidatar a esta edição.</span>
          {(outras ?? []).length > 0 && (
            <div className="ed-campo" style={{ maxWidth: 360, margin: '12px auto 0', textAlign: 'left' }}>
              <label htmlFor="esp-copia">Ou reaproveite os espaços de outra edição</label>
              <select id="esp-copia" value={origemCopia} onChange={(e) => setOrigemCopia(e.target.value)}>
                <option value="">Escolha uma edição...</option>
                {outras.map((o) => <option key={o.id_geektopia} value={o.id_geektopia}>{o.nome_edicao}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" disabled={!origemCopia} onClick={copiar} style={{ marginTop: 8 }}>Copiar espaços</button>
            </div>
          )}
        </div>
      ) : (
        <ul className="ed-lista">
          {espacos.map((e) => (
            <li className="ed-item" key={e.id_espaco}>
              <div className="ed-item-info">
                <span className="ed-item-nome">
                  {e.tipo_espaco}
                  {e.area_m2 !== null && <span className="ed-badge">{e.area_m2} m²</span>}
                </span>
                <span className="ed-item-detalhe">
                  {formatarMoeda(e.valor_base)}
                  {e.qtd_mesas !== null && ` · ${e.qtd_mesas} mesa(s)`}
                  {e.quantidade_cadeiras !== null && ` · ${e.quantidade_cadeiras} cadeira(s)`}
                  {e.qtd_credenciais_inclusas !== null && ` · ${e.qtd_credenciais_inclusas} credencial(is)`}
                </span>
              </div>
              <div className="ed-item-acoes">
                <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => abrirEdicao(e)}>Editar</button>
                <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setExcluir(e)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={excluir !== null}
        title="Excluir espaço"
        message={`Excluir "${excluir?.tipo_espaco}"? Só é possível se nenhuma solicitação de expositor estiver ligada a ele.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluir(null)}
      />
    </section>
  );
}
