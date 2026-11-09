import { describe, expect, it } from 'vitest';
import { DICAS } from '../src/utils/dicas';

// Ids dos artigos da Central de Ajuda do servidor (geektopia-backend/src/utils/catalogoAjuda.js).
const ARTIGOS = ['criar-conta', 'entrar-na-conta', 'notificacoes', 'comprar-ingresso', 'pagamento-nao-confirmou', 'onde-estao-meus-ingressos', 'entrar-no-evento', 'virar-competidor', 'inscrever-competicao', 'acompanhar-inscricao', 'virar-expositor', 'solicitar-espaco', 'acompanhar-solicitacao', 'divulgar-evento', 'editar-perfil', 'trocar-senha', 'esqueci-senha', 'encerrar-conta', 'admin-criar-edicao', 'admin-lotes', 'admin-analisar', 'admin-checkin', 'admin-relatorios', 'admin-conteudo', 'admin-usuarios'];

describe('dicas de ajuda', () => {
  it('toda dica tem texto curto e, se aponta um artigo, ele existe', () => {
    for (const [chave, d] of Object.entries(DICAS)) {
      expect(d.texto?.length, chave).toBeGreaterThan(20);
      expect(d.texto.length, chave).toBeLessThan(260);
      if (d.artigo) expect(ARTIGOS, chave).toContain(d.artigo);
    }
  });
});
