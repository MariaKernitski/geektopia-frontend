import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { cpfValido, formatarCpf, somenteDigitos } from '../utils/cpf';
import { formatarMoeda } from '../utils/datas';
import { ETAPAS, situacaoDaSolicitacao } from '../utils/solicitacao';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

export function ExpositorSolicitacao() {
  const { id } = useParams();
  const buscar = useCallback(async () => {
    const [s, aj] = await Promise.all([
      api.get(`/solicitacoes-espaco/${id}`),
      api.get(`/solicitacoes-espaco/${id}/ajudantes`)
    ]);
    return { s: s.data, ajudantes: aj.data };
  }, [id]);
  const carga = useCarga(buscar);

  if (carga.carregando) return <div className="ed-pagina ed-pagina-estreita"><p className="ed-vazio">Carregando...</p></div>;
  if (!carga.dados) {
    return (
      <div className="ed-pagina ed-pagina-estreita">
        <Link to="/expositor" className="btn btn-secondary ed-voltar">← Área do expositor</Link>
        <div className="ed-aviso is-erro" role="alert">{carga.erro || 'Solicitação não encontrada.'}</div>
      </div>
    );
  }
  return <Detalhe key={id} carga={carga} />;
}

function Detalhe({ carga }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { aviso, mostrar, limpar } = useAviso();
  const { s, ajudantes } = carga.dados;

  const [editandoExtras, setEditandoExtras] = useState(false);
  const [extras, setExtras] = useState({ ajudantes: s.qtd_ajudantes_extras || 0, mesas: s.qtd_mesas_extras || 0, cadeiras: s.qtd_cadeiras_extras || 0 });
  const [ajudante, setAjudante] = useState({ nome: '', cpf: '' });
  const [errosAj, setErrosAj] = useState({});
  const [cancelar, setCancelar] = useState(false);
  const [removerAj, setRemoverAj] = useState(null);
  const [trabalhando, setTrabalhando] = useState(false);

  const sit = situacaoDaSolicitacao(s);
  const emAnalise = s.status_solicitacao === 'EmAnalise';
  const limite = s.qtd_ajudantes_extras || 0;
  const podeAddAjudante = emAnalise && ajudantes.length < limite;

  // Mensagem da tela anterior (ex.: "Solicitação enviada!"), até a primeira ação nova.
  const avisoInicial = location.state?.sucesso ? { tipo: 'sucesso', texto: location.state.sucesso } : aviso;

  const pagar = async () => {
    limpar();
    setTrabalhando(true);
    try {
      const res = await api.post(`/solicitacoes-espaco/${s.id_solicitacao}/pagamento`);
      window.location.href = res.data.init_point; // vai para o Mercado Pago
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível gerar o pagamento. Tente de novo.'));
      setTrabalhando(false);
    }
  };

  const salvarExtras = async (e) => {
    e.preventDefault();
    limpar();
    setTrabalhando(true);
    try {
      const res = await api.put(`/solicitacoes-espaco/${s.id_solicitacao}`, {
        qtd_ajudantes_extras: extras.ajudantes, qtd_mesas_extras: extras.mesas, qtd_cadeiras_extras: extras.cadeiras
      });
      setEditandoExtras(false);
      mostrar('sucesso', `${res.data.message} Novo total: ${formatarMoeda(res.data.solicitacao.valor_total_final)}.`);
      carga.recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível atualizar a solicitação.'));
    } finally {
      setTrabalhando(false);
    }
  };

  const cancelarSolicitacao = async () => {
    setCancelar(false);
    setTrabalhando(true);
    try {
      await api.delete(`/solicitacoes-espaco/${s.id_solicitacao}`);
      navigate('/expositor', { state: { sucesso: 'Solicitação cancelada.' } });
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível cancelar a solicitação.'));
      setTrabalhando(false);
    }
  };

  const adicionarAjudante = async (e) => {
    e.preventDefault();
    limpar();
    const novos = {};
    if (ajudante.nome.trim().length < 3) novos.nome = 'Informe o nome completo.';
    if (!cpfValido(ajudante.cpf)) novos.cpf = 'CPF inválido. Confira os números.';
    setErrosAj(novos);
    if (Object.keys(novos).length) return;

    setTrabalhando(true);
    try {
      await api.post(`/solicitacoes-espaco/${s.id_solicitacao}/ajudantes`, { nome_completo: ajudante.nome.trim(), cpf: somenteDigitos(ajudante.cpf) });
      setAjudante({ nome: '', cpf: '' });
      carga.recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível cadastrar o ajudante.'));
    } finally {
      setTrabalhando(false);
    }
  };

  const removerAjudante = async () => {
    const alvo = removerAj;
    setRemoverAj(null);
    try {
      await api.delete(`/solicitacoes-espaco/${s.id_solicitacao}/ajudantes/${alvo.id_ajudante}`);
      carga.recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível remover o ajudante.'));
    }
  };

  const linha = (rotulo, qtd, unit, incluir = true) => incluir && qtd > 0 && (
    <div className="pt-valor-linha"><span>{qtd} × {rotulo} ({formatarMoeda(unit)})</span><span>{formatarMoeda(qtd * (unit || 0))}</span></div>
  );

  return (
    <div className="ed-pagina ed-pagina-estreita">
      <Link to="/expositor" className="btn btn-secondary ed-voltar">← Área do expositor</Link>

      <header className="ed-cabecalho">
        <div className="ed-selos">
          <span className={`ed-selo ${sit.tipo === 'ok' ? 'is-status-VendasAbertas' : ''}`}>{sit.rotulo}</span>
        </div>
        <h1 className="ed-titulo-pagina">{s.geektopia?.nome_edicao}</h1>
        <p className="ed-subtitulo">{s.espaco?.tipo_espaco}</p>
      </header>

      <AvisoBox aviso={avisoDaTela(aviso.texto ? aviso : avisoInicial, carga.erro)} />

      {sit.etapa >= 0 ? (
        <ol className="pt-etapas" aria-label="Andamento da candidatura">
          {ETAPAS.map((nome, i) => (
            <li key={nome} className={`pt-etapa ${i < sit.etapa ? 'is-feita' : i === sit.etapa ? 'is-atual' : ''}`} aria-current={i === sit.etapa ? 'step' : undefined}>{nome}</li>
          ))}
        </ol>
      ) : null}

      <div className={`pt-destaque ${sit.tipo === 'ok' ? 'is-ok' : sit.tipo === 'erro' ? 'is-erro' : ''}`}>
        <strong>{sit.passo}</strong>

        {s.status_solicitacao === 'Aprovado' && s.pedido?.status_pedido !== 'Pago' && (
          <div className="ed-acoes ed-acoes-esquerda ed-acoes-quebra">
            <button type="button" className="btn btn-primary" disabled={trabalhando} onClick={pagar}>
              {s.pedido ? 'Continuar pagamento' : `Pagar taxa · ${formatarMoeda(s.valor_total_final)}`}
            </button>
            {s.pedido && <Link to={`/pedido/${s.pedido.id_pedido}/confirmacao`} className="btn btn-secondary">Já paguei — verificar</Link>}
          </div>
        )}
        {s.status_solicitacao === 'Aprovado' && s.pedido?.status_pedido === 'Pago' && (
          <div className="ed-acoes ed-acoes-esquerda">
            <Link to={`/pedido/${s.pedido.id_pedido}/confirmacao`} className="btn btn-secondary">Ver comprovante</Link>
          </div>
        )}
        {s.status_solicitacao === 'Reprovado' && (
          <div className="ed-acoes ed-acoes-esquerda"><Link to="/expositor/solicitar" className="btn btn-primary">Fazer nova solicitação</Link></div>
        )}
      </div>

      <section className="ed-painel" aria-labelledby="t-val" style={{ marginBottom: 20 }}>
        <h2 className="ed-titulo" id="t-val">Valores</h2>
        <div className="pt-valor-linha"><span>{s.espaco?.tipo_espaco} (base)</span><span>{formatarMoeda(s.espaco?.valor_base)}</span></div>
        {linha('ajudante(s) extra(s)', s.qtd_ajudantes_extras, s.valor_taxa_ajudante_momento)}
        {linha('mesa(s) extra(s)', s.qtd_mesas_extras, s.valor_taxa_mesa_extra_momento)}
        {linha('cadeira(s) extra(s)', s.qtd_cadeiras_extras, s.valor_taxa_cadeira_extra_momento)}
        <div className="pt-valor-linha pt-valor-total"><span>Total</span><span>{formatarMoeda(s.valor_total_final)}</span></div>
        <p className="ed-ajuda">Os valores ficam travados desde o envio: mudanças no catálogo não alteram o que você combinou.</p>

        {emAnalise && !editandoExtras && (
          <div className="ed-acoes ed-acoes-esquerda ed-acoes-quebra">
            <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => setEditandoExtras(true)}>Alterar quantidades</button>
            <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setCancelar(true)}>Cancelar solicitação</button>
          </div>
        )}

        {editandoExtras && (
          <form onSubmit={salvarExtras} className="ed-form-inline ed-form" style={{ marginTop: 16 }}>
            <p className="ed-ajuda" style={{ marginTop: 0 }}>Alterar recalcula o total com as taxas do catálogo de hoje.</p>
            <div className="ed-linha ed-linha-quebra">
              {[['ajudantes', 'Ajudantes extras'], ['mesas', 'Mesas extras'], ['cadeiras', 'Cadeiras extras']].map(([k, r]) => (
                <div className="ed-campo" key={k}>
                  <label htmlFor={`x-${k}`}>{r}</label>
                  <input id={`x-${k}`} type="number" min="0" max="99" step="1" inputMode="numeric" value={extras[k]} onChange={(e) => setExtras({ ...extras, [k]: Math.max(0, Math.min(99, Number(e.target.value) || 0)) })} />
                </div>
              ))}
            </div>
            <div className="ed-acoes ed-acoes-esquerda">
              <button type="submit" className="btn btn-primary ed-btn-sm" disabled={trabalhando}>Salvar</button>
              <button type="button" className="btn btn-secondary ed-btn-sm" onClick={() => setEditandoExtras(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </section>

      {limite > 0 && (
        <section className="ed-painel" aria-labelledby="t-aj">
          <h2 className="ed-titulo" id="t-aj">Ajudantes ({ajudantes.length} de {limite})</h2>
          <p className="ed-ajuda-topo">Quem vai ajudar no seu espaço. Cadastre nome e CPF de cada um{emAnalise ? '' : ' (o cadastro fecha depois da análise)'}.</p>

          {ajudantes.length > 0 && (
            <ul className="ed-lista" style={{ marginBottom: 16 }}>
              {ajudantes.map((a) => (
                <li className="ed-item" key={a.id_ajudante}>
                  <div className="ed-item-info">
                    <span className="ed-item-nome">{a.nome_completo}</span>
                    <span className="ed-item-detalhe">CPF {formatarCpf(a.cpf)}</span>
                  </div>
                  {emAnalise && <div className="ed-item-acoes"><button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setRemoverAj(a)}>Remover</button></div>}
                </li>
              ))}
            </ul>
          )}

          {podeAddAjudante && (
            <form onSubmit={adicionarAjudante} className="ed-form ed-form-inline" noValidate>
              <div className="ed-linha">
                <div className="ed-campo ed-campo-grande">
                  <label htmlFor="aj-nome">Nome completo *</label>
                  <input id="aj-nome" value={ajudante.nome} maxLength={150} onChange={(e) => { setAjudante({ ...ajudante, nome: e.target.value }); setErrosAj({ ...errosAj, nome: undefined }); }} aria-invalid={errosAj.nome ? true : undefined} />
                  {errosAj.nome && <p className="ed-erro-campo" role="alert">{errosAj.nome}</p>}
                </div>
                <div className="ed-campo">
                  <label htmlFor="aj-cpf">CPF *</label>
                  <input id="aj-cpf" inputMode="numeric" value={ajudante.cpf} placeholder="000.000.000-00" onChange={(e) => { setAjudante({ ...ajudante, cpf: formatarCpf(e.target.value) }); setErrosAj({ ...errosAj, cpf: undefined }); }} aria-invalid={errosAj.cpf ? true : undefined} />
                  {errosAj.cpf && <p className="ed-erro-campo" role="alert">{errosAj.cpf}</p>}
                </div>
              </div>
              <div className="ed-acoes ed-acoes-esquerda"><button type="submit" className="btn btn-primary ed-btn-sm" disabled={trabalhando}>+ Adicionar ajudante</button></div>
            </form>
          )}
        </section>
      )}

      <ConfirmModal
        isOpen={cancelar} title="Cancelar solicitação"
        message="Cancelar esta solicitação? Você poderá fazer outra depois. Se houver ajudantes cadastrados, remova-os antes."
        confirmLabel="Cancelar solicitação" cancelLabel="Voltar" variant="danger"
        onConfirm={cancelarSolicitacao} onCancel={() => setCancelar(false)}
      />
      <ConfirmModal
        isOpen={removerAj !== null} title="Remover ajudante" message={`Remover ${removerAj?.nome_completo}?`}
        confirmLabel="Remover" variant="danger" onConfirm={removerAjudante} onCancel={() => setRemoverAj(null)}
      />
    </div>
  );
}
