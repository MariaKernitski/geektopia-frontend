import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AvisoBox } from '../components/edicao/AvisoBox';
import { ConfirmModal } from '../components/ConfirmModal';
import { abrirAbaPagamento, fecharAbaPagamento, irParaPagamento } from '../utils/pagamentoAba';
import { usePagamentosPendentes } from '../hooks/usePagamentosPendentes';
import { avisoDaTela, useCarga } from '../hooks/useCarga';
import { useAviso, mensagemDeErro } from '../hooks/useAviso';
import { ROTULO_MODALIDADE, situacaoDaInscricao } from '../utils/competicao';
import { formatarMoeda } from '../utils/datas';
import '../style/AdminEdicao.css';
import '../style/Parceiro.css';

// Central do competidor: perfil e acompanhamento das inscrições
// (em análise -> aprovada -> taxa paga -> confirmada).
export function CompetidorArea() {
  const location = useLocation();
  const { aviso, mostrar, limpar } = useAviso();
  const [cancelar, setCancelar] = useState(null);
  const [trabalhando, setTrabalhando] = useState(null);

  const buscar = useCallback(async () => {
    const [perfil, minhas] = await Promise.all([api.get('/parceiros/meu-perfil'), api.get('/inscricoes/minhas')]);
    return { competidor: perfil.data.papeis?.competidor || null, inscricoes: minhas.data };
  }, []);
  const { dados, erro, carregando, recarregar } = useCarga(buscar);

  const inicial = location.state?.sucesso ? { tipo: 'sucesso', texto: location.state.sucesso } : { tipo: '', texto: '' };
  const inscricoes = dados?.inscricoes ?? [];

  // Pagamentos já iniciados: a tela confirma sozinha, sem depender do "Voltar ao site" do Mercado Pago.
  const pendentes = inscricoes.filter((i) => i.status_inscricao === 'Aprovado' && i.pedido?.status_pedido === 'Pendente').map((i) => i.pedido.id_pedido);
  const pagamento = usePagamentosPendentes(pendentes, () => {
    mostrar('sucesso', 'Pagamento confirmado! Sua vaga está garantida.');
    recarregar();
  });

  const pagar = async (i) => {
    const aba = abrirAbaPagamento();
    limpar();
    setTrabalhando(i.id_inscricao);
    try {
      const res = await api.post(`/inscricoes/${i.id_inscricao}/pagamento`, {}, { timeout: 30000 });
      if (irParaPagamento(aba, res.data.init_point)) setTrabalhando(null); // outra aba; esta confere o pagamento sozinha
    } catch (err) {
      fecharAbaPagamento(aba);
      mostrar('erro', err.code === 'ECONNABORTED'
        ? 'O Mercado Pago demorou para responder. Nenhuma cobrança foi feita; tente novamente.'
        : mensagemDeErro(err, 'Não foi possível abrir o pagamento.'));
      setTrabalhando(null);
    }
  };

  const confirmarCancelamento = async () => {
    const alvo = cancelar;
    setCancelar(null);
    limpar();
    try {
      const res = await api.delete(`/inscricoes/${alvo.id_inscricao}`);
      mostrar('sucesso', res.data.message);
      recarregar();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível cancelar a inscrição.'));
    }
  };

  return (
    <div className="ed-pagina">
      <Link to="/participar" className="btn btn-secondary ed-voltar">← Participar</Link>

      <div className="pt-cabecalho-acoes">
        <h1 className="ed-titulo-pagina">Área do competidor</h1>
        <Link to="/geektopia" className="btn btn-primary">Ver competições</Link>
      </div>

      <AvisoBox aviso={avisoDaTela(aviso.texto ? aviso : inicial, erro)} />

      {carregando ? (
        <p className="ed-vazio">Carregando...</p>
      ) : (
        <>
          {dados?.competidor && (
            <div className="pt-perfil-card">
              <span className="pt-logo" aria-hidden="true">{(dados.competidor.nickname_competidor || '?').charAt(0).toUpperCase()}</span>
              <div className="pt-perfil-info">
                <strong>{dados.competidor.nickname_competidor}</strong>
                <span>Nome de competidor</span>
              </div>
            </div>
          )}

          <h2 className="ed-subtitulo-secao">Minhas inscrições</h2>

          {inscricoes.length === 0 ? (
            <div className="ed-vazio">
              <strong>Você ainda não se inscreveu em nenhuma competição.</strong>
              <span>Abra a página da Geektopia, escolha uma competição e preencha a inscrição. A organização avalia e você acompanha o resultado aqui.</span>
              <Link to="/geektopia" className="btn btn-primary" style={{ alignSelf: 'center', marginTop: 8 }}>Ver competições</Link>
            </div>
          ) : (
            <ul className="ed-lista">
              {inscricoes.map((i) => {
                const sit = situacaoDaInscricao(i);
                const podeCancelar = ['AguardandoPagamento', 'EmAnalise'].includes(i.status_inscricao) && !i.id_pedido;
                const taxa = Number(i.competicao?.valor_taxa_inscricao) || 0;
                return (
                  <li className="ed-item ed-item-coluna" key={i.id_inscricao}>
                    <div className="ed-item-topo">
                      <div className="ed-item-info">
                        <span className="ed-item-nome">
                          {i.competicao?.nome_competicao}
                          <span className={`ed-badge ${sit.tipo === 'ok' ? 'is-ok' : sit.tipo === 'erro' ? 'is-erro' : ''}`}>{sit.rotulo}</span>
                        </span>
                        <span className="ed-item-detalhe">
                          {i.competicao?.geektopia?.nome_edicao} · {ROTULO_MODALIDADE[i.competicao?.modalidade] || ''}
                          {taxa > 0 && ` · taxa ${formatarMoeda(taxa)}`}
                          {i.equipe && ` · equipe ${i.equipe.nome_equipe}`}
                        </span>
                        <span className="ed-item-detalhe">{sit.passo}</span>
                        {sit.pagar && !i.pedido && <span className="ed-item-detalhe"><strong>Como funciona:</strong> você vai ao Mercado Pago, paga e clica em “Voltar ao site”; a confirmação aparece aqui sozinha.</span>}
                        {sit.pagar && i.pedido && <span className="ed-item-detalhe">{pagamento.mensagem || 'Aguardando a confirmação do pagamento. Esta tela atualiza sozinha.'}</span>}
                        {i.observacao_admin && <span className="ed-item-detalhe"><strong>Recado da organização:</strong> {i.observacao_admin}</span>}
                      </div>
                      <div className="ed-item-acoes">
                        {sit.pagar && (
                          <button type="button" className="btn btn-primary ed-btn-sm" disabled={trabalhando === i.id_inscricao} onClick={() => pagar(i)}>
                            {trabalhando === i.id_inscricao ? 'Abrindo...' : i.pedido ? 'Continuar pagamento' : `Pagar taxa · ${formatarMoeda(taxa)}`}
                          </button>
                        )}
                        {sit.pagar && i.pedido && (
                          <button type="button" className="btn btn-secondary ed-btn-sm" disabled={pagamento.verificando} onClick={pagamento.verificar}>
                            {pagamento.verificando ? 'Verificando...' : 'Já paguei — verificar'}
                          </button>
                        )}
                        <Link to={`/competicoes/${i.id_competicao}`} className="btn btn-secondary ed-btn-sm">Ver competição</Link>
                        {podeCancelar && <button type="button" className="btn btn-danger ed-btn-sm" onClick={() => setCancelar(i)}>Cancelar</button>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={cancelar !== null}
        title="Cancelar inscrição"
        message={`Cancelar a inscrição em "${cancelar?.competicao?.nome_competicao}"? Você poderá se inscrever de novo depois, se ainda houver vaga.`}
        confirmLabel="Cancelar inscrição"
        variant="danger"
        onConfirm={confirmarCancelamento}
        onCancel={() => setCancelar(null)}
      />
    </div>
  );
}
