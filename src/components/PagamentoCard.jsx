import { FiCheckCircle, FiClock, FiCreditCard, FiRefreshCw } from 'react-icons/fi';
import { formatarMoeda } from '../utils/datas';

// Bloco explícito de pagamento (taxa de espaço / inscrição): deixa claro que é o próximo
// passo, quanto custa, o que vai acontecer e o que fazer se já pagou.
//   temPedido  já existe uma cobrança (a pessoa começou a pagar)
export function PagamentoCard({ valor, temPedido, pagando, verificando, mensagem, onPagar, onVerificar }) {
  return (
    <section className="pt-pagamento" aria-labelledby="pt-pag-t">
      <div className="pt-pagamento-topo">
        <FiCreditCard aria-hidden="true" />
        <div>
          <h2 id="pt-pag-t">Próximo passo: pagar a taxa</h2>
          <p>Para garantir a sua vaga, falta só o pagamento de <strong>{formatarMoeda(valor)}</strong>.</p>
        </div>
      </div>

      {!temPedido ? (
        <>
          <ol className="pt-pagamento-passos">
            <li>Você vai para o <strong>Mercado Pago</strong> (pagamento seguro).</li>
            <li>Paga com Pix, cartão ou o meio que preferir.</li>
            <li>Ao terminar, clique em <strong>“Voltar ao site”</strong>. A confirmação aparece aqui sozinha.</li>
          </ol>
          <button type="button" className="btn btn-primary pt-pagamento-botao" disabled={pagando} onClick={onPagar}>
            {pagando ? 'Abrindo o Mercado Pago...' : `Pagar ${formatarMoeda(valor)} com Mercado Pago`}
          </button>
        </>
      ) : (
        <>
          <p className="pt-pagamento-estado" role="status" aria-live="polite">
            {verificando ? <FiRefreshCw className="pt-girando" aria-hidden="true" /> : <FiClock aria-hidden="true" />}
            {verificando ? 'Verificando o seu pagamento...' : 'Aguardando a confirmação do pagamento.'}
          </p>
          {mensagem && <p className="pt-pagamento-msg">{mensagem}</p>}
          <p className="pt-pagamento-ajuda">Já pagou? Esta página confirma sozinha em alguns segundos. Se ainda não pagou, você pode continuar de onde parou.</p>
          <div className="ed-acoes ed-acoes-esquerda ed-acoes-quebra">
            <button type="button" className="btn btn-primary" disabled={verificando} onClick={onVerificar}>Verificar agora</button>
            <button type="button" className="btn btn-secondary" disabled={pagando} onClick={onPagar}>{pagando ? 'Abrindo...' : 'Abrir o Mercado Pago de novo'}</button>
          </div>
        </>
      )}
    </section>
  );
}

export function PagamentoConfirmado({ texto }) {
  return (
    <div className="pt-pago" role="status">
      <FiCheckCircle aria-hidden="true" />
      <div><strong>Pagamento confirmado</strong><p>{texto}</p></div>
    </div>
  );
}
