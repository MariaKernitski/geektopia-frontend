import { useCallback, useState } from 'react';
import api from '../../services/api';
import { ConfirmModal } from '../ConfirmModal';
import { useAviso, mensagemDeErro } from '../../hooks/useAviso';
import { avisoDaTela, useCarga } from '../../hooks/useCarga';
import { AvisoBox } from './AvisoBox';
import { formatarMoeda } from '../../utils/datas';

const ROTULO_STATUS = { EmAnalise: 'Em análise', Aprovado: 'Aprovado', Reprovado: 'Reprovado' };

// Situação do pagamento da taxa de espaço, vista pela diretoria.
function situacaoPagamento(s) {
  if (s.status_solicitacao !== 'Aprovado') return null;
  if (!s.id_pedido) return { texto: 'Aguardando o expositor gerar a cobrança', tipo: 'neutro' };
  if (s.pedido?.status_pedido === 'Pago') return { texto: 'Pago · aparece no site', tipo: 'ok' };
  return { texto: 'Cobrança gerada · aguardando pagamento', tipo: 'neutro' };
}

// Fila de análise de expositores desta edição. Um expositor só aparece no
// carrossel público quando a solicitação está Aprovada E a taxa está paga.
export function AbaExpositores({ evento, recarregarResumo }) {
  const id = evento.id_geektopia;
  const { aviso, mostrar, limpar } = useAviso();
  const [reprovar, setReprovar] = useState(null);
  const [trabalhando, setTrabalhando] = useState(null);

  const buscar = useCallback(
    () => api.get('/solicitacoes-espaco/admin/todas', { params: { id_geektopia: id } }).then((r) => r.data),
    [id]
  );
  const { dados, erro: erroCarga, carregando, recarregar: carregar } = useCarga(buscar);
  const lista = dados ?? [];

  const mudarStatus = async (solicitacao, status) => {
    limpar();
    setTrabalhando(solicitacao.id_solicitacao);
    try {
      const res = await api.patch(`/solicitacoes-espaco/${solicitacao.id_solicitacao}/status`, { status_solicitacao: status });
      mostrar('sucesso', res.data.message || 'Status atualizado.');
      carregar();
      recarregarResumo();
    } catch (err) {
      mostrar('erro', mensagemDeErro(err, 'Não foi possível alterar o status.'));
    } finally {
      setTrabalhando(null);
    }
  };

  const confirmados = lista.filter((s) => s.status_solicitacao === 'Aprovado' && s.pedido?.status_pedido === 'Pago').length;

  return (
    <section className="ed-painel" aria-labelledby="t-expo">
      <h2 id="t-expo" className="ed-titulo">Expositores</h2>
      <p className="ed-ajuda-topo">
        Candidaturas de expositores a espaços nesta edição. Ao aprovar, o expositor recebe a possibilidade de gerar a cobrança;
        depois que a taxa é paga, ele passa a aparecer no carrossel público.
      </p>
      <AvisoBox aviso={avisoDaTela(aviso, erroCarga)} />

      {lista.length > 0 && (
        <p className="ed-resumo">{lista.length} solicitação(ões) · {confirmados} confirmado(s) no site</p>
      )}

      {carregando ? (
        <p className="ed-vazio">Carregando solicitações...</p>
      ) : lista.length === 0 ? (
        <div className="ed-vazio">
          <strong>Nenhuma solicitação de espaço para esta edição.</strong>
          <span>Quando um expositor se candidatar, ela aparece aqui para análise.</span>
        </div>
      ) : (
        <ul className="ed-lista">
          {lista.map((s) => {
            const pagamento = situacaoPagamento(s);
            const ocupado = trabalhando === s.id_solicitacao;
            return (
              <li className="ed-item ed-item-coluna" key={s.id_solicitacao}>
                <div className="ed-item-topo">
                  <div className="ed-item-info">
                    <span className="ed-item-nome">
                      {s.expositor?.nome_loja_projeto || 'Expositor sem nome de loja'}
                      <span className={`ed-badge ${s.status_solicitacao === 'Aprovado' ? 'is-ok' : s.status_solicitacao === 'Reprovado' ? 'is-erro' : ''}`}>
                        {ROTULO_STATUS[s.status_solicitacao]}
                      </span>
                    </span>
                    <span className="ed-item-detalhe">
                      {s.espaco?.tipo_espaco || 'Espaço'} · {formatarMoeda(s.valor_total_final)}
                      {s.expositor?.usuario && ` · ${s.expositor.usuario.nome_completo} (${s.expositor.usuario.email})`}
                    </span>
                    {pagamento && <span className={`ed-pagamento is-${pagamento.tipo}`}>{pagamento.texto}</span>}
                  </div>
                  <div className="ed-item-acoes">
                    {s.status_solicitacao !== 'Aprovado' && (
                      <button type="button" className="btn btn-primary ed-btn-sm" disabled={ocupado} onClick={() => mudarStatus(s, 'Aprovado')}>Aprovar</button>
                    )}
                    {s.status_solicitacao !== 'Reprovado' && (
                      <button type="button" className="btn btn-danger ed-btn-sm" disabled={ocupado} onClick={() => setReprovar(s)}>Reprovar</button>
                    )}
                    {s.status_solicitacao !== 'EmAnalise' && (
                      <button type="button" className="btn btn-secondary ed-btn-sm" disabled={ocupado} onClick={() => mudarStatus(s, 'EmAnalise')}>Voltar p/ análise</button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={reprovar !== null}
        title="Reprovar solicitação"
        message={`Reprovar a candidatura de "${reprovar?.expositor?.nome_loja_projeto}"? Você pode voltar a análise depois, se mudar de ideia.`}
        confirmLabel="Reprovar"
        variant="danger"
        onConfirm={() => { const alvo = reprovar; setReprovar(null); mudarStatus(alvo, 'Reprovado'); }}
        onCancel={() => setReprovar(null)}
      />
    </section>
  );
}
