import { useCallback, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiCheck, FiInfo, FiLock, FiUser } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { ROTULO_CATEGORIA, moeda } from '../utils/evento';
import { mascaraCpf } from '../utils/mascaras';
import { MAX_INGRESSOS_POR_COMPRA, documentoCanonico, idadeExigida, limiteDoLote, validarTitular } from '../utils/titular';
import '../style/Publico.css';
import '../style/Checkout.css';

const hoje = () => new Date().toISOString().slice(0, 10);
const VAZIO = { nome: '', tipoDoc: 'cpf', doc: '', nasc: '' };
// "Meia-entrada" já diz a categoria: não repetir no chip.
const nomeJaTemCategoria = (lote) => String(lote.nome_lote || '').toLowerCase().includes(String(ROTULO_CATEGORIA[lote.categoria || 'Inteira']).toLowerCase().split('-')[0]);
const mascarar = (tipo, doc) => (tipo === 'cpf' ? mascaraCpf(doc) : doc);

// Compra de ingressos em etapas, como nos grandes sites de venda: 1) dados de quem vai usar
// cada ingresso, 2) revisão e pagamento. Cada ingresso sai em nome de um titular, com documento
// e data de nascimento, para a portaria conferir.
export function Checkout() {
  const { id } = useParams();
  const buscar = useCallback(async () => {
    const [evento, lotes] = await Promise.all([api.get(`/geektopia/${id}`), api.get(`/geektopia/${id}/lotes`)]);
    return { evento: evento.data, lotes: lotes.data };
  }, [id]);
  const { dados, erro, carregando } = useCarga(buscar);

  if (carregando) return <main className="ck-pagina"><p className="ck-carregando" aria-busy="true">Carregando...</p></main>;
  if (erro || !dados) {
    return (
      <main className="ck-pagina"><div className="ck-carregando" role="alert">
        <p>{erro || 'Não foi possível carregar o evento.'}</p><Link to={`/geektopia/${id}`} className="btn btn-secondary">Voltar ao evento</Link>
      </div></main>
    );
  }
  return <Formulario key={id} idEvento={id} evento={dados.evento} lotes={dados.lotes} />;
}

function Formulario({ idEvento, evento, lotes }) {
  const chaveCarrinho = `@Geektopia:carrinho:${idEvento}`;
  const chaveRascunho = `@Geektopia:titulares:${idEvento}`;

  // Ingressos escolhidos na página do evento (já limitados ao estoque de agora).
  let salvo = {};
  try { salvo = JSON.parse(sessionStorage.getItem(chaveCarrinho) || '{}') || {}; } catch { /* ignora */ }
  const itens = lotes
    .filter((l) => !l.esgotado)
    .map((l) => ({ lote: l, qtd: Math.min(Number(salvo[l.id_lote]) || 0, l.restantes ?? 99) }))
    .filter((i) => i.qtd > 0);

  // Uma linha por ingresso: "Inteira #1", "Inteira #2", "Meia #1"...
  const ingressos = itens.flatMap(({ lote, qtd }) => Array.from({ length: qtd }, (_, n) => ({ chave: `${lote.id_lote}-${n + 1}`, lote, n: n + 1 })));

  const [titulares, setTitulares] = useState(() => {
    let rascunho = {};
    try { rascunho = JSON.parse(sessionStorage.getItem(chaveRascunho) || '{}') || {}; } catch { /* ignora */ }
    return Object.fromEntries(ingressos.map((i) => [i.chave, { ...VAZIO, ...(rascunho[i.chave] || {}) }]));
  });
  const [erros, setErros] = useState({});
  const [etapa, setEtapa] = useState('dados'); // 'dados' | 'revisao'
  const [aceite, setAceite] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [usouMeusDados, setUsouMeusDados] = useState(false);

  if (ingressos.length === 0) return <Navigate to={`/geektopia/${idEvento}`} replace />;

  const total = itens.reduce((s, i) => s + i.qtd * Number(i.lote.valor_ingresso || 0), 0);
  const totalIngressos = ingressos.length;

  const guardar = (novo) => {
    setTitulares(novo);
    try { sessionStorage.setItem(chaveRascunho, JSON.stringify(novo)); } catch { /* ignora */ }
  };
  const alterar = (chave, campo, valor) => {
    guardar({ ...titulares, [chave]: { ...titulares[chave], [campo]: valor } });
    setErros((e) => ({ ...e, [chave]: { ...e[chave], [campo === 'nasc' ? 'nascimento' : campo === 'doc' ? 'documento' : campo]: undefined } }));
  };

  const usarMeusDados = async (chave) => {
    try {
      const { data: eu } = await api.get('/auth/me');
      const cpf = eu.cpf;
      guardar({
        ...titulares,
        [chave]: {
          nome: eu.nome_completo || '', tipoDoc: cpf ? 'cpf' : 'passaporte',
          doc: cpf ? mascaraCpf(cpf) : (eu.passaporte || ''), nasc: eu.data_nascimento ? String(eu.data_nascimento).slice(0, 10) : ''
        }
      });
      setUsouMeusDados(true);
    } catch {
      setMensagem('Não foi possível carregar os seus dados. Preencha manualmente.');
    }
  };

  // Valida todos os ingressos (formato, idade e limite por pessoa dentro desta compra).
  const validarTudo = () => {
    const novos = {};
    const porLote = {};
    ingressos.forEach((ing) => {
      const t = titulares[ing.chave];
      const e = validarTitular(t, { minIdade: idadeExigida(ing.lote, evento) });
      const limite = limiteDoLote(ing.lote);
      if (limite && !e.documento && t.doc) {
        const canon = documentoCanonico(t.tipoDoc, t.doc);
        porLote[ing.lote.id_lote] = porLote[ing.lote.id_lote] || {};
        porLote[ing.lote.id_lote][canon] = (porLote[ing.lote.id_lote][canon] || 0) + 1;
        if (porLote[ing.lote.id_lote][canon] > limite) {
          e.documento = `Limite de ${limite} ingresso${limite > 1 ? 's' : ''} "${ing.lote.nome_lote}" por pessoa. Use o documento de outra pessoa.`;
        }
      }
      if (Object.keys(e).length) novos[ing.chave] = e;
    });
    setErros(novos);
    return novos;
  };

  const continuar = (ev) => {
    ev.preventDefault();
    setMensagem('');
    const novos = validarTudo();
    const primeira = Object.keys(novos)[0];
    if (primeira) {
      setMensagem('Confira os campos destacados.');
      document.getElementById(`ck-${primeira}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setEtapa('revisao');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pagar = async () => {
    setMensagem('');
    setEnviando(true);
    try {
      const corpoItens = itens.map(({ lote, qtd }) => ({
        id_lote: lote.id_lote,
        quantidade: qtd,
        titulares: ingressos.filter((i) => i.lote.id_lote === lote.id_lote).map((i) => {
          const t = titulares[i.chave];
          return { nome_completo: t.nome.trim(), tipo_documento: t.tipoDoc, documento: documentoCanonico(t.tipoDoc, t.doc), data_nascimento: t.nasc };
        })
      }));
      const res = await api.post('/pedidos', { itens: corpoItens }, { timeout: 30000 });
      try { sessionStorage.removeItem(chaveCarrinho); sessionStorage.removeItem(chaveRascunho); } catch { /* ignora */ }
      window.location.assign(res.data.init_point); // Mercado Pago
    } catch (err) {
      const r = err.response;
      setMensagem(
        r?.status === 401 ? 'Sua sessão expirou. Entre novamente para comprar.'
          : err.code === 'ECONNABORTED' ? 'O Mercado Pago demorou para responder. Nenhuma cobrança foi feita; tente novamente.'
            : r?.data?.error || 'Não foi possível iniciar a compra. Tente de novo.'
      );
      if (r?.data?.campo === 'titulares') setEtapa('dados');
      setEnviando(false);
    }
  };

  const regrasParaAceite = Boolean(evento.regras_idade_minima || evento.aviso_documentacao || evento.objetos_proibidos);
  const temMeia = itens.some((i) => i.lote.categoria === 'Meia');

  return (
    <main className="ck-pagina">
      <div className="ck-container">
        <Link to={`/geektopia/${idEvento}`} className="ck-voltar"><FiArrowLeft aria-hidden="true" /> Voltar ao evento</Link>
        <h1 className="ck-titulo">Finalizar compra</h1>
        <p className="ck-evento">{evento.nome_edicao}</p>

        <ol className="ck-etapas" aria-label="Etapas da compra">
          <li className={etapa === 'dados' ? 'is-atual' : 'is-feita'}><span>{etapa === 'dados' ? '1' : <FiCheck aria-hidden="true" />}</span> Participantes</li>
          <li className={etapa === 'revisao' ? 'is-atual' : ''}><span>2</span> Revisão e pagamento</li>
          <li><span>3</span> Ingressos no seu perfil</li>
        </ol>

        {mensagem && <div className="ck-aviso is-erro" role="alert"><FiAlertCircle aria-hidden="true" /> {mensagem}</div>}

        <div className="ck-grade">
          <div>
            {etapa === 'dados' ? (
              <form onSubmit={continuar} noValidate>
                <p className="ck-intro">Cada ingresso sai <strong>em nome de quem vai usá-lo</strong>. Na entrada, a organização confere o documento com o nome do ingresso.</p>

                {ingressos.map((ing, idx) => {
                  const t = titulares[ing.chave];
                  const e = erros[ing.chave] || {};
                  const minIdade = idadeExigida(ing.lote, evento);
                  const limite = limiteDoLote(ing.lote);
                  return (
                    <section className="ck-cartao" key={ing.chave} id={`ck-${ing.chave}`} aria-labelledby={`ck-t-${ing.chave}`}>
                      <header className="ck-cartao-topo">
                        <h2 id={`ck-t-${ing.chave}`}><FiUser aria-hidden="true" /> Ingresso {idx + 1} de {totalIngressos}</h2>
                        <span className="ck-chip">{ing.lote.nome_lote}{nomeJaTemCategoria(ing.lote) ? '' : ` · ${ROTULO_CATEGORIA[ing.lote.categoria || 'Inteira']}`} · {moeda(ing.lote.valor_ingresso)}</span>
                      </header>
                      {(minIdade || limite) && (
                        <p className="ck-nota"><FiInfo aria-hidden="true" /> {[minIdade && `Exige ${minIdade}+ anos.`, limite && `Limite de ${limite} por pessoa.`].filter(Boolean).join(' ')}</p>
                      )}

                      <div className="ck-campos">
                        <div className="ck-campo ck-campo-largo">
                          <label htmlFor={`n-${ing.chave}`}>Nome completo *</label>
                          <input id={`n-${ing.chave}`} value={t.nome} onChange={(ev) => alterar(ing.chave, 'nome', ev.target.value)} autoComplete="off" maxLength={150} aria-invalid={e.nome ? true : undefined} />
                          {e.nome && <p className="ck-erro" role="alert">{e.nome}</p>}
                        </div>

                        <div className="ck-campo">
                          <label htmlFor={`d-${ing.chave}`}>Documento *</label>
                          <div className="ck-doc">
                            <select aria-label="Tipo de documento" value={t.tipoDoc} onChange={(ev) => guardar({ ...titulares, [ing.chave]: { ...t, tipoDoc: ev.target.value, doc: '' } })}>
                              <option value="cpf">CPF</option>
                              <option value="passaporte">Passaporte</option>
                            </select>
                            <input id={`d-${ing.chave}`} value={t.doc} inputMode={t.tipoDoc === 'cpf' ? 'numeric' : 'text'} autoComplete="off"
                              placeholder={t.tipoDoc === 'cpf' ? '000.000.000-00' : 'Número do passaporte'}
                              onChange={(ev) => alterar(ing.chave, 'doc', t.tipoDoc === 'cpf' ? mascaraCpf(ev.target.value) : ev.target.value.toUpperCase())}
                              aria-invalid={e.documento ? true : undefined} />
                          </div>
                          {e.documento && <p className="ck-erro" role="alert">{e.documento}</p>}
                        </div>

                        <div className="ck-campo">
                          <label htmlFor={`b-${ing.chave}`}>Data de nascimento *</label>
                          <input id={`b-${ing.chave}`} type="date" max={hoje()} value={t.nasc} onChange={(ev) => alterar(ing.chave, 'nasc', ev.target.value)} aria-invalid={e.nascimento ? true : undefined} />
                          {e.nascimento && <p className="ck-erro" role="alert">{e.nascimento}</p>}
                        </div>
                      </div>

                      {!usouMeusDados && (
                        <button type="button" className="ck-link" onClick={() => usarMeusDados(ing.chave)}>Usar os meus dados neste ingresso</button>
                      )}
                    </section>
                  );
                })}

                <div className="ck-acoes">
                  <button type="submit" className="btn btn-primary ck-btn">Continuar</button>
                </div>
              </form>
            ) : (
              <div>
                <section className="ck-cartao" aria-labelledby="ck-rev-t">
                  <h2 id="ck-rev-t" className="ck-titulo-cartao">Confira os participantes</h2>
                  <ul className="ck-revisao">
                    {ingressos.map((ing, idx) => {
                      const t = titulares[ing.chave];
                      return (
                        <li key={ing.chave}>
                          <span className="ck-num">{idx + 1}</span>
                          <div>
                            <strong>{t.nome.trim()}</strong>
                            <small>{t.tipoDoc === 'cpf' ? 'CPF' : 'Passaporte'} {mascarar(t.tipoDoc, t.doc)} · nasc. {t.nasc.split('-').reverse().join('/')}</small>
                            <small>{ing.lote.nome_lote} · {moeda(ing.lote.valor_ingresso)}</small>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" className="ck-link" onClick={() => setEtapa('dados')}>Corrigir dados</button>
                </section>

                {(regrasParaAceite || temMeia) && (
                  <section className="ck-cartao ck-regras" aria-labelledby="ck-reg-t">
                    <h2 id="ck-reg-t" className="ck-titulo-cartao">Antes de pagar</h2>
                    <ul>
                      <li>Leve um documento oficial com foto: ele será conferido com o nome do ingresso.</li>
                      {temMeia && <li>Meia-entrada: leve a comprovação do direito (carteirinha ou documento válido). Sem ela, é cobrada a diferença na entrada.</li>}
                      {evento.regras_idade_minima && <li>{evento.regras_idade_minima}</li>}
                      {evento.aviso_documentacao && <li>{evento.aviso_documentacao}</li>}
                    </ul>
                    <label className="ck-aceite">
                      <input type="checkbox" checked={aceite} onChange={(ev) => setAceite(ev.target.checked)} />
                      Li e concordo com as regras de entrada do evento.
                    </label>
                  </section>
                )}

                <div className="ck-acoes">
                  <button type="button" className="btn btn-secondary ck-btn" onClick={() => setEtapa('dados')}>Voltar</button>
                  <button type="button" className="btn btn-primary ck-btn" disabled={enviando || (regrasParaAceite && !aceite)} onClick={pagar}>
                    {enviando ? 'Abrindo o pagamento...' : <><FiLock aria-hidden="true" /> Ir para o pagamento · {moeda(total)}</>}
                  </button>
                </div>
                <p className="ck-seguro">Pagamento seguro pelo Mercado Pago. Depois de pagar, os ingressos aparecem no seu perfil e você pode baixá-los em PDF.</p>
              </div>
            )}
          </div>

          <aside className="ck-resumo" aria-label="Resumo do pedido">
            <h2>Resumo do pedido</h2>
            <p className="ck-resumo-evento">{evento.nome_edicao}</p>
            <ul>
              {itens.map(({ lote, qtd }) => (
                <li key={lote.id_lote}><span>{qtd} × {lote.nome_lote}</span><strong>{moeda(qtd * Number(lote.valor_ingresso || 0))}</strong></li>
              ))}
            </ul>
            <div className="ck-total"><span>Total</span><strong>{moeda(total)}</strong></div>
            <p className="ck-limite">Máximo de {MAX_INGRESSOS_POR_COMPRA} ingressos por compra.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
