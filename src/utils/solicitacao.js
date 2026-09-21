// Situação de uma solicitação de espaço, do ponto de vista de quem se candidatou.
// A candidatura passa por: Enviada -> Em análise -> Aprovada -> Paga (confirmada).

export const ETAPAS = ['Enviada', 'Em análise', 'Aprovada', 'Confirmada'];

export function situacaoDaSolicitacao(s) {
  const pago = s.pedido?.status_pedido === 'Pago';

  if (s.status_solicitacao === 'Reprovado') {
    return { rotulo: 'Reprovada', tipo: 'erro', etapa: -1, passo: 'A diretoria não aprovou esta candidatura.' };
  }
  if (s.status_solicitacao === 'EmAnalise') {
    return { rotulo: 'Em análise', tipo: 'neutro', etapa: 1, passo: 'A diretoria está avaliando. Volte aqui para acompanhar.' };
  }
  if (pago) {
    return { rotulo: 'Confirmada', tipo: 'ok', etapa: 3, passo: 'Taxa paga. Sua presença está confirmada na edição.' };
  }
  if (s.pedido) {
    return { rotulo: 'Aguardando pagamento', tipo: 'aviso', etapa: 2, passo: 'Aprovada! Falta concluir o pagamento da taxa.' };
  }
  return { rotulo: 'Aprovada', tipo: 'ok', etapa: 2, passo: 'A diretoria aprovou o seu pedido. Falta pagar a taxa para confirmar sua presença.' };
}

// Mesma conta do backend (calcularTotal): serve só para a prévia; o valor
// oficial é o que o servidor devolve ao salvar.
export function calcularPrevia(espaco, extras) {
  const n = (v) => Number(v || 0);
  return (
    n(espaco.valor_base) +
    extras.ajudantes * n(espaco.valor_taxa_ajudante) +
    extras.mesas * n(espaco.valor_taxa_mesa_extra) +
    extras.cadeiras * n(espaco.valor_taxa_cadeira_extra)
  );
}
