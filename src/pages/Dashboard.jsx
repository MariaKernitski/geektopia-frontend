import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCarga } from '../hooks/useCarga';
import { Link } from 'react-router-dom';
import { FiActivity, FiAward, FiBarChart2, FiDollarSign, FiDownload, FiMapPin, FiPrinter, FiRefreshCw, FiShoppingBag, FiTag, FiUsers, FiX } from 'react-icons/fi';
import api from '../services/api';
import { Grafico } from '../components/dashboard/Grafico';
import { CartaoDados } from '../components/dashboard/CartaoDados';
import { FILTROS_VAZIOS, comPercentual, contarFiltros, descricaoFiltros, filtrosAtivos, montarConsulta } from '../utils/relatorio';
import { baixarXlsx } from '../utils/xlsx';
import { moeda } from '../utils/evento';
import '../style/Dashboard.css';

const inteiro = (n) => Number(n || 0).toLocaleString('pt-BR');
const pct = (n) => `${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const dataCurta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const ABAS = [
  { chave: 'resumo', rotulo: 'Visão geral', Icone: FiBarChart2 },
  { chave: 'publico', rotulo: 'Público', Icone: FiUsers },
  { chave: 'ingressos', rotulo: 'Ingressos', Icone: FiTag },
  { chave: 'parceiros', rotulo: 'Competições e expositores', Icone: FiAward }
];

function Indicador({ Icone, rotulo, valor, detalhe }) {
  return (
    <div className="dash-kpi">
      <span className="dash-kpi-icone"><Icone aria-hidden="true" /></span>
      <div>
        <span className="dash-kpi-rotulo">{rotulo}</span>
        <strong className="dash-kpi-valor">{valor}</strong>
        {detalhe && <span className="dash-kpi-detalhe">{detalhe}</span>}
      </div>
    </div>
  );
}

const COL_PUBLICO = [{ chave: 'rotulo', rotulo: 'Grupo' }, { chave: 'quantidade', rotulo: 'Pessoas', formato: inteiro }, { chave: 'percentual', rotulo: '%', formato: pct }];
const COL_VENDA = [{ chave: 'rotulo', rotulo: 'Item' }, { chave: 'ingressos', rotulo: 'Ingressos', formato: inteiro }, { chave: 'receita', rotulo: 'Receita', formato: moeda }, { chave: 'checkins', rotulo: 'Check-ins', formato: inteiro }];

export function Dashboard() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [aba, setAba] = useState('resumo');
  const [imprimindo, setImprimindo] = useState(false);

  const consulta = montarConsulta(filtros);
  const buscar = useCallback(() => api.get(`/relatorios/painel${consulta ? `?${consulta}` : ''}`).then((r) => r.data), [consulta]);
  const { dados, erro, atualizando: carregando, recarregar: buscarDeNovo } = useCarga(buscar);

  // Imprimir / salvar em PDF mostra todas as abas de uma vez.
  useEffect(() => {
    if (!imprimindo) return undefined;
    const fim = () => setImprimindo(false);
    window.addEventListener('afterprint', fim);
    const t = setTimeout(() => window.print(), 400);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', fim); };
  }, [imprimindo]);

  const alterar = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));
  // Clicar numa barra ou fatia aplica aquele valor como filtro (item.filtro vem pronto do servidor).
  const filtrarPor = (lista) => (i) => { const f = lista[i]?.filtro; if (f) setFiltros((x) => ({ ...x, ...f }));  };
  const opcoes = dados?.opcoes;
  const ativos = contarFiltros(filtros);
  const r = dados?.resumo;

  const negrito = (linha) => linha.map((v) => ({ v, b: true }));
  const planilha = (aba, cabecalho, linhas) => ({ nome: aba, linhas: [...descricaoFiltros(filtros, opcoes), negrito(cabecalho), ...linhas] });
  const baixar = (nome, cabecalho, linhas) => baixarXlsx(nome, [planilha(nome, cabecalho, linhas)]);
  const linhasPublico = (l) => l.map((x) => [x.rotulo, x.quantidade, x.percentual]);
  const linhasVendas = (l) => l.map((x) => [x.rotulo, x.ingressos, x.receita, x.checkins]);
  const CAB_PUBLICO = ['Grupo', 'Pessoas', 'Percentual (%)'];
  const CAB_VENDAS = ['Item', 'Ingressos', 'Receita (R$)', 'Check-ins'];
  const baixarPublico = (nome, lista) => baixar(nome, CAB_PUBLICO, linhasPublico(lista));
  const baixarVendas = (nome, lista) => baixar(nome, CAB_VENDAS, linhasVendas(lista));
  const linhasResumo = () => [
    ['Ingressos vendidos', r.ingressos_vendidos], ['Receita de ingressos (R$)', r.receita_ingressos], ['Ticket médio, só pagos (R$)', r.ticket_medio],
    ['Ingressos sem cobrança (cortesia)', r.cortesias], ['Check-ins', r.checkins], ['Taxa de comparecimento (%)', r.taxa_comparecimento],
    ['Compradores únicos', r.compradores_unicos], ['Ingressos cancelados', r.cancelados], ['Cidades de origem', r.cidades_distintas]];

  const relatorioCompleto = () => baixarXlsx('relatorio-completo', [
    planilha('Resumo', ['Indicador', 'Valor'], linhasResumo()),
    planilha('Vendas por edição', CAB_VENDAS, linhasVendas(dados.vendas.por_edicao)),
    planilha('Vendas por tipo', CAB_VENDAS, linhasVendas(dados.vendas.por_categoria)),
    planilha('Vendas por lote', CAB_VENDAS, linhasVendas(dados.vendas.por_lote)),
    planilha('Vendas por dia', ['Dia', 'Ingressos', 'Receita (R$)'], dados.vendas.por_dia.map((d) => [d.dia, d.ingressos, d.receita])),
    planilha('Público por cidade', CAB_PUBLICO, linhasPublico(dados.publico.por_cidade)),
    planilha('Público por estado', CAB_PUBLICO, linhasPublico(dados.publico.por_estado)),
    planilha('Público por gênero', CAB_PUBLICO, linhasPublico(dados.publico.por_genero)),
    planilha('Público por sexualidade', CAB_PUBLICO, linhasPublico(dados.publico.por_sexualidade)),
    planilha('Público por faixa etária', CAB_PUBLICO, linhasPublico(dados.publico.por_faixa_etaria))
  ]);

  const exportacoes = useMemo(() => (dados ? [
    ['Relatório completo (várias abas)', relatorioCompleto],
    ['Resumo geral', () => baixar('resumo', ['Indicador', 'Valor'], linhasResumo())],
    ['Público por cidade', () => baixarPublico('publico-cidade', dados.publico.por_cidade)],
    ['Público por estado', () => baixarPublico('publico-estado', dados.publico.por_estado)],
    ['Público por gênero', () => baixarPublico('publico-genero', dados.publico.por_genero)],
    ['Público por sexualidade', () => baixarPublico('publico-sexualidade', dados.publico.por_sexualidade)],
    ['Público por faixa etária', () => baixarPublico('publico-faixa-etaria', dados.publico.por_faixa_etaria)],
    ['Vendas por edição', () => baixarVendas('vendas-edicao', dados.vendas.por_edicao)],
    ['Vendas por lote', () => baixarVendas('vendas-lote', dados.vendas.por_lote)],
    ['Vendas por dia', () => baixar('vendas-dia', ['Dia', 'Ingressos', 'Receita (R$)'], dados.vendas.por_dia.map((d) => [d.dia, d.ingressos, d.receita]))],
    ['Competições', () => baixar('competicoes', ['Competição', 'Edição', 'Modalidade', 'Inscrições', 'Aprovadas', 'Em análise', 'Aguardando pagamento', 'Reprovadas'],
      dados.competicoes.map((c) => [c.nome, c.edicao, c.modalidade, c.inscricoes, c.aprovadas, c.em_analise, c.aguardando_pagamento, c.reprovadas]))]
  ] : []), [dados, filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  const mostra = (chave) => imprimindo || aba === chave;
  const cidadesGrafico = dados ? dados.publico.por_cidade.slice(0, 10) : [];

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <Link to="/admin" className="btn btn-secondary dash-voltar">← Painel</Link>

        <header className="dash-cabecalho">
          <div>
            <h1 className="dash-titulo">Relatórios e indicadores</h1>
            <p className="dash-sub">Público, vendas e participação nos eventos da CCPOP, com filtros e exportação para planilha.</p>
          </div>
          <div className="dash-acoes">
            <details className="dash-menu">
              <summary className="btn btn-primary"><FiDownload aria-hidden="true" /> Baixar planilha (Excel)</summary>
              <ul>
                {exportacoes.map(([nome, fn]) => <li key={nome}><button type="button" onClick={fn}>{nome}</button></li>)}
              </ul>
            </details>
            <button type="button" className="btn btn-secondary" onClick={() => setImprimindo(true)} disabled={!dados}><FiPrinter aria-hidden="true" /> Imprimir / PDF</button>
          </div>
        </header>

        <details className="dash-filtros" open>
          <summary>Filtros {ativos > 0 && <span className="dash-filtros-qtd">{ativos}</span>}</summary>
          <div className="dash-filtros-grupos">
            <fieldset className="dash-grupo">
              <legend>O que analisar</legend>
              <div className="dash-campo">
                <label htmlFor="f-base">Base</label>
                <select id="f-base" value={filtros.base} onChange={(e) => alterar('base', e.target.value)}>
                  <option value="participantes">Participantes (quem tem ingresso)</option>
                  <option value="cadastros">Todos os usuários cadastrados</option>
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-edicao">Edição</label>
                <select id="f-edicao" value={filtros.id_geektopia} onChange={(e) => alterar('id_geektopia', e.target.value)} disabled={filtros.base === 'cadastros'}>
                  <option value="">Todas</option>
                  {(opcoes?.edicoes ?? []).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-de">Compra de</label>
                <input id="f-de" type="date" value={filtros.de} max={filtros.ate || undefined} onChange={(e) => alterar('de', e.target.value)} disabled={filtros.base === 'cadastros'} />
              </div>
              <div className="dash-campo">
                <label htmlFor="f-ate">até</label>
                <input id="f-ate" type="date" value={filtros.ate} min={filtros.de || undefined} onChange={(e) => alterar('ate', e.target.value)} disabled={filtros.base === 'cadastros'} />
              </div>
            </fieldset>
            <fieldset className="dash-grupo">
              <legend>Perfil do público</legend>
              <div className="dash-campo">
                <label htmlFor="f-estado">Estado</label>
                <select id="f-estado" value={filtros.estado} onChange={(e) => alterar('estado', e.target.value)}>
                  <option value="">Todos</option>
                  {(opcoes?.estados ?? []).map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-cidade">Cidade</label>
                <select id="f-cidade" value={filtros.cidade} onChange={(e) => alterar('cidade', e.target.value)}>
                  <option value="">Todas</option>
                  {(opcoes?.cidades ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-genero">Gênero</label>
                <select id="f-genero" value={filtros.genero} onChange={(e) => alterar('genero', e.target.value)}>
                  <option value="">Todos</option>
                  {(opcoes?.generos ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-sexualidade">Sexualidade</label>
                <select id="f-sexualidade" value={filtros.sexualidade} onChange={(e) => alterar('sexualidade', e.target.value)}>
                  <option value="">Todas</option>
                  {(opcoes?.sexualidades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="dash-campo">
                <label htmlFor="f-faixa">Faixa etária</label>
                <select id="f-faixa" value={filtros.faixa} onChange={(e) => alterar('faixa', e.target.value)}>
                  <option value="">Todas</option>
                  {(opcoes?.faixas ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </fieldset>
          </div>
        </details>

        <div className="dash-etiquetas" aria-live="polite">
          <span className="dash-etiquetas-titulo">{carregando ? 'Atualizando...' : ativos > 0 ? 'Filtrando por:' : 'Sem filtros: mostrando tudo. Clique num gráfico para filtrar.'}</span>
          {filtrosAtivos(filtros, opcoes).map((f) => (
            <button key={f.chave} type="button" className="dash-etiqueta" onClick={() => alterar(f.chave, '')} aria-label={`Remover filtro ${f.rotulo}: ${f.valor}`}>
              <strong>{f.rotulo}:</strong> {f.valor} <FiX aria-hidden="true" />
            </button>
          ))}
          {ativos > 0 && <button type="button" className="btn btn-secondary dash-btn-peq" onClick={() => setFiltros((f) => ({ ...FILTROS_VAZIOS, base: f.base }))}><FiRefreshCw aria-hidden="true" /> Limpar tudo</button>}
        </div>

        {erro && <div className="dash-erro" role="alert">{erro} <button type="button" className="btn btn-secondary dash-btn-peq" onClick={buscarDeNovo}>Tentar de novo</button></div>}
        {!dados && !erro && <p className="dash-carregando" aria-busy="true">Carregando relatório...</p>}

        {dados && (
          <div className={carregando ? 'dash-conteudo is-carregando' : 'dash-conteudo'}>
            <div className="dash-kpis">
              <Indicador Icone={FiTag} rotulo="Ingressos vendidos" valor={inteiro(r.ingressos_vendidos)} detalhe={[r.cortesias > 0 ? `${inteiro(r.cortesias)} sem cobrança (cortesia)` : '', r.cancelados > 0 ? `${inteiro(r.cancelados)} cancelado(s)` : ''].filter(Boolean).join(' · ') || undefined} />
              <Indicador Icone={FiDollarSign} rotulo="Receita de ingressos" valor={moeda(r.receita_ingressos)} detalhe={`Ticket médio ${moeda(r.ticket_medio)} (só pagos)`} />
              <Indicador Icone={FiActivity} rotulo="Check-ins" valor={inteiro(r.checkins)} detalhe={`${pct(r.taxa_comparecimento)} de comparecimento`} />
              <Indicador Icone={FiUsers} rotulo={filtros.base === 'cadastros' ? 'Usuários' : 'Compradores únicos'} valor={inteiro(filtros.base === 'cadastros' ? r.total_pessoas : r.compradores_unicos)} />
              <Indicador Icone={FiMapPin} rotulo="Cidades de origem" valor={inteiro(r.cidades_distintas)} detalhe={`${dados.publico.por_estado.filter((e) => e.chave !== 'NAO').length} estado(s)`} />
            </div>

            <nav className="dash-abas" aria-label="Seções do relatório">
              {ABAS.map(({ chave, rotulo, Icone }) => (
                <button key={chave} type="button" className={`dash-aba ${aba === chave ? 'is-ativa' : ''}`} aria-current={aba === chave ? 'page' : undefined} onClick={() => setAba(chave)}>
                  <Icone aria-hidden="true" /> {rotulo}
                </button>
              ))}
            </nav>

            {mostra('resumo') && (
              <div className="dash-grade">
                <CartaoDados larga titulo="Vendas ao longo do tempo" subtitulo="Ingressos vendidos por dia (horário de Brasília)"
                  colunas={[{ chave: 'dia', rotulo: 'Dia' }, { chave: 'ingressos', rotulo: 'Ingressos' }, { chave: 'receita', rotulo: 'Receita', formato: moeda }]}
                  linhas={dados.vendas.por_dia} aoBaixar={() => baixar('vendas-dia', ['Dia', 'Ingressos', 'Receita (R$)'], dados.vendas.por_dia.map((d) => [d.dia, d.ingressos, d.receita]))}>
                  <Grafico tipo="line" rotulos={dados.vendas.por_dia.map((d) => dataCurta(d.dia))} series={[{ nome: 'Ingressos', valores: dados.vendas.por_dia.map((d) => d.ingressos) }]} descricao="Gráfico de linha com ingressos vendidos por dia" />
                </CartaoDados>
                <CartaoDados titulo="Ingressos por edição" colunas={COL_VENDA} linhas={dados.vendas.por_edicao} aoBaixar={() => baixarVendas('vendas-edicao', dados.vendas.por_edicao)}>
                  <Grafico tipo="bar" rotulos={dados.vendas.por_edicao.map((e) => e.rotulo)} series={[{ nome: 'Vendidos', valores: dados.vendas.por_edicao.map((e) => e.ingressos) }, { nome: 'Check-ins', valores: dados.vendas.por_edicao.map((e) => e.checkins), cor: '#0e7c86' }]} descricao="Ingressos vendidos e check-ins por edição" />
                </CartaoDados>
                <CartaoDados titulo="Check-ins por horário" subtitulo="Chegada do público na portaria" colunas={[{ chave: 'hora', rotulo: 'Hora', formato: (h) => `${String(h).padStart(2, '0')}h` }, { chave: 'quantidade', rotulo: 'Check-ins' }]} linhas={dados.checkins_por_hora}
                  aoBaixar={() => baixar('checkins-horario', ['Hora', 'Check-ins'], dados.checkins_por_hora.map((h) => [`${h.hora}h`, h.quantidade]))}>
                  <Grafico tipo="bar" rotulos={dados.checkins_por_hora.map((h) => `${String(h.hora).padStart(2, '0')}h`)} series={[{ nome: 'Check-ins', valores: dados.checkins_por_hora.map((h) => h.quantidade), cor: '#0e7c86' }]} descricao="Check-ins por hora do dia" />
                </CartaoDados>
              </div>
            )}

            {mostra('publico') && (
              <div className="dash-grade">
                <CartaoDados larga filtravel titulo="De onde vem o público" subtitulo={`Cidades (as 10 maiores no gráfico; a tabela mostra todas: ${dados.publico.por_cidade.length})`} colunas={COL_PUBLICO} linhas={dados.publico.por_cidade} aoBaixar={() => baixarPublico('publico-cidade', dados.publico.por_cidade)}>
                  <Grafico tipo="barH" rotulos={cidadesGrafico.map((c) => c.rotulo)} series={[{ nome: 'Pessoas', valores: cidadesGrafico.map((c) => c.quantidade) }]} descricao="Barras com as cidades de origem do público" aoClicar={filtrarPor(cidadesGrafico)} />
                </CartaoDados>
                <CartaoDados filtravel titulo="Gênero" subtitulo="Informado no cadastro" colunas={COL_PUBLICO} linhas={dados.publico.por_genero} aoBaixar={() => baixarPublico('publico-genero', dados.publico.por_genero)}>
                  <Grafico tipo="doughnut" rotulos={comPercentual(dados.publico.por_genero)} series={[{ nome: 'Pessoas', valores: dados.publico.por_genero.map((e) => e.quantidade) }]} descricao="Distribuição do público por gênero, em porcentagem" aoClicar={filtrarPor(dados.publico.por_genero)} />
                </CartaoDados>
                <CartaoDados filtravel titulo="Faixa etária" subtitulo="Idade do titular do ingresso" colunas={COL_PUBLICO} linhas={dados.publico.por_faixa_etaria} aoBaixar={() => baixarPublico('publico-faixa-etaria', dados.publico.por_faixa_etaria)}>
                  <Grafico tipo="bar" rotulos={dados.publico.por_faixa_etaria.map((e) => e.rotulo)} series={[{ nome: 'Pessoas', valores: dados.publico.por_faixa_etaria.map((e) => e.quantidade) }]} descricao="Distribuição do público por faixa etária" aoClicar={filtrarPor(dados.publico.por_faixa_etaria)} />
                </CartaoDados>
                <CartaoDados filtravel titulo="Estados" colunas={COL_PUBLICO} linhas={dados.publico.por_estado} aoBaixar={() => baixarPublico('publico-estado', dados.publico.por_estado)}>
                  <Grafico tipo="doughnut" rotulos={comPercentual(dados.publico.por_estado)} series={[{ nome: 'Pessoas', valores: dados.publico.por_estado.map((e) => e.quantidade) }]} descricao="Distribuição do público por estado" aoClicar={filtrarPor(dados.publico.por_estado)} />
                </CartaoDados>
                <CartaoDados filtravel titulo="Sexualidade" subtitulo="Opcional: só quem informou no perfil" colunas={COL_PUBLICO} linhas={dados.publico.por_sexualidade} aoBaixar={() => baixarPublico('publico-sexualidade', dados.publico.por_sexualidade)}>
                  <Grafico tipo="doughnut" rotulos={comPercentual(dados.publico.por_sexualidade)} series={[{ nome: 'Pessoas', valores: dados.publico.por_sexualidade.map((e) => e.quantidade) }]} descricao="Distribuição do público por sexualidade, em porcentagem" aoClicar={filtrarPor(dados.publico.por_sexualidade)} />
                </CartaoDados>
              </div>
            )}

            {mostra('ingressos') && (
              <div className="dash-grade">
                <CartaoDados larga titulo="Vendas por lote" colunas={COL_VENDA} linhas={dados.vendas.por_lote} aoBaixar={() => baixarVendas('vendas-lote', dados.vendas.por_lote)}>
                  <Grafico tipo="barH" rotulos={dados.vendas.por_lote.slice(0, 12).map((l) => l.rotulo)} series={[{ nome: 'Ingressos', valores: dados.vendas.por_lote.slice(0, 12).map((l) => l.ingressos) }]} descricao="Ingressos vendidos por lote" />
                </CartaoDados>
                <CartaoDados titulo="Por tipo de ingresso" colunas={COL_VENDA} linhas={dados.vendas.por_categoria} aoBaixar={() => baixarVendas('vendas-categoria', dados.vendas.por_categoria)}>
                  <Grafico tipo="doughnut" rotulos={dados.vendas.por_categoria.map((c) => c.rotulo)} series={[{ nome: 'Ingressos', valores: dados.vendas.por_categoria.map((c) => c.ingressos) }]} descricao="Ingressos por tipo: inteira, meia e outros" />
                </CartaoDados>
              </div>
            )}

            {mostra('parceiros') && (
              <div className="dash-grade">
                <CartaoDados larga titulo="Competições" subtitulo="Inscrições por competição (segue a edição escolhida)"
                  colunas={[{ chave: 'nome', rotulo: 'Competição' }, { chave: 'edicao', rotulo: 'Edição' }, { chave: 'modalidade', rotulo: 'Modalidade' }, { chave: 'inscricoes', rotulo: 'Inscrições' }, { chave: 'aprovadas', rotulo: 'Aprovadas' }, { chave: 'em_analise', rotulo: 'Em análise' }, { chave: 'aguardando_pagamento', rotulo: 'Aguard. pgto.' }, { chave: 'reprovadas', rotulo: 'Reprovadas' }]}
                  linhas={dados.competicoes} aoBaixar={() => exportacoes.find(([n]) => n === 'Competições')?.[1]()}>
                  <Grafico tipo="bar" rotulos={dados.competicoes.map((c) => c.nome)} series={[{ nome: 'Aprovadas', valores: dados.competicoes.map((c) => c.aprovadas), cor: '#2e933c' }, { nome: 'Em análise', valores: dados.competicoes.map((c) => c.em_analise + c.aguardando_pagamento), cor: '#f5c22b' }, { nome: 'Reprovadas', valores: dados.competicoes.map((c) => c.reprovadas), cor: '#e4572e' }]} descricao="Inscrições por competição e situação" />
                </CartaoDados>
                <section className="dash-cartao is-larga" aria-label="Expositores">
                  <header className="dash-cartao-topo"><div><h3><FiShoppingBag aria-hidden="true" /> Expositores</h3><p>Solicitações de espaço (segue a edição escolhida)</p></div></header>
                  <div className="dash-kpis is-compacto">
                    <Indicador Icone={FiShoppingBag} rotulo="Solicitações" valor={inteiro(dados.expositores.solicitacoes)} detalhe={`${inteiro(dados.expositores.em_analise)} em análise`} />
                    <Indicador Icone={FiAward} rotulo="Aprovadas" valor={inteiro(dados.expositores.aprovadas)} detalhe={`${inteiro(dados.expositores.reprovadas)} reprovada(s)`} />
                    <Indicador Icone={FiUsers} rotulo="Confirmados (taxa paga)" valor={inteiro(dados.expositores.confirmados_pagos)} />
                    <Indicador Icone={FiDollarSign} rotulo="Receita de taxas" valor={moeda(dados.expositores.receita_taxas)} />
                  </div>
                </section>
              </div>
            )}

            <p className="dash-nota">Cada ingresso vendido conta uma pessoa. Cidade, estado, gênero e sexualidade vêm do cadastro de quem comprou (a sexualidade é opcional e informada no perfil); a idade vem do titular do ingresso. Ingressos cancelados não entram nos números. Os relatórios são agregados e não mostram dados pessoais.</p>
          </div>
        )}
      </div>
    </div>
  );
}
