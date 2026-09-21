import { describe, expect, it } from 'vitest';
import { situacaoDaInscricao } from '../src/utils/competicao';
import { situacaoDaSolicitacao } from '../src/utils/solicitacao';

describe('situação da inscrição em competição', () => {
  const comp = { valor_taxa_inscricao: 30 };
  it('em análise, aprovada (a pagar), aguardando pagamento e confirmada', () => {
    expect(situacaoDaInscricao({ status_inscricao: 'EmAnalise', competicao: comp }).rotulo).toBe('Em análise');
    const aprovada = situacaoDaInscricao({ status_inscricao: 'Aprovado', competicao: comp });
    expect(aprovada.rotulo).toBe('Aprovada');
    expect(aprovada.pagar).toBe(true);
    expect(aprovada.tipo).toBe('ok');
    expect(situacaoDaInscricao({ status_inscricao: 'Aprovado', competicao: comp, pedido: { status_pedido: 'Pendente' } }).rotulo).toBe('Aguardando pagamento');
    expect(situacaoDaInscricao({ status_inscricao: 'Aprovado', competicao: comp, pedido: { status_pedido: 'Pago' } }).rotulo).toBe('Confirmada');
  });
  it('sem taxa, aprovar já confirma; reprovada é vermelha', () => {
    expect(situacaoDaInscricao({ status_inscricao: 'Aprovado', competicao: { valor_taxa_inscricao: 0 } }).rotulo).toBe('Confirmada');
    expect(situacaoDaInscricao({ status_inscricao: 'Reprovado', competicao: comp }).tipo).toBe('erro');
  });
});

describe('situação da solicitação de espaço', () => {
  it('passa por análise, aprovada, aguardando pagamento e confirmada', () => {
    expect(situacaoDaSolicitacao({ status_solicitacao: 'EmAnalise' }).rotulo).toBe('Em análise');
    expect(situacaoDaSolicitacao({ status_solicitacao: 'Aprovado' }).rotulo).toBe('Aprovada');
    expect(situacaoDaSolicitacao({ status_solicitacao: 'Aprovado', pedido: { status_pedido: 'Pendente' } }).rotulo).toBe('Aguardando pagamento');
    expect(situacaoDaSolicitacao({ status_solicitacao: 'Aprovado', pedido: { status_pedido: 'Pago' } }).rotulo).toBe('Confirmada');
    expect(situacaoDaSolicitacao({ status_solicitacao: 'Reprovado' }).tipo).toBe('erro');
  });
});
