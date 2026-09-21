import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FiAlertCircle, FiAward, FiCalendar, FiClock, FiFileText, FiInfo, FiMapPin, FiShield, FiShoppingBag, FiShoppingCart, FiSlash, FiTag, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import { useCarga } from '../hooks/useCarga';
import { Carrossel } from '../components/publico/Carrossel';
import { Contagem } from '../components/publico/Contagem';
import { NavInterna } from '../components/publico/NavInterna';
import { AvisoMenores, URL_TERMO_MENORES } from '../components/publico/AvisoMenores';
import { CartaoCompeticao } from '../components/publico/CartaoCompeticao';
import { SeletorIngressos } from '../components/publico/SeletorIngressos';
import { descricaoClassificacao, seloClassificacao } from '../utils/idade';
import { chaveDoDia, eventoPassou, horaCurta, horarioEvento, linkMapa, moeda, periodoEvento, tituloDoDia } from '../utils/evento';
import { cssDoFundo } from '../utils/fundo';
import { COR_PADRAO, ehHexValido } from '../utils/cores';
import '../style/Publico.css';
import '../style/GeektopiaDetalhe.css';

const iniciais = (nome = '') => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function Secao({ id, titulo, texto, alt, children }) {
  return (
    <section className={`pb-secao dt-secao ${alt ? 'is-alt' : ''}`} id={id} aria-labelledby={`${id}-t`}>
      <header className="pb-cabecalho">
        <h2 className="pb-titulo" id={`${id}-t`}>{titulo}</h2>
        {texto && <p className="pb-lead">{texto}</p>}
      </header>
      {children}
    </section>
  );
}

export function GeektopiaDetalhe() {
  const { id } = useParams();

  const buscar = useCallback(async () => {
    // Só o evento e os lotes são essenciais; o resto é conteúdo opcional e uma
    // falha nele não pode derrubar a página inteira.
    const opcional = (rota) => api.get(`/geektopia/${id}/${rota}`).then((r) => r.data).catch(() => []);
    const [evento, lotes, programacao, competicoes, convidados, expositores] = await Promise.all([
      api.get(`/geektopia/${id}`).then((r) => r.data),
      api.get(`/geektopia/${id}/lotes`).then((r) => r.data),
      opcional('programacao'), opcional('competicoes'), opcional('convidados'), opcional('expositores-confirmados')
    ]);
    return { evento, lotes, programacao, competicoes, convidados, expositores };
  }, [id]);
  const { dados, erro, carregando, recarregar } = useCarga(buscar);

  // Links como /geektopia/5#programacao: os dados chegam depois da página, então o
  // navegador sozinho não acha a seção; rolamos até ela quando o conteúdo aparece.
  const { hash } = useLocation();
  const pronto = Boolean(dados);
  useEffect(() => {
    if (pronto && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pronto, hash]);

  // A seleção fica guardada na sessão do navegador: quem vai entrar na conta (e
  // volta) encontra os mesmos ingressos escolhidos.
  const chaveCarrinho = `@Geektopia:carrinho:${id}`;
  const [quantidades, setQuantidades] = useState(() => {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(chaveCarrinho) || '{}');
      return salvo && typeof salvo === 'object' ? salvo : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(chaveCarrinho, JSON.stringify(quantidades)); } catch { /* sem armazenamento: a seleção só não sobrevive à navegação */ }
  }, [chaveCarrinho, quantidades]);
  const [mensagem, setMensagem] = useState('');
  const [comprando, setComprando] = useState(false);
  const logado = Boolean(localStorage.getItem('@Geektopia:token'));

  const lotes = useMemo(() => dados?.lotes ?? [], [dados]);
  // Só entra no pedido o que ainda existe e cabe no estoque de agora (a seleção
  // guardada pode ser antiga: lote apagado, ingressos que esgotaram no meio-tempo).
  const itens = useMemo(
    () => lotes
      .filter((l) => !l.esgotado)
      .map((l) => ({ lote: l, qtd: Math.min(Number(quantidades[l.id_lote]) || 0, l.restantes ?? 99) }))
      .filter((i) => i.qtd > 0),
    [lotes, quantidades]
  );
  const totalIngressos = itens.reduce((s, i) => s + i.qtd, 0);
  const totalValor = itens.reduce((s, i) => s + i.qtd * (i.lote.valor_ingresso || 0), 0);

  // Incremento sobre o valor mais recente (cliques rápidos não se perdem), limitado ao estoque do lote.
  const alterarQuantidade = (idLote, delta) => {
    const lote = lotes.find((l) => l.id_lote === idLote);
    const max = lote?.restantes ?? 99;
    setQuantidades((q) => ({ ...q, [idLote]: Math.min(max, Math.max(0, (q[idLote] || 0) + delta)) }));
  };

  const finalizarCompra = async () => {
    setMensagem('');
    if (itens.length === 0) return;

    // Antes de abrir qualquer aba de pagamento: quem não entrou não tem como comprar.
    if (!logado) {
      setMensagem('Entre na sua conta para finalizar a compra. Seus ingressos escolhidos ficam salvos neste navegador.');
      return;
    }

    setComprando(true);

    // Vai para o Mercado Pago NA MESMA ABA. Antes abríamos uma segunda aba antes da
    // resposta do servidor; se o pop-up fosse bloqueado ou a resposta demorasse, a
    // pessoa via uma aba em branco e achava que nada tinha acontecido. Ao pagar, o
    // botão "Voltar ao site" do Mercado Pago traz de volta para a tela de confirmação.
    try {
      const res = await api.post(
        '/pedidos',
        { itens: itens.map((i) => ({ id_lote: i.lote.id_lote, quantidade: i.qtd })) },
        { timeout: 30000 }
      );
      try { sessionStorage.removeItem(chaveCarrinho); } catch { /* ignora */ }
      window.location.href = res.data.init_point;
    } catch (err) {
      setMensagem(
        err.response?.status === 401
          ? 'Sua sessão expirou. Entre novamente para comprar.'
          : err.code === 'ECONNABORTED'
            ? 'O Mercado Pago demorou para responder. Nenhuma cobrança foi feita; tente novamente.'
            : err.response?.data?.error || 'Não foi possível iniciar a compra. Tente de novo.'
      );
      setComprando(false);
    }
  };

  if (carregando) {
    return <main className="pb-pagina dt-pagina" aria-busy="true"><div className="dt-esqueleto" aria-hidden="true" /><p className="pb-carregando">Carregando o evento...</p></main>;
  }

  if (erro || !dados) {
    return (
      <main className="pb-pagina dt-pagina">
        <div className="pb-carregando" role="alert">
          <p>{erro?.includes('não encontrada') || erro?.includes('encontrad') ? 'Não encontramos este evento.' : 'Não foi possível carregar o evento agora.'}</p>
          <div className="dt-erro-acoes">
            <Link to="/geektopia" className="btn btn-secondary">← Ver todos os eventos</Link>
            <button type="button" className="btn btn-primary" onClick={recarregar}>Tentar de novo</button>
          </div>
        </div>
      </main>
    );
  }

  const { evento, programacao, competicoes, convidados, expositores } = dados;
  const cor = ehHexValido(evento.cor_destaque) ? evento.cor_destaque : COR_PADRAO;
  const passou = eventoPassou(evento);
  const vendaAberta = evento.status_evento === 'VendasAbertas' && !passou;
  const selo = seloClassificacao(evento.classificacao_etaria);
  const fundoCor = cssDoFundo(evento.banner_fundo);
  const horario = horarioEvento(evento.data_inicio, evento.data_fim);
  const paragrafos = (evento.texto_sobre || evento.descricao || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const destaques = Array.isArray(evento.destaques) ? evento.destaques : [];
  const principal = evento.tipo_edicao !== 'Pocket';
  const temSobre = paragrafos.length > 0 || destaques.length > 0;

  const semVendaTexto = passou
    ? 'Este evento já aconteceu. Os ingressos estão listados só para consulta.'
    : evento.status_evento === 'VendasEncerradas' ? 'As vendas online estão encerradas. Consulte a organização sobre ingressos na portaria.' : '';

  // Programação agrupada por dia.
  const dias = [];
  programacao.forEach((a) => {
    const chave = chaveDoDia(a.data_hora_inicio);
    let dia = dias.find((d) => d.chave === chave);
    if (!dia) { dia = { chave, titulo: tituloDoDia(a.data_hora_inicio), itens: [] }; dias.push(dia); }
    dia.itens.push(a);
  });

  // Regras de entrada: classificação/idade, documentação e objetos proibidos (um por linha).
  const proibidos = (evento.objetos_proibidos || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const temRegras = Boolean(evento.regras_idade_minima || evento.aviso_documentacao || proibidos.length);

  const secoes = [
    ...(temSobre ? [{ id: 'sobre', rotulo: 'Sobre', Icone: FiInfo }] : []),
    { id: 'ingressos', rotulo: 'Ingressos', Icone: FiTag },
    ...(dias.length ? [{ id: 'programacao', rotulo: 'Programação', Icone: FiClock }] : []),
    ...(convidados.length ? [{ id: 'convidados', rotulo: 'Convidados', Icone: FiUsers }] : []),
    ...(competicoes.length ? [{ id: 'competicoes', rotulo: 'Competições', Icone: FiAward }] : []),
    ...(expositores.length ? [{ id: 'expositores', rotulo: 'Expositores', Icone: FiShoppingBag }] : []),
    ...(temRegras ? [{ id: 'regras', rotulo: 'Regras de entrada', Icone: FiShield }] : [])
  ];

  const mostraCarrinho = vendaAberta && lotes.length > 0;

  const blocoCarrinho = (
    <>
      <h2 className="dt-carrinho-titulo"><FiShoppingCart aria-hidden="true" /> Seu pedido</h2>

      {itens.length === 0 ? (
        <p className="dt-carrinho-vazio">Escolha os ingressos ao lado para ver o total aqui.</p>
      ) : (
        <ul className="dt-carrinho-itens">
          {itens.map(({ lote, qtd }) => (
            <li key={lote.id_lote}>
              <span>{qtd} × {lote.nome_lote}</span>
              <strong>{moeda(qtd * lote.valor_ingresso)}</strong>
            </li>
          ))}
        </ul>
      )}

      <div className="dt-carrinho-total"><span>Total</span><strong>{moeda(totalValor)}</strong></div>

      {mensagem && (
        <div className="dt-alerta" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <div>
            {mensagem}
            {!logado && (
              <div className="dt-alerta-acoes">
                <Link to="/login" className="btn btn-primary">Entrar</Link>
                <Link to="/cadastro" className="btn btn-secondary">Criar conta</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <button type="button" className="btn btn-primary dt-finalizar" disabled={totalIngressos === 0 || comprando} onClick={finalizarCompra}>
        {comprando ? 'Abrindo o pagamento...' : totalIngressos === 0 ? 'Escolha um ingresso' : `Finalizar compra (${totalIngressos})`}
      </button>
      <p className="dt-carrinho-nota">Pagamento seguro pelo Mercado Pago.</p>
    </>
  );

  return (
    <main className="pb-pagina dt-pagina" style={{ '--cor-edicao': cor }}>
      {/* ---------------- HERO ---------------- */}
      <header className={`dt-hero ${fundoCor ? 'dt-hero-cor' : ''}`} style={fundoCor ? { background: fundoCor } : undefined}>
        {!fundoCor && evento.banner_url && <img className="dt-hero-fundo" src={evento.banner_url} alt="" />}
        <div className="dt-hero-veu" />
        <div className="pb-container dt-hero-conteudo">
          <Link to="/geektopia" className="dt-voltar">← Todos os eventos</Link>

          <div className="pb-chips">
            <span className="pb-chip is-destaque">{principal ? 'Geektopia Principal' : 'Geektopia Pocket'}</span>
            {passou ? <span className="pb-chip is-escuro">Evento encerrado</span>
              : vendaAberta ? <span className="pb-chip is-ok">Vendas abertas</span>
                : <span className="pb-chip is-aviso">Vendas encerradas</span>}
          </div>

          <h1 className="dt-titulo">{evento.nome_edicao}</h1>
          {evento.tagline && <p className="dt-tagline">{evento.tagline}</p>}

          <ul className="dt-fatos">
            <li>
              <FiCalendar aria-hidden="true" />
              <span><small>Quando</small><strong>{periodoEvento(evento.data_inicio, evento.data_fim)}</strong>{horario && <em>{horario}</em>}</span>
            </li>
            {evento.local && (
              <li>
                <FiMapPin aria-hidden="true" />
                <span><small>Onde</small><strong>{evento.local}</strong><a href={linkMapa(evento.local)} target="_blank" rel="noreferrer">Ver no mapa ↗</a></span>
              </li>
            )}
            {selo && (
              <li>
                <span className="selo-idade dt-selo" aria-hidden="true">{selo}</span>
                <span><small>Classificação</small><strong>{descricaoClassificacao(evento.classificacao_etaria)}</strong></span>
              </li>
            )}
          </ul>

          {!passou && evento.data_inicio && <div className="dt-hero-contagem"><Contagem dataAlvo={evento.data_inicio} /></div>}
        </div>
      </header>

      {evento.tipo_edicao !== 'Pocket' && <AvisoMenores />}

      <NavInterna secoes={secoes} cta={vendaAberta && <a href="#ingressos" className="btn btn-primary pb-nav-cta">Ver ingressos</a>} />

      <div className="pb-container dt-corpo">
        <div className="dt-principal">
          {temSobre && (
            <Secao id="sobre" titulo="Sobre o evento">
              <div className="dt-sobre">
                {paragrafos.map((p, i) => <p key={i} className={i === 0 ? 'is-primeiro' : undefined}>{p}</p>)}
              </div>
              {destaques.length > 0 && (
                <ul className="dt-destaques">
                  {destaques.map((d, i) => (
                    <li className="pb-cartao dt-destaque" key={i}><strong>{d.titulo}</strong>{d.descricao && <span>{d.descricao}</span>}</li>
                  ))}
                </ul>
              )}
            </Secao>
          )}

          {/* ---------------- INGRESSOS ---------------- */}
          <Secao id="ingressos" titulo="Ingressos" texto={vendaAberta ? 'Escolha o tipo e a quantidade. Você confere tudo antes de pagar.' : undefined}>
            {temRegras && (
              <div className="dt-avisos" role="note">
                <FiShield aria-hidden="true" />
                <div>
                  <strong>Antes de comprar</strong>
                  <p>Confira as <a href="#regras">regras de entrada</a> (idade, documentação e o que não pode levar).</p>
                </div>
              </div>
            )}

            {lotes.length === 0 ? (
              <p className="pb-vazio">Os ingressos deste evento ainda não foram publicados. Volte em breve.</p>
            ) : (
              <SeletorIngressos lotes={lotes} quantidades={quantidades} onAlterar={alterarQuantidade} vendaAberta={vendaAberta} semVendaTexto={semVendaTexto} />
            )}
          </Secao>

          {dias.length > 0 && (
            <Secao id="programacao" titulo="Programação" alt>
              {dias.map((d) => (
                <div className="dt-dia" key={d.chave}>
                  <h3>{d.titulo}</h3>
                  <ol className="dt-linha-tempo">
                    {d.itens.map((a) => (
                      <li key={a.id_programacao}>
                        <span className="dt-hora"><FiClock aria-hidden="true" />{horaCurta(a.data_hora_inicio)}{a.data_hora_fim && <small>até {horaCurta(a.data_hora_fim)}</small>}</span>
                        <span className="dt-atividade">{a.titulo_atividade}{a.competicao && <span className="pb-chip is-destaque">Competição</span>}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </Secao>
          )}

          {convidados.length > 0 && (
            <Secao id="convidados" titulo="Convidados">
              <ul className="dt-convidados">
                {convidados.map((c) => (
                  <li className="pb-cartao dt-convidado" key={c.id_convidado}>
                    <div className="dt-convidado-foto">{c.foto_url ? <img src={c.foto_url} alt={`Foto de ${c.nome}`} loading="lazy" /> : <span aria-hidden="true">{iniciais(c.nome)}</span>}</div>
                    <div className="dt-convidado-info">
                      {c.titulo_papel && <span className="pb-chip is-destaque">{c.titulo_papel}</span>}
                      <h3>{c.nome}</h3>
                      {c.descricao && <p>{c.descricao}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {competicoes.length > 0 && (
            <Secao id="competicoes" titulo="Competições" alt>
              <ul className="dt-competicoes">
                {competicoes.map((c) => <CartaoCompeticao key={c.id_competicao} c={c} classe="dt-competicao" />)}
              </ul>
            </Secao>
          )}

          {expositores.length > 0 && (
            <Secao id="expositores" titulo="Expositores confirmados">
              <Carrossel
                rotulo="Expositores confirmados" itens={expositores.map((e) => ({ ...e, id: e.id_solicitacao }))} classeItem="dt-expo-item"
                renderItem={(e) => {
                  const miolo = (
                    <>
                      <span className="dt-expo-logo">{e.logo_url ? <img src={e.logo_url} alt="" loading="lazy" /> : <span aria-hidden="true">{iniciais(e.nome)}</span>}</span>
                      <strong>{e.nome}</strong>
                      {(e.tipo || e.tipo_espaco) && <small>{e.tipo || e.tipo_espaco}</small>}
                    </>
                  );
                  return e.link
                    ? <a className="pb-cartao dt-expo" href={e.link} target="_blank" rel="noreferrer noopener" aria-label={`${e.nome} (abre em nova aba)`}>{miolo}</a>
                    : <div className="pb-cartao dt-expo">{miolo}</div>;
                }}
              />
            </Secao>
          )}

          {temRegras && (
            <Secao id="regras" titulo="Regras de entrada" texto="Leia antes de ir ao evento, para a entrada ser tranquila." alt>
              <div className="dt-regras">
                {evento.regras_idade_minima && (
                  <article className="dt-regra">
                    <h3><FiUsers aria-hidden="true" /> Idade</h3>
                    <p>{evento.regras_idade_minima}</p>
                  </article>
                )}
                {evento.aviso_documentacao && (
                  <article className="dt-regra">
                    <h3><FiFileText aria-hidden="true" /> Documentação</h3>
                    <p>{evento.aviso_documentacao}</p>
                  </article>
                )}
                {proibidos.length > 0 && (
                  <article className="dt-regra is-proibido">
                    <h3><FiSlash aria-hidden="true" /> Não é permitido levar</h3>
                    <ul>{proibidos.map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                )}
              </div>
            </Secao>
          )}
        </div>

        {/* Coluna lateral: o carrinho quando há venda; senão, um resumo útil do evento (nunca fica vazia) */}
        {mostraCarrinho ? (
          <aside className="dt-carrinho" aria-label="Resumo do pedido">{blocoCarrinho}</aside>
        ) : (
          <aside className="dt-resumo" aria-label="Resumo do evento">
            <h2 className="dt-resumo-titulo">Resumo do evento</h2>
            <ul className="dt-resumo-lista">
              <li><FiCalendar aria-hidden="true" /><span><small>Quando</small><strong>{periodoEvento(evento.data_inicio, evento.data_fim)}</strong>{horarioEvento(evento.data_inicio, evento.data_fim) && <em>{horarioEvento(evento.data_inicio, evento.data_fim)}</em>}</span></li>
              {evento.local && <li><FiMapPin aria-hidden="true" /><span><small>Onde</small><strong>{evento.local}</strong><a href={linkMapa(evento.local)} target="_blank" rel="noreferrer">Ver no mapa ↗</a></span></li>}
              <li><FiTag aria-hidden="true" /><span><small>Ingressos</small><strong>{passou ? 'Evento encerrado' : evento.status_evento === 'VendasEncerradas' ? 'Vendas encerradas' : lotes.length === 0 ? 'Em breve' : 'Consulte a organização'}</strong>{semVendaTexto && <em>{semVendaTexto}</em>}</span></li>
            </ul>
            <div className="dt-resumo-acoes">
              {temRegras && <a href="#regras" className="btn btn-secondary">Ver regras de entrada</a>}
              {evento.tipo_edicao !== 'Pocket' && <a href={URL_TERMO_MENORES} className="btn btn-secondary" target="_blank" rel="noopener noreferrer" download>Termo para menores (PDF)</a>}
              <Link to="/geektopia" className="btn btn-secondary">Ver outras edições</Link>
            </div>
          </aside>
        )}
      </div>

      {mostraCarrinho && totalIngressos > 0 && (
        <div className="dt-barra" role="region" aria-label="Resumo do pedido">
          <div><small>{totalIngressos} ingresso{totalIngressos === 1 ? '' : 's'}</small><strong>{moeda(totalValor)}</strong></div>
          <button type="button" className="btn btn-primary" disabled={comprando} onClick={finalizarCompra}>{comprando ? 'Abrindo...' : 'Finalizar compra'}</button>
          {mensagem && <p className="dt-barra-msg" role="alert">{mensagem} {!logado && <Link to="/login">Entrar</Link>}</p>}
        </div>
      )}
    </main>
  );
}
