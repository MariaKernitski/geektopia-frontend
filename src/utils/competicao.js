export const ROTULO_MODALIDADE = { Solo: 'Individual', Dupla: 'Dupla', Grupo: 'Em grupo' };

// Situação de uma inscrição, do ponto de vista de quem se inscreveu.
// Fluxo: Enviada -> Em análise -> Aprovada -> (taxa paga) Confirmada.
// Competição sem taxa fica Confirmada assim que a organização aprova.
export function situacaoDaInscricao(i) {
  const taxa = Number(i.competicao?.valor_taxa_inscricao) || 0;
  const pago = i.pedido?.status_pedido === 'Pago';

  if (i.status_inscricao === 'Reprovado') {
    return { rotulo: 'Reprovada', tipo: 'erro', passo: 'A organização não aprovou esta inscrição.' };
  }
  if (i.status_inscricao === 'Aprovado') {
    if (taxa <= 0 || pago) {
      return { rotulo: 'Confirmada', tipo: 'ok', passo: 'Inscrição confirmada. É só comparecer no dia da competição!' };
    }
    if (i.pedido) return { rotulo: 'Aguardando pagamento', tipo: 'aviso', passo: 'Aprovada! Falta concluir o pagamento da taxa para garantir a vaga.', pagar: true };
    return { rotulo: 'Aprovada', tipo: 'ok', passo: 'A organização aprovou a sua inscrição. Pague a taxa para garantir a vaga.', pagar: true };
  }
  return { rotulo: 'Em análise', tipo: 'neutro', passo: 'A organização está avaliando o seu material. Volte aqui para acompanhar.' };
}
