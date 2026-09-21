import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiAward, FiCalendar, FiCamera, FiCheckCircle, FiChevronRight, FiClock, FiCircle, FiCreditCard, FiEdit2,
  FiLock, FiMail, FiMapPin, FiPhone, FiShoppingBag, FiTag, FiUser, FiXCircle, FiCheck
} from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { Cronometro } from '../components/Cronometro';
import { mascaraCnpj, mascaraCpf, mascaraTelefone } from '../utils/mascaras';
import { formatarData, formatarMoeda } from '../utils/datas';
import { eventoPassou } from '../utils/evento';
import { requisitosSenha, senha as validarSenha } from '../utils/validacao';
import { BotaoPdf } from '../components/BotaoPdf';
import { usePagamentosPendentes } from '../hooks/usePagamentosPendentes';
import { situacaoDaInscricao, ROTULO_MODALIDADE } from '../utils/competicao';
import { situacaoDaSolicitacao } from '../utils/solicitacao';
import '../style/Perfil.css';

const SECOES = [
  { chave: 'dados', rotulo: 'Meus dados', Icone: FiUser },
  { chave: 'ingressos', rotulo: 'Meus ingressos', Icone: FiTag },
  { chave: 'participacoes', rotulo: 'Minhas participações', Icone: FiAward },
  { chave: 'seguranca', rotulo: 'Segurança', Icone: FiLock }
];

const STATUS_INGRESSO = {
  Valido: { rotulo: 'Válido', Icone: FiCheckCircle },
  Utilizado: { rotulo: 'Utilizado', Icone: FiClock },
  Cancelado: { rotulo: 'Cancelado', Icone: FiXCircle }
};

const iniciais = (nome = '') => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export function Perfil() {
  const buscar = useCallback(async () => {
    // Só o perfil é obrigatório; o resto enfeita a tela e não pode derrubá-la.
    const opcional = (req, padrao) => req.then((r) => r.data).catch(() => padrao);
    const [user, ingressos, parceiro, inscricoes, solicitacoes] = await Promise.all([
      api.get('/auth/me').then((r) => r.data),
      opcional(api.get('/ingressos/meus'), []),
      opcional(api.get('/parceiros/meu-perfil'), {}),
      opcional(api.get('/inscricoes/minhas'), []),
      opcional(api.get('/solicitacoes-espaco/minhas'), [])
    ]);
    return { user, ingressos, papeis: parceiro.papeis || {}, inscricoes, solicitacoes };
  }, []);
  const { dados, erro, carregando, recarregar } = useCarga(buscar);

  const [secao, setSecao] = useState('dados');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFoto = useRef(null);

  if (carregando) {
    return <div className="perfil-page"><p className="perfil-loading" aria-busy="true">Carregando o seu perfil...</p></div>;
  }
  if (erro || !dados) {
    return (
      <div className="perfil-page">
        <div className="perfil-loading" role="alert">
          <p>{erro || 'Não foi possível carregar o seu perfil.'}</p>
          <button type="button" className="btn btn-primary" onClick={recarregar}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  const { user, ingressos, papeis, inscricoes, solicitacoes } = dados;
  const apelido = user.perfil?.nickname;
  const avatar = user.perfil?.avatar_url;

  const enviarFoto = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setEnviandoFoto(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const form = new FormData();
      form.append('avatar', arquivo);
      await api.post('/auth/upload-avatar', form);
      setMensagem({ tipo: 'sucesso', texto: 'Foto atualizada.' });
      recarregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.response?.data?.error || 'Não foi possível enviar a foto. Use JPEG, PNG ou WEBP.' });
    } finally {
      setEnviandoFoto(false);
    }
  };

  const ingressosProximos = ingressos.filter((i) => !eventoPassou(i.geektopia) && i.status_ingresso === 'Valido');
  const ingressosAnteriores = ingressos.filter((i) => !ingressosProximos.includes(i));

  return (
    <div className="perfil-page">
      <div className="perfil-shell">
        <header className="perfil-capa">
          <div className="perfil-avatar-wrap">
            {avatar
              ? <img src={avatar} alt="" className="perfil-avatar" />
              : <span className="perfil-avatar perfil-avatar-inicial" aria-hidden="true">{iniciais(user.nome_completo)}</span>}
            <button type="button" className="perfil-avatar-botao" onClick={() => inputFoto.current?.click()} disabled={enviandoFoto} aria-label="Trocar foto de perfil">
              <FiCamera aria-hidden="true" />
            </button>
            <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={enviarFoto} hidden />
          </div>
          <div className="perfil-capa-texto">
            <h1 className="perfil-nome">{user.nome_completo}</h1>
            <p className="perfil-sub">{apelido ? `@${apelido}` : 'Defina um apelido em “Meus dados”'} · {user.email}</p>
            <div className="perfil-papeis">
              <span className="perfil-papel">Visitante</span>
              {papeis.competidor && <span className="perfil-papel is-competidor"><FiAward aria-hidden="true" /> Competidor</span>}
              {papeis.expositor && <span className="perfil-papel is-expositor"><FiShoppingBag aria-hidden="true" /> Expositor</span>}
            </div>
          </div>
        </header>

        {mensagem.texto && <div className={`perfil-feedback is-${mensagem.tipo}`} role="status">{mensagem.texto}</div>}

        <div className="perfil-corpo">
          <nav className="perfil-nav" aria-label="Seções do perfil">
            {SECOES.map(({ chave, rotulo, Icone }) => (
              <button key={chave} type="button" className={`perfil-nav-btn ${secao === chave ? 'is-active' : ''}`}
                aria-current={secao === chave ? 'page' : undefined} onClick={() => { setSecao(chave); setMensagem({ tipo: '', texto: '' }); }}>
                <Icone aria-hidden="true" /> <span>{rotulo}</span>
                {chave === 'ingressos' && ingressosProximos.length > 0 && <span className="perfil-nav-contagem" aria-label={`${ingressosProximos.length} próximos`}>{ingressosProximos.length}</span>}
              </button>
            ))}
          </nav>

          <main className="perfil-painel">
            {secao === 'dados' && <SecaoDados user={user} onSalvo={(texto) => { setMensagem({ tipo: 'sucesso', texto }); recarregar(); }} />}
            {secao === 'ingressos' && <ComprasPendentes aoConfirmar={recarregar} />}
            {secao === 'ingressos' && <SecaoIngressos proximos={ingressosProximos} anteriores={ingressosAnteriores} />}
            {secao === 'participacoes' && <SecaoParticipacoes ingressos={ingressos} inscricoes={inscricoes} solicitacoes={solicitacoes} />}
            {secao === 'seguranca' && <SecaoSeguranca onMensagem={setMensagem} />}
          </main>
        </div>

        <aside className="perfil-banner">
          <FiCalendar aria-hidden="true" />
          <Cronometro />
        </aside>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- DADOS
function Item({ Icone, rotulo, valor }) {
  return (
    <div className="perfil-dado">
      <span className="perfil-dado-icone"><Icone aria-hidden="true" /></span>
      <div className="perfil-dado-texto"><dt>{rotulo}</dt><dd>{valor || <span className="perfil-vazio-texto">Não informado</span>}</dd></div>
    </div>
  );
}

function SecaoDados({ user, onSalvo }) {
  const [editando, setEditando] = useState(false);

  const documentoRotulo = user.cpf ? 'CPF' : user.cnpj ? 'CNPJ' : user.passaporte ? 'Passaporte' : 'Documento';
  const documentoValor = user.cpf ? mascaraCpf(user.cpf) : user.cnpj ? mascaraCnpj(user.cnpj) : user.passaporte || '';

  if (editando) {
    return <FormEdicao user={user} onCancelar={() => setEditando(false)} onSalvo={(t) => { setEditando(false); onSalvo(t); }} />;
  }

  return (
    <section aria-labelledby="perfil-t-dados">
      <div className="perfil-secao-topo">
        <h2 id="perfil-t-dados">Meus dados</h2>
        <button type="button" className="btn btn-secondary" onClick={() => setEditando(true)}><FiEdit2 aria-hidden="true" /> Editar</button>
      </div>
      <h3 className="perfil-subtitulo">Identificação</h3>
      <dl className="perfil-dados">
        <Item Icone={FiUser} rotulo="Nome completo" valor={user.nome_completo} />
        <Item Icone={FiCreditCard} rotulo={documentoRotulo} valor={documentoValor} />
        <Item Icone={FiCalendar} rotulo="Data de nascimento" valor={user.data_nascimento ? formatarData(user.data_nascimento) : ''} />
      </dl>
      <h3 className="perfil-subtitulo">Contato e localização</h3>
      <dl className="perfil-dados">
        <Item Icone={FiMail} rotulo="E-mail" valor={user.email} />
        <Item Icone={FiPhone} rotulo="Telefone" valor={user.telefone ? mascaraTelefone(user.telefone) : ''} />
        <Item Icone={FiMapPin} rotulo="Localização" valor={user.cidade ? `${user.cidade}${user.estado ? ` - ${user.estado}` : ''}` : ''} />
      </dl>
    </section>
  );
}

function FormEdicao({ user, onCancelar, onSalvo }) {
  const [form, setForm] = useState({
    nome_completo: user.nome_completo || '', nickname: user.perfil?.nickname || '',
    telefone: user.telefone ? mascaraTelefone(user.telefone) : '', estado: user.estado || '', cidade: user.cidade || ''
  });
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Mesma fonte do cadastro, para UF/cidade serem iguais em todo o site.
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then((r) => r.json()).then(setEstados).catch(() => {});
  }, []);
  useEffect(() => {
    if (!form.estado) return undefined;
    let ativo = true;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios?orderBy=nome`)
      .then((r) => r.json()).then((d) => { if (ativo) setCidades(d); }).catch(() => {});
    return () => { ativo = false; };
  }, [form.estado]);

  const alterar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    if (form.nome_completo.trim().split(/\s+/).length < 2) { setErro('Informe nome e sobrenome.'); return; }
    setSalvando(true);
    try {
      const res = await api.put('/auth/profile', {
        nome_completo: form.nome_completo.trim(), nickname: form.nickname.trim(), telefone: form.telefone.replace(/\D/g, ''),
        estado: form.estado, cidade: form.cidade,
        ...(user.perfil?.avatar_url && { avatar_url: user.perfil.avatar_url })
      });
      onSalvo(res.data.message || 'Dados atualizados.');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível salvar. Tente de novo.');
      setSalvando(false);
    }
  };

  return (
    <section aria-labelledby="perfil-t-editar">
      <div className="perfil-secao-topo"><h2 id="perfil-t-editar">Editar dados</h2></div>
      {erro && <div className="perfil-feedback is-erro" role="alert">{erro}</div>}
      <form onSubmit={salvar} className="perfil-form" noValidate>
        <div className="perfil-field"><label htmlFor="pf-nome">Nome completo</label><input id="pf-nome" name="nome_completo" value={form.nome_completo} onChange={alterar} autoComplete="name" /></div>
        <div className="perfil-field"><label htmlFor="pf-nick">Apelido</label><input id="pf-nick" name="nickname" value={form.nickname} onChange={alterar} placeholder="Ex.: DevGamer" maxLength={30} /></div>
        <div className="perfil-field"><label htmlFor="pf-tel">Telefone</label><input id="pf-tel" name="telefone" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: mascaraTelefone(e.target.value) }))} inputMode="tel" autoComplete="tel" /></div>
        <div className="perfil-field">
          <label htmlFor="pf-uf">Estado</label>
          <select id="pf-uf" name="estado" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value, cidade: '' }))}>
            <option value="">Selecione...</option>
            {estados.map((uf) => <option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>)}
          </select>
        </div>
        <div className="perfil-field">
          <label htmlFor="pf-cidade">Cidade</label>
          <select id="pf-cidade" name="cidade" value={form.cidade} onChange={alterar} disabled={!form.estado}>
            <option value="">{form.estado ? 'Selecione...' : 'Escolha o estado primeiro'}</option>
            {(form.estado ? cidades : []).map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>
        <p className="perfil-ajuda perfil-form-full">E-mail, documento e data de nascimento não podem ser alterados aqui. Para corrigi-los, fale com a organização.</p>
        <div className="perfil-form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
        </div>
      </form>
    </section>
  );
}

// ------------------------------------------------------------------ INGRESSOS
function CartaoIngresso({ ing }) {
  const st = STATUS_INGRESSO[ing.status_ingresso] || { rotulo: ing.status_ingresso, Icone: FiCircle };
  const valido = ing.status_ingresso === 'Valido';
  return (
    <li className={`perfil-ingresso is-${ing.status_ingresso.toLowerCase()}`}>
      <div className="perfil-ingresso-info">
        <span className={`perfil-status is-${ing.status_ingresso.toLowerCase()}`}><st.Icone aria-hidden="true" /> {st.rotulo}</span>
        <h3>{ing.geektopia.nome_edicao}</h3>
        <p className="perfil-ingresso-lote">{ing.lote.nome_lote}</p>
        <p className="perfil-ingresso-meta"><FiUser aria-hidden="true" /> {ing.nome_titular}{ing.documento_titular ? ` · ${ing.documento_titular}` : ''}</p>
        {ing.geektopia.data_inicio && <p className="perfil-ingresso-meta"><FiCalendar aria-hidden="true" /> {formatarData(ing.geektopia.data_inicio)}</p>}
        <p className="perfil-ingresso-meta"><FiMapPin aria-hidden="true" /> {ing.geektopia.local || 'Local a definir'}</p>
        <div className="perfil-ingresso-acoes">
          <BotaoPdf url={`/ingressos/${ing.id_ingresso}/pdf`} nome={`ingresso-${ing.id_ingresso}.pdf`}>Baixar PDF</BotaoPdf>
        </div>
      </div>
      <div className="perfil-ingresso-qr">
        <div className={`perfil-qr ${valido ? '' : 'is-inativo'}`}>
          <QRCodeSVG value={ing.codigo_qr} size={128} level="M" marginSize={2} title={`QR code do ingresso ${ing.id_ingresso}`} />
        </div>
        <span className="perfil-ingresso-codigo">{ing.codigo_qr}</span>
      </div>
    </li>
  );
}

// Ingressos da mesma compra ficam juntos (e podem ser baixados de uma vez).
function ListaIngressos({ ingressos }) {
  const grupos = [];
  ingressos.forEach((i) => {
    const chave = i.id_pedido ?? `solto-${i.id_ingresso}`;
    let g = grupos.find((x) => x.chave === chave);
    if (!g) { g = { chave, id_pedido: i.id_pedido, itens: [] }; grupos.push(g); }
    g.itens.push(i);
  });
  return (
    <div className="perfil-grupos">
      {grupos.map((g) => (
        <section key={g.chave} className="perfil-grupo">
          {g.id_pedido && g.itens.length > 1 && (
            <header className="perfil-grupo-topo">
              <strong>Compra #{g.id_pedido} · {g.itens.length} ingressos</strong>
              <BotaoPdf url={`/ingressos/pedido/${g.id_pedido}/pdf`} nome={`ingressos-compra-${g.id_pedido}.pdf`}>Baixar todos (PDF)</BotaoPdf>
            </header>
          )}
          <ul className="perfil-ingressos">{g.itens.map((i) => <CartaoIngresso key={i.id_ingresso} ing={i} />)}</ul>
        </section>
      ))}
    </div>
  );
}

function SecaoIngressos({ proximos, anteriores }) {
  if (proximos.length === 0 && anteriores.length === 0) {
    return (
      <section className="perfil-vazio" aria-labelledby="perfil-t-ing">
        <FiTag aria-hidden="true" />
        <h2 id="perfil-t-ing">Você ainda não tem ingressos</h2>
        <p>Quando comprar, eles aparecem aqui com o QR code para a entrada e podem ser baixados em PDF.</p>
        <Link to="/geektopia" className="btn btn-primary">Ver eventos</Link>
      </section>
    );
  }
  return (
    <section aria-labelledby="perfil-t-ing">
      <div className="perfil-secao-topo"><h2 id="perfil-t-ing">Meus ingressos</h2></div>
      <p className="perfil-ajuda perfil-ajuda-ing">Guarde o PDF no celular: na entrada, basta mostrar o QR code e um documento com foto.</p>
      {proximos.length > 0 && (<><h3 className="perfil-subtitulo">Próximos eventos</h3><ListaIngressos ingressos={proximos} /></>)}
      {anteriores.length > 0 && (<><h3 className="perfil-subtitulo">Anteriores e cancelados</h3><ListaIngressos ingressos={anteriores} /></>)}
    </section>
  );
}

// Compras de ingresso que o Mercado Pago ainda não confirmou para o site (ex.: a pessoa pagou
// e fechou a aba antes de voltar). A tela confere sozinha e libera os ingressos.
function ComprasPendentes({ aoConfirmar }) {
  const [pedidos, setPedidos] = useState([]);
  const carregar = useCallback(() => {
    api.get('/pedidos/meus')
      .then((r) => setPedidos(r.data.filter((p) => p.status_pedido === 'Pendente' && p.itens.length > 0 && Date.now() - new Date(p.data_pedido).getTime() < 48 * 3600 * 1000)))
      .catch(() => {});
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const { verificando, mensagem, verificar } = usePagamentosPendentes(pedidos.map((p) => p.id_pedido), () => { carregar(); aoConfirmar(); });
  if (pedidos.length === 0) return null;
  return (
    <section className="perfil-ajuda perfil-ajuda-ing" role="status" aria-label="Compras aguardando confirmação">
      <strong>Compra aguardando confirmação do pagamento ({pedidos.map((p) => `#${p.id_pedido}`).join(', ')})</strong>
      <p>Se você já pagou, o ingresso aparece aqui assim que o Mercado Pago confirmar. Estamos conferindo.</p>
      {mensagem && <p>{mensagem}</p>}
      <button type="button" className="btn btn-secondary" onClick={verificar} disabled={verificando}>{verificando ? 'Conferindo...' : 'Verificar agora'}</button>
    </section>
  );
}

// --------------------------------------------------------------- PARTICIPAÇÕES
// Cada jeito de participar tem a sua aba, para não misturar visitante, competidor e expositor.
function SecaoParticipacoes({ ingressos, inscricoes, solicitacoes }) {
  // Edições em que a pessoa esteve como visitante (tem ingresso), do mais recente ao mais antigo.
  // Evento gratuito também entra aqui, desde que a pessoa tenha o ingresso dele.
  const porEdicao = new Map();
  ingressos.filter((i) => i.status_ingresso !== 'Cancelado').forEach((i) => {
    const atual = porEdicao.get(i.id_geektopia) || { edicao: i.geektopia, qtd: 0, compareceu: false };
    atual.qtd += 1;
    atual.compareceu = atual.compareceu || i.status_ingresso === 'Utilizado';
    porEdicao.set(i.id_geektopia, atual);
  });
  const visitas = [...porEdicao.values()].sort((a, b) => new Date(b.edicao.data_inicio || 0) - new Date(a.edicao.data_inicio || 0));

  const ABAS = [
    { chave: 'visitante', rotulo: 'Visitante', Icone: FiTag, qtd: visitas.length },
    { chave: 'competidor', rotulo: 'Competidor', Icone: FiAward, qtd: inscricoes.length },
    { chave: 'expositor', rotulo: 'Expositor', Icone: FiShoppingBag, qtd: solicitacoes.length }
  ];
  const [aba, setAba] = useState('visitante');

  return (
    <section aria-labelledby="perfil-t-part">
      <div className="perfil-secao-topo"><h2 id="perfil-t-part">Minhas participações</h2></div>

      <div className="perfil-subabas" role="tablist" aria-label="Como você participa">
        {ABAS.map(({ chave, rotulo, Icone, qtd }) => (
          <button key={chave} type="button" role="tab" id={`sub-${chave}`} aria-selected={aba === chave} aria-controls="perfil-subpainel"
            className={`perfil-subaba ${aba === chave ? 'is-ativa' : ''}`} onClick={() => setAba(chave)}>
            <Icone aria-hidden="true" /> {rotulo}
            {qtd > 0 && <span className="perfil-subaba-qtd">{qtd}</span>}
          </button>
        ))}
      </div>

      <div id="perfil-subpainel" role="tabpanel" aria-labelledby={`sub-${aba}`} className="perfil-subpainel">
        {aba === 'visitante' && (
          visitas.length === 0
            ? <VazioSub texto="Os eventos em que você tiver ingresso aparecem aqui, inclusive os já realizados." acao={<Link to="/geektopia" className="btn btn-primary">Ver eventos</Link>} />
            : (
              <ul className="perfil-lista">
                {visitas.map(({ edicao, qtd, compareceu }) => {
                  const passou = eventoPassou(edicao);
                  return (
                    <li key={edicao.id_geektopia} className="perfil-lista-item">
                      <div>
                        <strong>{edicao.nome_edicao}</strong>
                        <span>{edicao.data_inicio ? formatarData(edicao.data_inicio) : 'Data a definir'} · {qtd} ingresso{qtd > 1 ? 's' : ''}</span>
                      </div>
                      <span className={`perfil-chip ${compareceu ? 'is-ok' : passou ? '' : 'is-aviso'}`}>{compareceu ? 'Compareceu' : passou ? 'Realizado' : 'Vai acontecer'}</span>
                    </li>
                  );
                })}
              </ul>
            )
        )}

        {aba === 'competidor' && (
          inscricoes.length === 0
            ? <VazioSub texto="Suas inscrições em concursos e torneios aparecem aqui, com o andamento da análise." acao={<Link to="/geektopia#competicoes" className="btn btn-primary">Ver competições</Link>} />
            : (
              <>
                <ul className="perfil-lista">
                  {inscricoes.map((i) => {
                    const sit = situacaoDaInscricao(i);
                    return (
                      <li key={i.id_inscricao} className="perfil-lista-item">
                        <div>
                          <strong>{i.competicao?.nome_competicao}</strong>
                          <span>{i.competicao?.geektopia?.nome_edicao} · {ROTULO_MODALIDADE[i.competicao?.modalidade] || ''}</span>
                        </div>
                        <span className={`perfil-chip is-${sit.tipo}`}>{sit.rotulo}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link to="/competidor" className="perfil-link">Abrir área do competidor <FiChevronRight aria-hidden="true" /></Link>
              </>
            )
        )}

        {aba === 'expositor' && (
          solicitacoes.length === 0
            ? <VazioSub texto="Seus pedidos de espaço para expor nas edições aparecem aqui, da análise ao pagamento." acao={<Link to="/expositor" className="btn btn-primary">Quero expor</Link>} />
            : (
              <>
                <ul className="perfil-lista">
                  {solicitacoes.map((s) => {
                    const sit = situacaoDaSolicitacao(s);
                    return (
                      <li key={s.id_solicitacao} className="perfil-lista-item">
                        <div>
                          <strong>{s.geektopia?.nome_edicao}</strong>
                          <span>{s.espaco?.tipo_espaco} · {formatarMoeda(s.valor_total_final)}</span>
                        </div>
                        <span className={`perfil-chip is-${sit.tipo}`}>{sit.rotulo}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link to="/expositor" className="perfil-link">Abrir área do expositor <FiChevronRight aria-hidden="true" /></Link>
              </>
            )
        )}
      </div>
    </section>
  );
}

function VazioSub({ texto, acao }) {
  return (
    <div className="perfil-vazio perfil-vazio-sub">
      <p>{texto}</p>
      {acao}
    </div>
  );
}

// ------------------------------------------------------------------ SEGURANÇA
const REQUISITOS = [
  ['tamanho', 'Mínimo de 8 caracteres'], ['maiuscula', 'Uma letra maiúscula'], ['minuscula', 'Uma letra minúscula'],
  ['numero', 'Um número'], ['especial', 'Um caractere especial']
];

function SecaoSeguranca({ onMensagem }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const req = requisitosSenha(nova);

  const trocar = async (e) => {
    e.preventDefault();
    setErro('');
    const problema = validarSenha(nova);
    if (problema) { setErro(problema); return; }
    setSalvando(true);
    try {
      const res = await api.patch('/auth/change-password', { senha_atual: atual, nova_senha: nova });
      onMensagem({ tipo: 'sucesso', texto: res.data.message || 'Senha alterada com sucesso.' });
      setAtual(''); setNova('');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível alterar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section aria-labelledby="perfil-t-seg">
      <div className="perfil-secao-topo"><h2 id="perfil-t-seg">Segurança</h2></div>
      <form onSubmit={trocar} className="perfil-seguranca" noValidate>
        <h3 className="perfil-subtitulo">Alterar senha</h3>
        {erro && <div className="perfil-feedback is-erro" role="alert">{erro}</div>}
        <div className="perfil-field"><label htmlFor="pf-atual">Senha atual</label><input id="pf-atual" type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" required /></div>
        <div className="perfil-field"><label htmlFor="pf-nova">Nova senha</label><input id="pf-nova" type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" required /></div>
        <ul className="perfil-requisitos" aria-label="Requisitos da nova senha">
          {REQUISITOS.map(([k, t]) => (
            <li key={k} className={req[k] ? 'is-ok' : ''}>{req[k] ? <FiCheck aria-hidden="true" /> : <FiCircle aria-hidden="true" />} {t}<span className="ed-sr-only">{req[k] ? ' (atendido)' : ' (pendente)'}</span></li>
          ))}
        </ul>
        <button type="submit" className="btn btn-primary" disabled={salvando || !atual || !nova}>{salvando ? 'Salvando...' : 'Atualizar senha'}</button>
      </form>
    </section>
  );
}
